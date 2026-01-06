"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";

interface ImageGridProps {
  images: string[];
  cols?: 2 | 3;
}

export function ImageGrid({ images, cols = 2 }: ImageGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const gridClass = cols === 3
    ? "grid grid-cols-2 md:grid-cols-3 gap-4 my-8"
    : "grid grid-cols-2 gap-4 my-8";

  const openLightbox = (index: number) => {
    setIsLoading(true);
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    setIsLoading(false);
  };

  const goToIndex = (index: number) => {
    if (index === selectedIndex) return;
    setIsLoading(true);
    setSelectedIndex(index);
  };

  const goToPrevious = useCallback(() => {
    if (selectedIndex === null) return;
    setIsLoading(true);
    setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
  }, [selectedIndex, images.length]);

  const goToNext = useCallback(() => {
    if (selectedIndex === null) return;
    setIsLoading(true);
    setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
  }, [selectedIndex, images.length]);

  // Scroll thumbnail into view when selectedIndex changes
  useEffect(() => {
    if (selectedIndex !== null && thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[selectedIndex] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, goToPrevious, goToNext]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedIndex]);

  return (
    <>
      <div className={gridClass}>
        {images.map((src, i) => (
          <Image
            key={i}
            src={src}
            width={800}
            height={600}
            className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            alt=""
            onClick={() => openLightbox(i)}
          />
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
            onClick={closeLightbox}
          >
            &times;
          </button>

          {/* Main image area */}
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            {/* Previous button */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-gray-300 z-10 p-4"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              &#8249;
            </button>

            {/* Image container */}
            <div
              className="relative max-w-[90vw] max-h-[70vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Shimmer loading placeholder */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[600px] h-[400px] max-w-[90vw] max-h-[60vh] rounded-lg bg-gray-800 overflow-hidden">
                    <div className="w-full h-full animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] animate-shimmer" />
                  </div>
                </div>
              )}

              {/* Actual image */}
              <Image
                key={selectedIndex}
                src={images[selectedIndex]}
                width={1200}
                height={900}
                className={`max-w-full max-h-[70vh] object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                alt=""
                priority
                onLoad={() => setIsLoading(false)}
              />
            </div>

            {/* Next button */}
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-gray-300 z-10 p-4"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              &#8250;
            </button>
          </div>

          {/* Image counter */}
          <div className="text-center text-white text-sm py-2">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Thumbnails */}
          <div
            className="w-full px-4 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              ref={thumbnailsRef}
              className="flex gap-2 overflow-x-auto py-2 justify-start md:justify-center scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => goToIndex(i)}
                  className={`flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 ${
                    i === selectedIndex
                      ? 'ring-2 ring-white opacity-100 scale-105'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <Image
                    src={src}
                    width={80}
                    height={60}
                    className="w-16 h-12 md:w-20 md:h-15 object-cover"
                    alt=""
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </>
  );
}
