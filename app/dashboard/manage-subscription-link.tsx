"use client";

import { useCallback, useState } from "react";

type ManageSubscriptionLinkProps = {
  className?: string;
  /** Defaults to “Manage subscription →”. */
  label?: string;
};

export function ManageSubscriptionLink({
  className = "border-0 bg-transparent p-0 text-left text-sm text-slate-400 hover:text-white cursor-pointer disabled:cursor-wait disabled:opacity-60",
  label = "Manage subscription →",
}: ManageSubscriptionLinkProps) {
  const [loading, setLoading] = useState(false);

  const openPortal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
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
          : "Could not open billing portal.";
      console.error("[ManageSubscriptionLink]", msg);
      alert(msg);
    } catch (e) {
      console.error("[ManageSubscriptionLink]", e);
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void openPortal()}
      className={className}
    >
      {loading ? "Opening…" : label}
    </button>
  );
}
