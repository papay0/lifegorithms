import Image from "next/image";
import Link from "next/link";
import { getPostsByYear, getAllPosts } from "@/lib/posts";
import { Search } from "@/components/search";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReadingProgress } from "@/components/reading-progress";

export default function Home() {
  const postsByYear = getPostsByYear();
  const allPosts = getAllPosts();
  const years = Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <>
      <ReadingProgress />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section - Compact */}
      <div className="relative h-32 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-90" />
        <Image
          src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        {/* Theme Toggle - Absolute positioning over hero */}
        <div className="absolute top-4 right-6 z-20">
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-12">
        {/* Profile Section - Overlapping with subtle shadow */}
        <div className="-mt-12 mb-8 relative z-10">
          <div className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 rounded-lg p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-4xl shadow-lg shrink-0">
                👋
              </div>
              <div className="flex-1">
                <h1 className="mb-2 text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Lifegorithms</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-tight">
                  Personal blog by{" "}
                  <a
                    href="https://mobile.twitter.com/papay0"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Arthur Papailhau
                  </a>
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-tight">Former Software Engineer @Uber (Eats) & Meta AI</p>
                <p className="text-gray-600 dark:text-gray-400 leading-tight">Currently building my own startup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search - Glassmorphic */}
        <div className="mb-10">
          <Search posts={allPosts} />
        </div>

        {/* Articles Section - Timeline Style */}
        <div>
          <h2 className="mb-10 text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Articles</h2>

          {years.map((year) => (
            <div key={year} className="mb-16 relative">
              {/* Year Header - Clean Badge */}
              <div className="mb-8 inline-block">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 px-5 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                  {year}
                </h3>
              </div>

              {/* Timeline Container */}
              <div className="relative pl-8 sm:pl-10">
                {/* Vertical Timeline Line */}
                <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-400 via-purple-400 to-blue-400 dark:from-blue-600 dark:via-purple-600 dark:to-blue-600 opacity-40">
                  <div className="timeline-particles"></div>
                </div>

                <div className="space-y-6">
                  {postsByYear[year].map((post, index) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${year}/${post.slug}`}
                      className="group block"
                    >
                      {/* Article Card - Clean with Animated Border */}
                      <div className="rounded-lg backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-md transition-all hover:shadow-lg sm:hover:translate-x-1 relative overflow-hidden group-hover:border-blue-300 dark:group-hover:border-blue-600">
                        <div className="flex items-start gap-3 sm:gap-5">
                          {post.emoji && (
                            <span className="text-3xl sm:text-4xl shrink-0 group-hover:scale-105 transition-transform" aria-hidden="true">
                              {post.emoji}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-2">
                              {post.title}
                            </h4>
                            {post.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                                {post.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                              <time dateTime={post.date} className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {new Date(post.date).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </time>
                              {post.readingTime && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                    </svg>
                                    {post.readingTime}
                                  </span>
                                </>
                              )}
                              {post.tags && post.tags.length > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex gap-2">
                                    {post.tags.slice(0, 2).map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
