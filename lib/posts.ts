import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export interface PostMetadata {
  slug: string;
  title: string;
  emoji?: string;
  date: string;
  draft?: boolean;
  tags?: string[];
  description?: string;
  year: string;
  readingTime?: string;
}

export interface Post extends PostMetadata {
  content: string;
}

function getAllYears(): string[] {
  return fs.readdirSync(postsDirectory).filter((file) => {
    const stat = fs.statSync(path.join(postsDirectory, file));
    return stat.isDirectory();
  }).sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending
}

export function getAllPosts(includeDrafts = false): PostMetadata[] {
  const years = getAllYears();
  const allPosts: PostMetadata[] = [];

  years.forEach((year) => {
    const yearPath = path.join(postsDirectory, year);
    const files = fs.readdirSync(yearPath).filter((file) =>
      file.endsWith('.md') || file.endsWith('.mdx')
    );

    files.forEach((fileName) => {
      const slug = fileName.replace(/\.(md|mdx)$/, '');
      const fullPath = path.join(yearPath, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      // Skip drafts unless explicitly included
      if (!includeDrafts && data.draft) {
        return;
      }

      const stats = readingTime(content);

      allPosts.push({
        slug,
        title: data.title,
        emoji: data.emoji,
        date: data.date,
        draft: data.draft || false,
        tags: data.tags || [],
        description: data.description,
        year,
        readingTime: stats.text,
      });
    });
  });

  // Sort by date descending
  return allPosts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostsByYear(includeDrafts = false): Record<string, PostMetadata[]> {
  const posts = getAllPosts(includeDrafts);
  const postsByYear: Record<string, PostMetadata[]> = {};

  posts.forEach((post) => {
    if (!postsByYear[post.year]) {
      postsByYear[post.year] = [];
    }
    postsByYear[post.year].push(post);
  });

  return postsByYear;
}

export function getPostBySlug(year: string, slug: string, includeDrafts = false): Post | null {
  try {
    const fullPath = path.join(postsDirectory, year, `${slug}.mdx`);
    let fileContents: string;

    try {
      fileContents = fs.readFileSync(fullPath, 'utf8');
    } catch {
      // Try .md extension
      const mdPath = path.join(postsDirectory, year, `${slug}.md`);
      fileContents = fs.readFileSync(mdPath, 'utf8');
    }

    const { data, content } = matter(fileContents);

    // Skip drafts unless explicitly included
    if (!includeDrafts && data.draft) {
      return null;
    }

    const stats = readingTime(content);

    return {
      slug,
      title: data.title,
      emoji: data.emoji,
      date: data.date,
      draft: data.draft || false,
      tags: data.tags || [],
      description: data.description,
      year,
      readingTime: stats.text,
      content,
    };
  } catch {
    return null;
  }
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagsSet = new Set<string>();

  posts.forEach((post) => {
    post.tags?.forEach((tag) => tagsSet.add(tag));
  });

  return Array.from(tagsSet).sort();
}

export function getPostsByTag(tag: string, includeDrafts = false): PostMetadata[] {
  return getAllPosts(includeDrafts).filter((post) =>
    post.tags?.includes(tag)
  );
}
