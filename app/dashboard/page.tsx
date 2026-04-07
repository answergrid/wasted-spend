import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import { BlockedSearchesLibrary } from "./blocked-searches-library";
import { DashboardNav } from "./dashboard-nav";
import { DisconnectAccountSection } from "./disconnect-account";
import dynamicImport from "next/dynamic";
import { ReviewModeBanner } from "./review-mode-banner";
import { SuggestionsDashboard } from "./suggestions-dashboard";

const PostConnectBanner = dynamicImport(
  () =>
    import("./post-connect-banner").then((m) => ({ default: m.PostConnectBanner })),
  { ssr: false }
);

export const dynamic = "force-dynamic";

const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

type DashboardPageProps = {
  searchParams: { upgraded?: string; connected?: string; preview?: string };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  /**
   * Preview: `?preview=pro` forces Pro UI without a paid Supabase row.
   * Remove or restrict to your email before launch.
   */
  const previewPro = searchParams.preview === "pro";

  const cookieStore = cookies();
  const connectedEmail = cookieStore.get("google_ads_connected_email")?.value;
  const isConnected = Boolean(connectedEmail);

  let isActuallyPaid = false;
  /** Account created within the last 10 minutes (server). Used for onboarding UI + “Here’s what we found” banner. */
  let isFreshOnboarding = false;
  let navHealthScore: number | null = null;
  let navHealthDelta: number | null = null;
  let navHasScanHistory = false;
  if (connectedEmail) {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("connected_accounts")
      .select("is_paid, created_at")
      .eq("email", connectedEmail)
      .maybeSingle();
    const row = data as { is_paid?: boolean; created_at?: string } | null;
    isActuallyPaid = Boolean(row?.is_paid);
    if (row?.created_at) {
      const created = new Date(row.created_at);
      if (!Number.isNaN(created.getTime())) {
        const tenMinutesMs = 10 * 60 * 1000;
        isFreshOnboarding = Date.now() - created.getTime() < tenMinutesMs;
      }
    }

    const { data: scanRows } = await supabase
      .from("scan_history")
      .select("health_score, scanned_at")
      .eq("account_email", connectedEmail)
      .order("scanned_at", { ascending: false })
      .limit(2);

    navHasScanHistory = Boolean(scanRows?.length);

    if (scanRows?.length) {
      const h0 = Number(scanRows[0].health_score);
      const h0r = Math.round(h0);
      if (!Number.isNaN(h0)) {
        navHealthScore = h0r;
      }
      if (scanRows.length >= 2) {
        const scannedAtRaw = (scanRows[0] as { scanned_at?: string }).scanned_at;
        const scannedAt = scannedAtRaw ? new Date(scannedAtRaw) : null;
        const recentEnough =
          scannedAt &&
          !Number.isNaN(scannedAt.getTime()) &&
          Date.now() - scannedAt.getTime() < EIGHT_DAYS_MS &&
          Date.now() - scannedAt.getTime() >= 0;
        if (recentEnough) {
          const h1 = Number(scanRows[1].health_score);
          const h1r = Math.round(h1);
          if (!Number.isNaN(h0) && !Number.isNaN(h1)) {
            navHealthDelta = h0r - h1r;
          }
        }
      }
    }
  }

  const isPaid = isActuallyPaid || previewPro;

  const upgradedFromUrl = searchParams.upgraded === "true";
  const justConnected = searchParams.connected === "1";
  /** Just connected (≤10 min) or OAuth return with ?connected=1; “Got it” uses localStorage on the client. */
  const showFoundGuide = isFreshOnboarding || justConnected;
  /** Treat as Pro in UI when DB says paid OR user just returned from Checkout (webhook may lag). */
  const showAsPro = isPaid || upgradedFromUrl;

  return (
    <div className="min-h-screen bg-app text-slate-100">
      <DashboardNav
        userEmail={connectedEmail ?? undefined}
        healthScore={navHealthScore}
        healthScoreDelta={navHealthDelta}
        hasScanHistory={navHasScanHistory}
      />
      <ReviewModeBanner />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-4xl">
        {!isConnected ? (
          <div
            style={{
              padding: "80px 32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "rgba(13,159,110,0.1)",
                border: "1px solid rgba(13,159,110,0.2)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path
                  d="M3 11h16M11 3l8 8-8 8"
                  stroke="#0d9f6e"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "#e8eaf0",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Connect your Google Ads account
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#4b5563",
                margin: 0,
                maxWidth: 360,
                lineHeight: 1.6,
              }}
            >
              We scan your last 30 days of search terms and find queries spending
              your budget with zero conversions.
            </p>
            <a
              href="/api/auth/google"
              style={{
                display: "inline-block",
                marginTop: 8,
                background: "#0d9f6e",
                color: "white",
                fontSize: 14,
                fontWeight: 500,
                padding: "11px 24px",
                borderRadius: 8,
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Connect Google Ads
            </a>
            <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>
              Free scan · No credit card required
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {upgradedFromUrl ? (
              <div
                className="rounded-xl border border-brand/35 bg-brand/[0.12] px-5 py-4 text-center text-sm font-medium text-[#a7e9d0] sm:text-left"
                role="status"
              >
                You&apos;re now on Pro. Weekly scans are active.
              </div>
            ) : null}

            {showFoundGuide ? <PostConnectBanner show={showFoundGuide} /> : null}

            <SuggestionsDashboard
              isFreshOnboarding={isFreshOnboarding}
              isPro={showAsPro}
            />
            {showAsPro ? <BlockedSearchesLibrary /> : null}
          </div>
        )}
        {isConnected ? (
          <>
            <p
              style={{
                fontSize: 12,
                color: "#2d3748",
                textAlign: "center",
                marginTop: 24,
                marginBottom: 16,
              }}
            >
              Scans run every Monday at 9am · Results arrive in your inbox
            </p>
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-4xl">
              <DisconnectAccountSection />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
