import { createHash } from 'node:crypto';
import { getAllPosts, type PostMetadata } from '@/lib/posts';
import { readOgImageContent, type OgImageContent } from '@/lib/og-image';

// Bump when the renderer changes so social previews receive a fresh image URL.
const rendererVersion = 1;

function image(name: string, content: OgImageContent) {
  const revision = createHash('sha256')
    .update(JSON.stringify([rendererVersion, content]))
    .digest('hex')
    .slice(0, 16);
  // A revision refreshes social caches; the stable path keeps older URLs valid.
  return { id: name, content, url: `/og/${name}?v=${revision}` };
}

export function getDefaultOgImage() {
  return image('default', readOgImageContent(new URLSearchParams()));
}

export function getPostOgImage(post: PostMetadata) {
  const params = new URLSearchParams({ title: post.title });
  if (post.emoji) params.set('emoji', post.emoji);
  if (post.description) params.set('description', post.description);
  return image(`${post.year}-${post.slug}`, readOgImageContent(params));
}

export function getStaticOgImages() {
  return [getDefaultOgImage(), ...getAllPosts().map(getPostOgImage)];
}
