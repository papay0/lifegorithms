import { notFound } from "next/navigation";
import { serialize } from "next-mdx-remote/serialize";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { MDXContent } from "@/components/mdx-content";
import { ScrollToAnchor } from "@/components/scroll-to-anchor";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// Disable static generation for now due to build issues
// export async function generateStaticParams() {
//   const posts = getAllPosts();
//   return posts.map((post) => ({
//     year: post.year,
//     slug: post.slug,
//   }));
// }

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}) {
  const { year, slug } = await params;
  const post = getPostBySlug(year, slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  // Generate OG image URL with post details
  const ogImageUrl = new URL('/api/og', 'https://lifegorithms.com');
  ogImageUrl.searchParams.set('title', post.title);
  if (post.emoji) {
    ogImageUrl.searchParams.set('emoji', post.emoji);
  }
  if (post.description) {
    ogImageUrl.searchParams.set('description', post.description);
  }

  return {
    title: `${post.title} | Lifegorithms`,
    description: post.description || post.title,
    openGraph: {
      title: post.title,
      description: post.description || post.title,
      type: "article",
      publishedTime: post.date,
      authors: ["Arthur Papailhau"],
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description || post.title,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}) {
  const { year, slug } = await params;
  const post = getPostBySlug(year, slug);

  if (!post) {
    notFound();
  }

  const mdxSource = await serialize(post.content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "wrap",
            properties: {
              className: ["anchor"],
            },
          },
        ],
      ],
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ScrollToAnchor />
      <article className="mx-auto max-w-3xl px-6 py-12">
        {/* Top bar with back button and theme toggle */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to articles</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Post header */}
        <header className="mb-12">
          {post.emoji && (
            <div className="mb-6 text-6xl" aria-hidden="true">
              {post.emoji}
            </div>
          )}
          <h1 className="mb-4 text-5xl font-bold text-gray-900 dark:text-white">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            {post.readingTime && (
              <>
                <span>•</span>
                <span>{post.readingTime}</span>
              </>
            )}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-sm text-blue-700 dark:text-blue-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Post content */}
        <div className="prose prose-lg max-w-none">
          <MDXContent source={mdxSource} />
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to articles</span>
          </Link>
        </footer>
      </article>
    </div>
  );
}
