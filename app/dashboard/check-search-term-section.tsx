"use client";

import { useCallback, useState } from "react";

type CheckResult = {
  risk: "high" | "medium" | "low";
  reasons: string[];
  previously_blocked_by_you: boolean;
  blocked_by_others_count: number;
};

function joinReasons(reasons: string[]): string {
  return reasons.filter(Boolean).join(" · ");
}

type CheckSearchTermSectionProps = {
  /** Overrides default “Check a search term” label. */
  heading?: string;
  /** Optional paragraph between heading and input. */
  intro?: string;
  headingMarginBottom?: number;
  outerMarginBottom?: number;
};

export function CheckSearchTermSection({
  heading = "Waste check",
  intro,
  headingMarginBottom = 12,
  outerMarginBottom = 32,
}: CheckSearchTermSectionProps = {}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  const submit = useCallback(async () => {
    const term = query.trim();
    if (!term) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const isPreview =
        typeof window !== "undefined" &&
        window.location.search.includes("preview=pro");
      const res = await fetch("/api/ads/check-term", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search_term: term,
          preview: isPreview ? "pro" : undefined,
        }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        const errCode =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : null;
        if (res.status === 403 && errCode === "upgrade_required") {
          setError("This feature requires an active Pro subscription.");
        } else {
          setError(errCode ?? `Request failed (${res.status})`);
        }
        return;
      }

      if (
        typeof data === "object" &&
        data !== null &&
        "risk" in data &&
        typeof (data as { risk: unknown }).risk === "string"
      ) {
        setResult(data as CheckResult);
      } else {
        setError("Unexpected response.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div style={{ marginBottom: outerMarginBottom }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#4b5563",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: headingMarginBottom,
        }}
      >
        {heading}
      </p>

      {intro ? (
        <p
          style={{
            fontSize: 13,
            color: "#6b7280",
            marginBottom: 16,
            lineHeight: 1.6,
            marginTop: 0,
          }}
        >
          {intro}
        </p>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder="e.g. google ads free trial"
          style={{
            flex: 1,
            minWidth: "12rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 14,
            color: "#e8eaf0",
            outline: "none",
            fontFamily: "Inter, sans-serif",
          }}
          aria-label="Search term to check"
        />
        <button
          type="button"
          disabled={loading || !query.trim()}
          onClick={() => void submit()}
          style={{
            background: "#0d9f6e",
            border: "none",
            color: "white",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 500,
            cursor: loading || !query.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            opacity: loading || !query.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Checking…" : "Check waste risk"}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        {error ? (
          <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
        ) : null}

        {result && !error ? (
          <>
            {result.risk === "high" ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8,
                }}
              >
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  High waste risk
                </p>
                <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
                  {joinReasons(result.reasons)}
                </p>
              </div>
            ) : null}

            {result.risk === "medium" ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 8,
                }}
              >
                <p
                  style={{
                    color: "#f59e0b",
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Medium waste risk
                </p>
                <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
                  {joinReasons(result.reasons)}
                </p>
              </div>
            ) : null}

            {result.risk === "low" ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(13,159,110,0.08)",
                  border: "1px solid rgba(13,159,110,0.2)",
                  borderRadius: 8,
                }}
              >
                <p
                  style={{
                    color: "#0d9f6e",
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Low waste risk
                </p>
                <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
                  No waste signals detected. Monitor after launch.
                </p>
              </div>
            ) : null}

            <p
              style={{
                fontSize: 11,
                color: "#374151",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Results based on waste patterns in your account and anonymized data
              from other advertisers. Always verify with your own conversion data.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
