"use client";

import { useEffect } from "react";

export function ScrollToAnchor() {
  useEffect(() => {
    // Wait for the page to fully load and hydrate
    const hash = window.location.hash;

    if (hash) {
      // Small delay to ensure MDX content is rendered
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  return null;
}
