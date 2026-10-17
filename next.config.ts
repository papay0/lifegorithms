import type { NextConfig } from "next";
import mediaAliases from "./config/media-aliases.json";

function legacyMediaSource(source: string) {
  // Public files accept percent-encoded unreserved characters; preserve those URLs too.
  const pattern = source.slice(1).replace(/[A-Za-z0-9_.-]/g, (character) => {
    const literal = character === "." ? "\\." : character;
    const hex = character.charCodeAt(0).toString(16).replace(/[a-f]/g, (digit) => `[${digit}${digit.toUpperCase()}]`);
    return `(?:${literal}|%${hex})`;
  });
  return `/:legacyMedia(${pattern})`;
}

const nextConfig: NextConfig = {
  async rewrites() {
    // Keep old public URLs (including Next Image sources) working after deduplication.
    return mediaAliases.map(({ source, destination }) => ({
      source: legacyMediaSource(source),
      destination,
    }));
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "media2.giphy.com",
      },
      {
        protocol: "https",
        hostname: "media3.giphy.com",
      },
    ],
  },
  experimental: {
    mdxRs: false,
  },
};

export default nextConfig;
