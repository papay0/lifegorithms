"use client";

import * as React from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

interface HeadingWithLinkProps {
  level: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  id?: string;
  [key: string]: any;
}

export function HeadingWithLink({ level, children, id, ...props }: HeadingWithLinkProps) {
  const Tag = `h${level}` as any;

  const sizes = {
    1: "text-4xl font-bold mt-12 mb-6",
    2: "text-3xl font-semibold mt-10 mb-5",
    3: "text-2xl font-semibold mt-8 mb-4",
    4: "text-xl font-semibold mt-6 mb-3",
  };

  const handleCopyLink = () => {
    if (id && typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <Tag
      id={id}
      className={`${sizes[level]} text-gray-900 dark:text-white group relative scroll-mt-20`}
      {...props}
    >
      {children}
      {id && (
        <button
          onClick={handleCopyLink}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center align-middle text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
          aria-label="Copy link to heading"
          title="Copy link"
        >
          <Link2 size={level === 1 ? 20 : level === 2 ? 18 : 16} />
        </button>
      )}
    </Tag>
  );
}
