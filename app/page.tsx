import Image from "next/image";
import Link from "next/link";
import { getPostsByYear, getAllPosts } from "@/lib/posts";
import { Search } from "@/components/search";

export default function Home() {
  const postsByYear = getPostsByYear();
  const allPosts = getAllPosts();
  const years = Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-90" />
        <Image
          src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Profile Section */}
        <div className="mb-16 flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500 text-4xl shadow-lg">
            👋
          </div>
          <div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">Lifegorithms</h1>
            <p className="text-lg text-gray-600">
              Personal blog by{" "}
              <a
                href="https://mobile.twitter.com/papay0"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Arthur Papailhau
              </a>
            </p>
            <p className="text-gray-600">Software Engineer @Uber (Eats)</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-12">
          <Search posts={allPosts} />
        </div>

        {/* Articles Section */}
        <div>
          <h2 className="mb-8 text-3xl font-bold text-gray-900">Articles</h2>

          {years.map((year) => (
            <div key={year} className="mb-12">
              <h3 className="mb-6 text-2xl font-semibold text-gray-800">{year}</h3>
              <div className="space-y-3">
                {postsByYear[year].map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${year}/${post.slug}`}
                    className="group block rounded-lg border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {post.emoji && (
                        <span className="text-3xl" aria-hidden="true">
                          {post.emoji}
                        </span>
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h4>
                        {post.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {post.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
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
                          {post.tags && post.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex gap-2">
                                {post.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
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
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
