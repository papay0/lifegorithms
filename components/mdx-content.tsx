"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Image from "next/image";
import Link from "next/link";

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
  a: (props: any) => (
    <Link
      {...props}
      className="text-blue-600 hover:text-blue-700 underline"
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
    />
  ),
  h1: (props: any) => (
    <h1 className="text-4xl font-bold mt-12 mb-6 text-gray-900" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="text-3xl font-semibold mt-10 mb-5 text-gray-900" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800" {...props} />
  ),
  h4: (props: any) => (
    <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-800" {...props} />
  ),
  p: (props: any) => <p className="mb-4 leading-7 text-gray-700" {...props} />,
  ul: (props: any) => (
    <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />
  ),
  ol: (props: any) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote
      className="border-l-4 border-blue-500 pl-4 py-2 my-6 italic text-gray-600 bg-blue-50 rounded-r"
      {...props}
    />
  ),
  code: (props: any) => {
    // Inline code
    if (!props.className) {
      return (
        <code
          className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        />
      );
    }
    // Code blocks are handled by pre
    return <code {...props} />;
  },
  pre: (props: any) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm" {...props} />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-200" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th className="px-4 py-2 bg-blue-50 text-left text-gray-700 font-semibold" {...props} />
  ),
  td: (props: any) => (
    <td className="px-4 py-2 border-t border-gray-200 text-gray-700" {...props} />
  ),
  hr: (props: any) => <hr className="my-8 border-gray-300" {...props} />,
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
