"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Image from "next/image";
import Link from "next/link";
import { HeadingWithLink } from "./heading-with-link";
import { ImageGrid } from "./image-grid";

const components = {
  img: (props: any) => (
    <Image
      {...props}
      width={800}
      height={600}
      className="rounded-lg my-8"
      alt={props.alt || ""}
    />
  ),
  a: (props: any) => {
    // Don't style heading anchors as links
    if (props.className?.includes('anchor')) {
      return <span {...props} className="no-underline text-gray-900 dark:text-white" />;
    }
    return (
      <Link
        {...props}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
        target={props.href?.startsWith("http") ? "_blank" : undefined}
        rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
      />
    );
  },
  h1: (props: any) => <HeadingWithLink level={1} {...props} />,
  h2: (props: any) => <HeadingWithLink level={2} {...props} />,
  h3: (props: any) => <HeadingWithLink level={3} {...props} />,
  h4: (props: any) => <HeadingWithLink level={4} {...props} />,
  p: (props: any) => <p className="mb-4 leading-7 text-gray-700 dark:text-gray-200" {...props} />,
  ul: (props: any) => (
    <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-200" {...props} />
  ),
  ol: (props: any) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-200" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote
      className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 my-6 italic text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-gray-800 rounded-r"
      {...props}
    />
  ),
  code: (props: any) => {
    // Inline code
    if (!props.className) {
      return (
        <code
          className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        />
      );
    }
    // Code blocks are handled by pre
    return <code {...props} />;
  },
  pre: (props: any) => (
    <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm" {...props} />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th className="px-4 py-2 bg-blue-50 dark:bg-gray-800 text-left text-gray-700 dark:text-gray-300 font-semibold" {...props} />
  ),
  td: (props: any) => (
    <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300" {...props} />
  ),
  hr: (props: any) => <hr className="my-8 border-gray-300 dark:border-gray-700" {...props} />,
  ImageGrid: ImageGrid,
};

interface MDXContentProps {
  source: MDXRemoteSerializeResult;
}

export function MDXContent({ source }: MDXContentProps) {
  return (
    <div className="prose prose-lg max-w-none">
      <MDXRemote {...source} components={components} />
    </div>
  );
}
