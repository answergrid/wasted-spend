import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { computeHealthScore } from "@/lib/dashboard/account-health-score";
import { createSupabaseServerClient } from "@/lib/supabase";
import { fetchWastedSearchTerms } from "@/lib/google-ads/wasted-search-terms";

export const dynamic = "force-dynamic";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: JSON_HEADERS });
}

type ConnectedAccountRow = {
  refresh_token: string;
  customer_id: string | null;
};

type WeekOverWeekPayload = {
  isFirstScan: boolean;
  delta: number;
  previousTotal: number | null;
};

type ScanSnapshotResult = {
  weekOverWeek: WeekOverWeekPayload;
  healthScore: number;
  /** Null when only one scan exists for this account. */
  healthScoreDelta: number | null;
};

async function getActiveBlockedCount(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  accountEmail: string
): Promise<number> {
  const { count, error } = await supabase
    .from("blocked_searches")
    .select("*", { count: "exact", head: true })
    .eq("account_email", accountEmail)
    .eq("is_active", true);

  if (error) {
    console.error("[ads/search-terms] blocked count:", error);
    return 0;
  }
  return count ?? 0;
}

async function recordScanSnapshot(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  accountEmail: string,
  filteredTerms: { cost: number }[],
  totalWasted: number,
  termCount: number,
  blockedCount: number
): Promise<ScanSnapshotResult> {
  const healthScore = computeHealthScore(filteredTerms, blockedCount);

  const insertPayload = {
    account_email: accountEmail,
    total_wasted: totalWasted,
    term_count: termCount,
    health_score: healthScore,
  };

  const { error: insertError } = await supabase
    .from("scan_history")
    .insert(insertPayload);

  if (insertError) {
    console.error("[ads/search-terms] scan_history insert failed:", insertError);
    return {
      weekOverWeek: { isFirstScan: true, delta: 0, previousTotal: null },
      healthScore,
      healthScoreDelta: null,
    };
  }

  const { data: lastTwo, error: readError } = await supabase
    .from("scan_history")
    .select("total_wasted, health_score")
    .eq("account_email", accountEmail)
    .order("scanned_at", { ascending: false })
    .limit(2);

  if (readError || !lastTwo?.length) {
    if (readError) {
      console.error("[ads/search-terms] scan_history read failed:", readError);
    }
    return {
      weekOverWeek: { isFirstScan: true, delta: 0, previousTotal: null },
      healthScore,
      healthScoreDelta: null,
    };
  }

  let weekOverWeek: WeekOverWeekPayload;
  if (lastTwo.length < 2) {
    weekOverWeek = { isFirstScan: true, delta: 0, previousTotal: null };
  } else {
    const current = Number(lastTwo[0].total_wasted) || 0;
    const previous = Number(lastTwo[1].total_wasted) || 0;
    weekOverWeek = {
      isFirstScan: false,
      delta: current - previous,
      previousTotal: previous,
    };
  }

  let healthScoreDelta: number | null = null;
  if (lastTwo.length >= 2) {
    const h0 = Number(lastTwo[0].health_score) || 0;
    const h1 = Number(lastTwo[1].health_score) || 0;
    healthScoreDelta = h0 - h1;
  }

  return { weekOverWeek, healthScore, healthScoreDelta };
}

async function filterAlreadyBlocked<T extends { search_term: string }>(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  email: string,
  terms: T[]
): Promise<T[]> {
  const { data: alreadyBlocked, error } = await supabase
    .from("blocked_searches")
    .select("search_term")
    .eq("account_email", email)
    .eq("is_active", true);

  if (error) {
    console.error("[ads/search-terms] blocked_searches read error:", error);
    return terms;
  }

  const blockedTerms =
    alreadyBlocked?.map((b) => String(b.search_term).trim().toLowerCase()) ??
    [];
  const blockedSet = new Set(blockedTerms);
  return terms.filter(
    (t) => !blockedSet.has(String(t.search_term).trim().toLowerCase())
  );
}

export async function GET() {
  const cookieStore = cookies();
  const emailCookie = cookieStore.get("google_ads_connected_email");
  console.log("[search-terms] raw cookie:", emailCookie);
  console.log("[search-terms] email value:", emailCookie?.value);

  const email = emailCookie?.value?.trim();
  if (!email) {
    return json({ error: "Not authenticated." }, 401);
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data: account, error: accountError } = await supabase
      .from("connected_accounts")
      .select("refresh_token, customer_id")
      .eq("email", email)
      .maybeSingle();

    console.log(
      "[search-terms] supabase result:",
      JSON.stringify({ data: account, error: accountError })
    );

    if (accountError) {
      console.error("[ads/search-terms] Supabase connected_accounts error:", accountError);
      return json(
        {
          error: "Failed to load connected account.",
          details: accountError.message,
        },
        500
      );
    }

    const row = account as ConnectedAccountRow | null;
    const refreshToken = row?.refresh_token;
    if (!refreshToken) {
      console.error("[ads/search-terms] No connected_accounts row for cookie email");
      return json(
        { error: "No connected Google account. Complete OAuth first." },
        401
      );
    }

    const adsCustomerId = row?.customer_id ?? null;

    const blockedCount = await getActiveBlockedCount(supabase, email);

    if (process.env.MOCK_MODE === "true") {
      const mock = await fetchWastedSearchTerms(refreshToken, adsCustomerId);
      if (!mock.ok) {
        return json({ error: mock.error }, mock.status ?? 500);
      }
      const filtered = await filterAlreadyBlocked(supabase, email, mock.terms);
      const totalWasted = filtered.reduce(
        (s, t) => s + (Number(t.cost) || 0),
        0
      );
      const termCount = filtered.length;
      const snapshot = await recordScanSnapshot(
        supabase,
        email,
        filtered,
        totalWasted,
        termCount,
        blockedCount
      );
      return json({
        terms: filtered,
        weekOverWeek: snapshot.weekOverWeek,
        healthScore: snapshot.healthScore,
        healthScoreDelta: snapshot.healthScoreDelta,
      });
    }

    const result = await fetchWastedSearchTerms(refreshToken, adsCustomerId);
    if (!result.ok) {
      if (result.reconnectRequired) {
        const { error: updateError } = await supabase
          .from("connected_accounts")
          .update({ needs_reconnect: true })
          .eq("email", email);
        if (updateError) {
          console.error(
            "[ads/search-terms] needs_reconnect update failed:",
            updateError
          );
        }
        return json({ error: "reconnect_required" }, result.status ?? 401);
      }
      return json({ error: result.error }, result.status ?? 500);
    }

    const { error: clearReconnectError } = await supabase
      .from("connected_accounts")
      .update({ needs_reconnect: false })
      .eq("email", email);
    if (clearReconnectError) {
      console.error(
        "[ads/search-terms] needs_reconnect clear failed:",
        clearReconnectError
      );
    }

    const filtered = await filterAlreadyBlocked(supabase, email, result.terms);
    const totalWasted = filtered.reduce(
      (s, t) => s + (Number(t.cost) || 0),
      0
    );
    const termCount = filtered.length;
    const snapshot = await recordScanSnapshot(
      supabase,
      email,
      filtered,
      totalWasted,
      termCount,
      blockedCount
    );
    return json({
      terms: filtered,
      weekOverWeek: snapshot.weekOverWeek,
      healthScore: snapshot.healthScore,
      healthScoreDelta: snapshot.healthScoreDelta,
    });
  } catch (e) {
    console.error("[ads/search-terms] Unhandled error:", e);
    return json(
      {
        error: "Internal server error.",
        details: e instanceof Error ? e.message : String(e),
      },
      500
    );
  }
}
