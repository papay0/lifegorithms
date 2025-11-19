"use client";

import { useState, useEffect } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import Link from "next/link";
import { PostMetadata } from "@/lib/posts";

interface SearchProps {
  posts: PostMetadata[];
}

export function Search({ posts }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PostMetadata[]>([]);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery) ||
        post.description?.toLowerCase().includes(searchQuery) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(searchQuery))
    );

    setResults(filtered);
  }, [query, posts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:border-blue-400 transition-colors"
      >
        <SearchIcon size={16} />
        <span>Search articles...</span>
        <kbd className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="mx-auto mt-20 max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-lg bg-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-gray-200 p-4">
            <SearchIcon size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-lg outline-none"
              autoFocus
            />
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {results.length > 0 && (
            <div className="max-h-96 overflow-y-auto p-2">
              {results.map((post) => (
                <Link
                  key={`${post.year}-${post.slug}`}
                  href={`/blog/${post.year}/${post.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg p-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {post.emoji && (
                      <span className="text-2xl" aria-hidden="true">
                        {post.emoji}
                      </span>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {post.description}
                        </p>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        {new Date(post.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No articles found for "{query}"
            </div>
          )}

          {!query && (
            <div className="p-8 text-center text-sm text-gray-500">
              Start typing to search articles...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
