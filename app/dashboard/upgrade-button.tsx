"use client";

import { useState } from "react";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data: unknown = await res.json();

      if (
        typeof data === "object" &&
        data !== null &&
        "url" in data &&
        typeof (data as { url: unknown }).url === "string"
      ) {
        window.location.href = (data as { url: string }).url;
        return;
      }

      const msg =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Could not start checkout.";
      setError(msg);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleUpgrade()}
        className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-[#0a0f1a] disabled:opacity-60 sm:w-auto sm:min-h-0 sm:py-2.5"
      >
        {loading ? "Redirecting…" : "Upgrade now"}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
