export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm mt-20">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="text-sm text-gray-600">
            © {currentYear} Arthur Papailhau. All rights reserved.
          </div>

          <div className="flex gap-6">
            <a
              href="https://mobile.twitter.com/papay0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Twitter
            </a>
            <a
              href="/rss.xml"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              RSS
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Built with Next.js, MDX, and TailwindCSS
        </div>
      </div>
    </footer>
  );
}
