"use client";

import { useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="my-8 p-4 bg-gray-800 rounded-lg text-center text-gray-400">
        Video could not be loaded
      </div>
    );
  }

  return (
    <div className="my-8">
      <video
        className="w-full rounded-lg max-h-[600px] object-contain bg-black"
        controls
        playsInline
        poster={poster}
        preload="auto"
        onError={() => setError(true)}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/quicktime" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
