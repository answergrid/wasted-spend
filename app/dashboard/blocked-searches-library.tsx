"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";

const REFRESH_EVENT = "wastedspend-blocked-updated";

const sectionLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "#4b5563",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const theadCell: CSSProperties = {
  fontSize: 11,
  color: "#374151",
  fontWeight: 400,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  paddingBottom: 8,
  textAlign: "left",
};

const rowCell: CSSProperties = {
  fontSize: 13,
  color: "#9ca3af",
  padding: "12px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};

type BlockedRow = {
  id: string;
  search_term: string;
  cost_at_block: number;
  impressions_at_block: number;
  blocked_at: string;
  is_active: boolean;
};

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatBlockedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function milestoneCopy(blockedCount: number) {
  if (blockedCount === 0) return null;
  if (blockedCount >= 1 && blockedCount <= 4) {
    return (
      <p
        style={{
          fontSize: 12,
          color: "#4b5563",
          marginTop: 4,
          marginBottom: 0,
        }}
      >
        Keep going — most accounts have 15-20 searches worth blocking
      </p>
    );
  }
  if (blockedCount >= 5 && blockedCount <= 9) {
    return (
      <p
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginTop: 4,
          marginBottom: 0,
        }}
      >
        Good progress — you&apos;re ahead of most accounts
      </p>
    );
  }
  return (
    <p
      style={{
        fontSize: 12,
        color: "#0d9f6e",
        marginTop: 4,
        marginBottom: 0,
      }}
    >
      Your account is well-optimized. New waste appears weekly as search behavior
      changes.
    </p>
  );
}

export function BlockedSearchesLibrary() {
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [count, setCount] = useState(0);
  const [monthlyProtected, setMonthlyProtected] = useState(0);
  const [savedSinceJoining, setSavedSinceJoining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ads/blocked-searches", { cache: "no-store" });
      const data: unknown = await res.json();

      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : `Request failed (${res.status})`;
        setError(msg);
        setRows([]);
        setCount(0);
        setMonthlyProtected(0);
        setSavedSinceJoining(0);
        return;
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("rows" in data) ||
        !Array.isArray((data as { rows: unknown }).rows)
      ) {
        setError("Unexpected response from server.");
        return;
      }

      const payload = data as {
        rows: BlockedRow[];
        count?: number;
        monthlyProtected?: number;
        savedSinceJoining?: number;
      };
      setRows(payload.rows);
      setCount(
        typeof payload.count === "number" ? payload.count : payload.rows.length
      );
      setMonthlyProtected(
        typeof payload.monthlyProtected === "number"
          ? payload.monthlyProtected
          : payload.rows.reduce(
              (s, r) => s + (Number(r.cost_at_block) || 0),
              0
            )
      );
      setSavedSinceJoining(
        typeof payload.savedSinceJoining === "number"
          ? payload.savedSinceJoining
          : 0
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, [load]);

  if (loading) {
    return (
      <section className="mt-12 rounded-xl border border-subtle bg-card p-6 text-center text-slate-400 sm:p-8">
        Loading blocked searches…
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-12 rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-200">
        <p className="font-medium text-amber-100">Blocked searches</p>
        <p className="mt-2 text-amber-200/90">{error}</p>
      </section>
    );
  }

  return (
    <section className="mt-12 rounded-xl border border-brand/25 bg-card p-4 shadow-lg shadow-black/20 sm:p-6">
      <p style={{ ...sectionLabel, margin: 0 }}>Blocked searches</p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-white/10 p-8 text-center">
          <p className="mb-2 text-[32px] font-normal leading-none text-[#374151]">
            {count}
          </p>
          <p className="m-0 text-sm text-[#6b7280]">
            {count === 1 ? "search" : "searches"} blocked
          </p>
        </div>
      ) : (
        <>
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              fontSize: 14,
              color: "#e8eaf0",
            }}
          >
            {count} {count === 1 ? "search" : "searches"} blocked · Estimated{" "}
            <span style={{ color: "#0d9f6e" }}>
              {formatMoney(monthlyProtected)}
            </span>
            /mo protected
            {savedSinceJoining >= 1 ? (
              <>
                {" "}
                ·{" "}
                <span style={{ color: "#0d9f6e" }}>
                  {formatMoney(savedSinceJoining)}
                </span>{" "}
                saved since joining
              </>
            ) : null}
          </p>
          {milestoneCopy(count)}
          <p
            style={{
              marginTop: 4,
              marginBottom: 0,
              fontSize: 12,
              color: "#374151",
            }}
          >
            Saved terms stay hidden from new suggestions. Totals use cost at the
            time you blocked each search.
          </p>
          <div className="mt-6 -mx-4 overflow-x-auto sm:mx-0">
            <table
              className="w-full min-w-[520px] border-collapse text-left sm:min-w-0"
              style={{ tableLayout: "fixed" }}
            >
              <thead>
                <tr>
                  <th
                    style={{ ...theadCell, paddingRight: 12, width: "40%" }}
                  >
                    Search term
                  </th>
                  <th
                    style={{
                      ...theadCell,
                      textAlign: "right",
                      paddingLeft: 12,
                      paddingRight: 12,
                    }}
                  >
                    Cost when blocked
                  </th>
                  <th
                    className="hidden sm:table-cell"
                    style={{
                      ...theadCell,
                      textAlign: "right",
                      paddingLeft: 12,
                      paddingRight: 24,
                    }}
                  >
                    Impressions
                  </th>
                  <th
                    style={{
                      ...theadCell,
                      paddingLeft: 12,
                      paddingRight: 12,
                    }}
                  >
                    Date blocked
                  </th>
                  <th
                    style={{
                      ...theadCell,
                      width: 40,
                      textAlign: "center",
                      paddingLeft: 8,
                    }}
                    aria-label=""
                  />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td
                      style={{
                        ...rowCell,
                        width: "40%",
                        color: "#e8eaf0",
                        fontWeight: 400,
                        borderBottom:
                          i === rows.length - 1
                            ? "none"
                            : rowCell.borderBottom,
                      }}
                      className="max-w-[200px] sm:max-w-none"
                    >
                      <span className="break-words">{r.search_term}</span>
                    </td>
                    <td
                      style={{
                        ...rowCell,
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        color: "#9ca3af",
                        fontWeight: 400,
                        borderBottom:
                          i === rows.length - 1
                            ? "none"
                            : rowCell.borderBottom,
                      }}
                    >
                      {formatMoney(Number(r.cost_at_block) || 0)}
                    </td>
                    <td
                      className="hidden sm:table-cell"
                      style={{
                        ...rowCell,
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        paddingRight: 24,
                        color: "#4b5563",
                        fontWeight: 400,
                        borderBottom:
                          i === rows.length - 1
                            ? "none"
                            : rowCell.borderBottom,
                      }}
                    >
                      {(r.impressions_at_block ?? 0).toLocaleString()}
                    </td>
                    <td
                      style={{
                        ...rowCell,
                        whiteSpace: "nowrap",
                        paddingLeft: 12,
                        color: "#4b5563",
                        fontWeight: 400,
                        borderBottom:
                          i === rows.length - 1
                            ? "none"
                            : rowCell.borderBottom,
                      }}
                    >
                      {formatBlockedDate(r.blocked_at)}
                    </td>
                    <td
                      style={{
                        ...rowCell,
                        textAlign: "center",
                        verticalAlign: "middle",
                        borderBottom:
                          i === rows.length - 1
                            ? "none"
                            : rowCell.borderBottom,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#0d9f6e",
                          margin: "0 auto",
                        }}
                        aria-hidden
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export { REFRESH_EVENT };
