"use client";

import { useState } from "react";

const STORAGE_KEY = "onboarding_dismissed";

type Props = {
  /** Suggests showing after connect / fresh account; ignored if onboarding was dismissed. */
  show: boolean;
};

export function PostConnectBanner({ show }: Props) {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      return true;
    }
  });

  /** localStorage wins over `?connected=1` or other server hints. */
  if (!showOnboarding || !show) return null;

  return (
    <div
      className="rounded-xl border border-sky-500/30 bg-sky-950/35 px-4 py-4 text-sm text-sky-100/95 sm:px-5"
      role="status"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="font-semibold text-white">How this works</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-300">
            <li>
              We looked at your last 30 days of search terms and found queries that
              cost you money without converting.
            </li>
            <li>
              Review the list below and block anything that doesn&apos;t belong.
              Nothing changes in your account until you approve it.
            </li>
            <li>
              We&apos;ll scan again every Monday and email you if we find new ones.
            </li>
          </ol>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "true");
            setShowOnboarding(false);
          }}
          className="shrink-0 rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1a] sm:py-2"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
