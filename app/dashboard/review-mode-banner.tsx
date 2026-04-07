"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "seen_review_banner";

/**
 * Shows the review-mode reassurance strip once per browser; then hides forever.
 */
export function ReviewModeBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        return;
      }
      setShow(true);
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="border-b border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-center text-xs font-medium leading-snug text-amber-100/95 sm:text-sm"
      role="status"
    >
      Review mode — nothing is blocked until you approve it
    </div>
  );
}
