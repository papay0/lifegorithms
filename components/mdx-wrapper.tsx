"use client";

import dynamic from "next/dynamic";
import { MDXRemoteSerializeResult } from "next-mdx-remote";

// Dynamically import MDXContent with SSR disabled to avoid React hooks error
const MDXContent = dynamic(
  () => import("./mdx-content").then((mod) => mod.MDXContent),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    ),
  }
);

interface MDXWrapperProps {
  source: MDXRemoteSerializeResult;
}

export function MDXWrapper({ source }: MDXWrapperProps) {
  return <MDXContent source={source} />;
}
