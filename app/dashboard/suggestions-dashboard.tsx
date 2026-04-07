"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { REFRESH_EVENT } from "./blocked-searches-library";
import { CheckSearchTermSection } from "./check-search-term-section";
import { UpgradeButton } from "./upgrade-button";

async function startStripeCheckout(): Promise<void> {
  const res = await fetch("/api/stripe/checkout", { method: "POST" });
  const data: unknown = await res.json();
  if (
    typeof data === "object" &&
    data !== null &&
    "url" in data &&
    typeof (data as { url: unknown }).url === "string"
  ) {
    window.location.href = (data as { url: string }).url;
  }
}

type WeekOverWeekPayload = {
  isFirstScan: boolean;
  delta: number;
  previousTotal: number | null;
};

type WastedTerm = {
  search_term: string;
  cost: number;
  impressions: number;
  conversions: number;
};

type TermRow = WastedTerm & {
  id: string;
  status: "pending" | "dismissed";
  /** Set when add-negative API fails; cleared on retry. */
  addError?: string;
};

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const listOuter: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 10,
  overflow: "hidden",
  marginBottom: 8,
};

const rowBase: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  transition: "background 0.15s",
  gap: 16,
};

const blockBtn: CSSProperties = {
  fontSize: 12,
  fontWeight: 400,
  color: "#0d9f6e",
  background: "transparent",
  border: "1px solid rgba(13,159,110,0.35)",
  borderRadius: 6,
  padding: "5px 12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const dismissBtn: CSSProperties = {
  fontSize: 12,
  color: "#374151",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "5px 8px",
};

function OnboardingSpinner() {
  return (
    <div
      className="h-9 w-9 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent"
      aria-hidden
    />
  );
}

type SuggestionsDashboardProps = {
  /**
   * `connected_accounts.created_at` within the last 10 minutes (server).
   * Used for the loading welcome state and the “First scan complete” banner.
   */
  isFreshOnboarding?: boolean;
  /** Pro / effective Pro (e.g. just upgraded via URL). */
  isPro?: boolean;
};

export function SuggestionsDashboard({
  isFreshOnboarding = false,
  isPro = false,
}: SuggestionsDashboardProps) {
  const [rows, setRows] = useState<TermRow[]>([]);
  const [totalWastedFound, setTotalWastedFound] = useState<number>(0);
  /** Total suggestions from the last API load (for free paywall copy). */
  const [scanTotalCount, setScanTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnectRequired, setReconnectRequired] = useState(false);
  const [showUpgradeRequired, setShowUpgradeRequired] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  /** Free user clicked Block — show inline Pro prompt on this card. */
  const [blockUpgradePromptId, setBlockUpgradePromptId] = useState<string | null>(
    null
  );
  /** id -> expiry timestamp for "Dismissed. Upgrade…" hint under card. */
  const [dismissHintUntil, setDismissHintUntil] = useState<Record<string, number>>(
    {}
  );
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [dismissHintFade, setDismissHintFade] = useState<Record<string, boolean>>(
    {}
  );
  const [showFirstScanBanner, setShowFirstScanBanner] = useState(false);
  const [weekOverWeek, setWeekOverWeek] = useState<WeekOverWeekPayload | null>(
    null
  );
  const [healthScore, setHealthScore] = useState<number | null>(null);

  useEffect(() => {
    if (!isFreshOnboarding) {
      setShowFirstScanBanner(false);
      return;
    }
    try {
      if (localStorage.getItem("first_scan_seen") === "true") {
        setShowFirstScanBanner(false);
        return;
      }
      setShowFirstScanBanner(true);
    } catch {
      setShowFirstScanBanner(false);
    }
  }, [isFreshOnboarding]);

  useEffect(() => {
    if (!showFirstScanBanner) return;
    try {
      localStorage.setItem("first_scan_seen", "true");
    } catch {
      // ignore
    }
  }, [showFirstScanBanner]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setReconnectRequired(false);
      setShowUpgradeRequired(false);
      try {
        const res = await fetch("/api/ads/search-terms", { cache: "no-store" });
        const data: unknown = await res.json();

        if (!res.ok) {
          const errCode =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string"
              ? (data as { error: string }).error
              : null;

          if (errCode === "reconnect_required") {
            if (!cancelled) {
              setReconnectRequired(true);
              setRows([]);
              setTotalWastedFound(0);
              setScanTotalCount(0);
              setWeekOverWeek(null);
              setHealthScore(null);
            }
            return;
          }

          const msg = errCode ?? `Request failed (${res.status})`;
          if (!cancelled) {
            setError(msg);
            setHealthScore(null);
          }
          return;
        }

        let terms: WastedTerm[];
        let wow: WeekOverWeekPayload | null = null;
        let health: number | null = null;

        if (Array.isArray(data)) {
          terms = data as WastedTerm[];
        } else if (
          typeof data === "object" &&
          data !== null &&
          "terms" in data &&
          Array.isArray((data as { terms: unknown }).terms)
        ) {
          const payload = data as {
            terms: WastedTerm[];
            weekOverWeek?: WeekOverWeekPayload;
            healthScore?: number;
          };
          terms = payload.terms;
          wow = payload.weekOverWeek ?? null;
          health =
            typeof payload.healthScore === "number" &&
            !Number.isNaN(payload.healthScore)
              ? Math.round(payload.healthScore)
              : null;
        } else {
          if (!cancelled) {
            setError("Unexpected response from server.");
            setHealthScore(null);
          }
          return;
        }

        terms.sort(
          (a, b) => (Number(b.cost) || 0) - (Number(a.cost) || 0)
        );
        const total = terms.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
        const withIds: TermRow[] = terms.map((t, i) => ({
          ...t,
          id: `${i}-${t.search_term}`,
          status: "pending" as const,
        }));

        if (!cancelled) {
          setReconnectRequired(false);
          setTotalWastedFound(total);
          setScanTotalCount(terms.length);
          setRows(withIds);
          setWeekOverWeek(wow);
          setHealthScore(health);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load suggestions.");
          setHealthScore(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedPendingAll = useMemo(
    () =>
      rows
        .filter((r) => r.status === "pending")
        .sort(
          (a, b) => (Number(b.cost) || 0) - (Number(a.cost) || 0)
        ),
    [rows]
  );

  const shownPending = useMemo(
    () =>
      isPro ? sortedPendingAll : sortedPendingAll.slice(0, 3),
    [isPro, sortedPendingAll]
  );

  const shownIds = useMemo(
    () => new Set(shownPending.map((r) => r.id)),
    [shownPending]
  );

  const visibleForList = useMemo(
    () =>
      rows.filter((r) => {
        if (r.status === "pending") {
          return isPro || shownIds.has(r.id);
        }
        if (r.status === "dismissed" && dismissHintUntil[r.id] != null) {
          return true;
        }
        return false;
      }),
    [rows, isPro, shownIds, dismissHintUntil]
  );

  const moreHiddenCount = Math.max(0, scanTotalCount - 3);

  const addAsNegative = useCallback(async (id: string, term: WastedTerm) => {
    if (!isPro) {
      setBlockUpgradePromptId(id);
      return;
    }

    setAddingId(id);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, addError: undefined } : r))
    );
    try {
      const res = await fetch("/api/ads/add-negative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search_term: term.search_term,
          cost: term.cost,
          impressions: term.impressions,
        }),
      });
      const data: unknown = await res.json();

      if (res.status === 403) {
        const errCode =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : null;
        if (errCode === "upgrade_required") {
          setShowUpgradeRequired(true);
          return;
        }
      }

      const success =
        typeof data === "object" &&
        data !== null &&
        "success" in data &&
        (data as { success: unknown }).success === true;

      if (res.ok && success) {
        setShowUpgradeRequired(false);
        setRows((prev) => prev.filter((r) => r.id !== id));
        window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
      } else {
        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, addError: "Failed to add — try again" }
              : r
          )
        );
      }
    } catch {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, addError: "Failed to add — try again" } : r
        )
      );
    } finally {
      setAddingId(null);
    }
  }, [isPro]);

  const dismiss = useCallback(
    (id: string) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "dismissed" as const } : r
        )
      );
      if (!isPro) {
        setDismissHintUntil((prev) => ({ ...prev, [id]: Date.now() + 3000 }));
        window.setTimeout(() => {
          setDismissHintFade((prev) => ({ ...prev, [id]: true }));
        }, 2500);
        window.setTimeout(() => {
          setDismissHintUntil((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setDismissHintFade((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setRows((prev) => prev.filter((r) => r.id !== id));
        }, 3000);
      }
    },
    [isPro]
  );

  const handleCheckout = useCallback(() => {
    setCheckoutLoading(true);
    void startStripeCheckout().finally(() => setCheckoutLoading(false));
  }, []);

  if (loading && isFreshOnboarding) {
    return (
      <div className="mt-8">
        <div
          className="rounded-xl border border-brand/35 bg-brand/[0.08] p-5 sm:p-6"
          role="status"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <OnboardingSpinner />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">
                Welcome to Wasted Spend
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Your first scan is running. We&apos;re analyzing your search terms
                from the last 30 days to find budget you can recover. This takes about
                30 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-subtle bg-card p-8 text-center text-slate-400">
        Loading wasted search terms…
      </div>
    );
  }

  if (reconnectRequired) {
    return (
      <div className="mt-8 rounded-xl border border-amber-500/50 bg-amber-950/35 px-5 py-6 shadow-lg shadow-black/20 sm:px-6">
        <p className="text-base font-semibold text-amber-100">
          Your Google Ads connection has expired.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-200/90">
          Reconnect your account to resume scans.
        </p>
        <Link
          href="/api/auth/google"
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1a]"
        >
          Reconnect account
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-xl border border-red-500/40 bg-red-950/40 p-6 text-red-200">
        <p className="font-medium">Couldn’t load suggestions</p>
        <p className="mt-2 text-sm text-red-300/90">{error}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-8">
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 32,
              paddingBottom: 32,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#0d9f6e",
                flexShrink: 0,
              }}
              aria-hidden
            />
            <p style={{ fontSize: 13, color: "#4b5563", margin: 0 }}>
              No new waste found this week · Next scan Monday at 9am
            </p>
          </div>

          {isPro ? (
            <CheckSearchTermSection
              heading="Waste check"
              intro="Test a search term before you bid on it."
              headingMarginBottom={16}
              outerMarginBottom={0}
            />
          ) : (
            <>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#4b5563",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Waste check
              </p>
              <div
                style={{
                  opacity: 0.5,
                  pointerEvents: "none",
                }}
              >
                <input
                  type="text"
                  disabled
                  placeholder="e.g. google ads free trial"
                  aria-label="Waste check preview (Pro only)"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "#e8eaf0",
                    outline: "none",
                    fontFamily: "Inter, sans-serif",
                  }}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <p
                  style={{
                    fontSize: 13,
                    color: "#4b5563",
                    marginBottom: 8,
                    marginTop: 0,
                  }}
                >
                  Waste Check is a Pro feature. Upgrade to test search terms before
                  you bid on them.
                </p>
                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleCheckout()}
                  style={{
                    background: "#0d9f6e",
                    color: "white",
                    border: "none",
                    borderRadius: 7,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: checkoutLoading ? "wait" : "pointer",
                    opacity: checkoutLoading ? 0.7 : 1,
                  }}
                >
                  {checkoutLoading ? "Redirecting…" : "Upgrade to Pro — $29/mo"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const dollarHero = totalWastedFound.toFixed(2);
  const showWasteHeroBig = totalWastedFound > 0;
  const showZeroWasteHero = rows.length > 0 && totalWastedFound === 0;
  const showHeroSection = showWasteHeroBig || showZeroWasteHero;

  return (
    <div className="mt-8 space-y-10">
      {showHeroSection ? (
        <div
          style={{
            marginBottom: 40,
            paddingBottom: 32,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#4b5563",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 10,
              marginTop: 32,
            }}
          >
            Wasted this month
          </p>
          {showWasteHeroBig ? (
            <p
              style={{
                fontSize: 52,
                fontWeight: 600,
                color: "#0d9f6e",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              ${dollarHero}
            </p>
          ) : null}
          {healthScore != null ? (
            healthScore < 60 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "#ef4444",
                  marginTop: showWasteHeroBig ? 6 : 0,
                  marginBottom: 0,
                }}
              >
                Account health: {healthScore}/100 — action needed
              </p>
            ) : healthScore < 80 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "#f59e0b",
                  marginTop: showWasteHeroBig ? 6 : 0,
                  marginBottom: 0,
                }}
              >
                Account health: {healthScore}/100 — improving
              </p>
            ) : (
              <p
                style={{
                  fontSize: 12,
                  color: "#0d9f6e",
                  marginTop: showWasteHeroBig ? 6 : 0,
                  marginBottom: 0,
                }}
              >
                Account health: {healthScore}/100 — well optimized
              </p>
            )
          ) : null}
          {showWasteHeroBig ? (
            <p
              style={{
                fontSize: 13,
                color: "#4b5563",
                fontWeight: 400,
                marginTop: healthScore != null ? 8 : 0,
              }}
            >
              across {scanTotalCount} search terms · last 30 days
            </p>
          ) : (
            <p
              style={{
                fontSize: 13,
                color: "#0d9f6e",
                fontWeight: 400,
                marginTop: healthScore != null ? 8 : 0,
                marginBottom: 0,
              }}
            >
              Your account is clean — no waste detected
            </p>
          )}
          {weekOverWeek ? (
            weekOverWeek.isFirstScan ? (
              <p
                style={{
                  fontSize: 12,
                  color: "#4b5563",
                  marginTop: 6,
                  marginBottom: 0,
                }}
              >
                First scan — check back next week to see progress
              </p>
            ) : weekOverWeek.delta > 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "#ef4444",
                  marginTop: 6,
                  marginBottom: 0,
                }}
              >
                ↑ {formatMoney(weekOverWeek.delta)} more than last week
              </p>
            ) : weekOverWeek.delta < 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "#0d9f6e",
                  marginTop: 6,
                  marginBottom: 0,
                }}
              >
                ↓ {formatMoney(Math.abs(weekOverWeek.delta))} less than last week —
                blocking is working
              </p>
            ) : (
              <p
                style={{
                  fontSize: 12,
                  color: "#4b5563",
                  marginTop: 6,
                  marginBottom: 0,
                }}
              >
                Same wasted spend as your last scan
              </p>
            )
          ) : null}
        </div>
      ) : null}

      {showFirstScanBanner && totalWastedFound > 0 ? (
        <div
          className="rounded-xl border border-brand/35 bg-brand/[0.08] p-5 sm:p-6"
          role="status"
        >
          <p className="text-base font-medium text-white">
            First scan complete — we found {formatMoney(totalWastedFound)} in
            wasted spend
          </p>
        </div>
      ) : null}

      {showUpgradeRequired ? (
        <div
          className="rounded-xl border border-brand/40 bg-brand/[0.09] p-5 shadow-lg shadow-black/20 sm:p-6"
          role="status"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-base font-semibold text-white">
              Upgrade to Pro to block searches
            </p>
            <button
              type="button"
              onClick={() => setShowUpgradeRequired(false)}
              className="shrink-0 text-sm text-slate-500 transition hover:text-slate-300"
            >
              Dismiss
            </button>
          </div>
          <UpgradeButton />
        </div>
      ) : null}

      <section>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#4b5563",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginTop: 32,
            marginBottom: 16,
          }}
        >
          Searches wasting your budget
        </p>
        {visibleForList.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-subtle bg-card px-4 py-8 text-center text-sm text-slate-500">
            No searches left in this scan. Run another check later for new waste,
            or review blocked terms in your library below.
          </p>
        ) : (
          <>
            <div style={listOuter}>
              {visibleForList.map((term, index) => {
                const isLast = index === visibleForList.length - 1;
                const rowStyle: CSSProperties = isLast
                  ? { ...rowBase, borderBottom: "none" }
                  : rowBase;

                if (term.status === "dismissed") {
                  return (
                    <div key={term.id} style={rowStyle}>
                      <p
                        className={`text-xs leading-relaxed text-slate-500 transition-opacity duration-500 ${
                          dismissHintFade[term.id] ? "opacity-0" : "opacity-100"
                        }`}
                      >
                        Dismissed. Upgrade to Pro to block searches permanently
                        instead of just hiding them.
                      </p>
                    </div>
                  );
                }

                const showBlockUpgrade =
                  !isPro && blockUpgradePromptId === term.id;

                if (showBlockUpgrade) {
                  return (
                    <div key={term.id} style={rowStyle}>
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-white">
                            Blocking searches requires Pro
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-300">
                            Upgrade to Pro to block this search and protect your
                            budget automatically every week.
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={checkoutLoading}
                            onClick={() => handleCheckout()}
                            className="rounded-md border border-brand/30 bg-brand-light px-3 py-1 text-xs font-medium text-brand transition hover:bg-brand/20 disabled:opacity-60"
                          >
                            {checkoutLoading ? "Redirecting…" : "Upgrade to Pro"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBlockUpgradePromptId(null)}
                            className="text-xs text-slate-500 transition hover:text-slate-300"
                          >
                            Maybe later
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={term.id} style={rowStyle}>
                    <div className="min-w-0 flex-1">
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 400,
                          color: "#e8eaf0",
                          marginBottom: 4,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {term.search_term}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#4b5563",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#ef4444",
                            display: "inline-block",
                          }}
                          aria-hidden
                        />
                        ${Number(term.cost).toFixed(2)} wasted ·{" "}
                        {term.impressions.toLocaleString()} impressions
                      </p>
                      {term.addError ? (
                        <p
                          className="mt-3 text-sm font-medium text-red-400"
                          role="alert"
                        >
                          {term.addError}
                        </p>
                      ) : null}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <button
                        type="button"
                        disabled={addingId === term.id}
                        style={blockBtn}
                        className="transition-colors hover:bg-[rgba(13,159,110,0.08)]"
                        onClick={() => void addAsNegative(term.id, term)}
                      >
                        {addingId === term.id ? "Blocking..." : "Block this search"}
                      </button>
                      <button
                        type="button"
                        style={dismissBtn}
                        onClick={() => dismiss(term.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {!isPro && moreHiddenCount > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "16px 18px",
                  background: "rgba(13,159,110,0.05)",
                  border: "1px solid rgba(13,159,110,0.15)",
                  borderRadius: 10,
                  marginTop: 8,
                }}
                role="region"
                aria-label="Upgrade to see all wasted searches"
              >
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#e8eaf0",
                      marginBottom: 3,
                    }}
                  >
                    {moreHiddenCount} more wasted searches hidden
                  </p>
                  <p style={{ fontSize: 12, color: "#4b5563" }}>
                    Upgrade to Pro to see all of them and block in one click
                  </p>
                </div>
                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleCheckout()}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "white",
                    background: "#0d9f6e",
                    border: "none",
                    borderRadius: 7,
                    padding: "9px 18px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {checkoutLoading ? "Redirecting…" : "Upgrade — $29/mo"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {isPro ? <CheckSearchTermSection /> : null}
    </div>
  );
}
