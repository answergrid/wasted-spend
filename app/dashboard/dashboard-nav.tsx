"use client";

import { BrandLogoLink } from "@/components/brand-logo";
import { healthScoreColor } from "@/lib/dashboard/account-health-score";
import { ManageSubscriptionLink } from "./manage-subscription-link";

const TOOLTIP =
  "Your account health score improves as you block wasted searches. Check back weekly as new waste appears.";

type Props = {
  /** When set, shows green dot + email + Manage on the right. */
  userEmail?: string | null;
  /** Latest score from scan_history; null if no scans yet. */
  healthScore?: number | null;
  /** Current minus previous scan health_score; null if unknown. */
  healthScoreDelta?: number | null;
  /** When false, show “First scan Monday” instead of a numeric score. */
  hasScanHistory?: boolean;
};

export function DashboardNav({
  userEmail,
  healthScore,
  healthScoreDelta,
  hasScanHistory = true,
}: Props) {
  const connected = Boolean(userEmail);
  const scoreDisplay =
    typeof healthScore === "number" && !Number.isNaN(healthScore)
      ? String(healthScore)
      : "—";
  const scoreColor =
    typeof healthScore === "number" && !Number.isNaN(healthScore)
      ? healthScoreColor(healthScore)
      : "#4b5563";

  const deltaLine =
    typeof healthScoreDelta === "number" &&
    !Number.isNaN(healthScoreDelta) &&
    healthScoreDelta !== 0 ? (
      <span style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.2 }}>
        {healthScoreDelta > 0 ? "↑" : "↓"}{" "}
        {Math.abs(healthScoreDelta)} points since last week
      </span>
    ) : null;

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 0,
      }}
    >
      <BrandLogoLink />
      {connected ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            className="hidden sm:flex"
            style={{
              alignItems: "center",
              gap: 6,
              marginRight: 16,
            }}
          >
            {hasScanHistory ? (
              <>
                <div
                  title={TOOLTIP}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `2px solid ${scoreColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: scoreColor,
                    cursor: "default",
                    flexShrink: 0,
                  }}
                >
                  {scoreDisplay}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 2,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 11, color: "#4b5563" }}>
                    Account health
                  </span>
                  {deltaLine}
                </div>
              </>
            ) : (
              <span style={{ fontSize: 12, color: "#374151" }}>
                First scan Monday
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#0d9f6e",
              }}
              aria-hidden
            />
            <span
              style={{
                fontSize: 12,
                color: "#4b5563",
                maxWidth: "min(100%, 14rem)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={userEmail ?? undefined}
            >
              {userEmail}
            </span>
            <span style={{ color: "#2d3748", fontSize: 12 }} aria-hidden>
              ·
            </span>
            <ManageSubscriptionLink
              label="Manage"
              className="border-0 bg-transparent p-0 text-[12px] text-[#4b5563] no-underline transition hover:text-[#6b7280] disabled:cursor-wait disabled:opacity-60"
            />
          </div>
        </div>
      ) : null}
    </nav>
  );
}
