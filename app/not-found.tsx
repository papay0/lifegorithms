"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="max-w-2xl w-full text-center">
          {/* Cute illustration */}
          <div className="mb-8">
            <span className="text-8xl sm:text-9xl" role="img" aria-label="map">
              🗺️
            </span>
          </div>

          {/* 404 Badge */}
          <div className="inline-block mb-6">
            <span className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              404
            </span>
          </div>

          {/* Message */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Oops! This page went on an adventure
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            The page you're looking for might have moved, been renamed, or is just taking a coffee break.
          </p>

          {/* Countdown */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Redirecting to homepage in{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">{countdown}</span>{" "}
            second{countdown !== 1 ? "s" : ""}...
          </p>

          {/* Home Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Take me home now
          </Link>

          {/* Fun fact */}
          <p className="mt-12 text-sm text-gray-400 dark:text-gray-500 italic">
            Fun fact: The first 404 error came from room 404 at CERN, where the original web servers were housed.
          </p>
        </div>
      </div>
    </div>
  );
}
