import Link from "next/link";
import { getAllTags } from "@/lib/posts";

export function Navigation() {
  const tags = getAllTags();

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-4xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            Lifegorithms
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Articles
            </Link>
            <a
              href="https://mobile.twitter.com/papay0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
