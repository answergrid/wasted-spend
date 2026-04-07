"use client";

import { useCallback, useEffect, useState } from "react";

export function DisconnectAccountSection() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/disconnect", { method: "POST" });
      const data: unknown = await res.json();

      const success =
        res.ok &&
        typeof data === "object" &&
        data !== null &&
        "success" in data &&
        (data as { success: unknown }).success === true;

      if (success) {
        window.location.href = "/";
        return;
      }

      const msg =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Could not disconnect. Try again.";
      alert(msg);
    } catch {
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: "1px solid rgba(255,255,255,0.04)",
        textAlign: "center",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontSize: 11,
          color: "#2d3748",
          textDecoration: "none",
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        Disconnect Google Ads account
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={() => !loading && setOpen(false)}
        >
        <div
          className="w-full max-w-md rounded-xl border border-subtle bg-card p-6 shadow-xl shadow-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disconnect-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="disconnect-dialog-title"
              className="text-lg font-semibold text-white"
            >
              Disconnect account?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              This will remove your Google Ads connection and all blocked search
              history. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void onConfirm()}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {loading ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
