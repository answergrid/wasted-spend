import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Sum of cost_at_block × weeks elapsed since blocked_at (fractional weeks). */
function cumulativeSavedSinceJoining(
  rows: { cost_at_block: number; blocked_at: string }[]
): number {
  const now = Date.now();
  return rows.reduce((sum, r) => {
    const cost = Number(r.cost_at_block) || 0;
    const blocked = new Date(r.blocked_at).getTime();
    if (Number.isNaN(blocked)) return sum;
    const weeks = Math.max(0, (now - blocked) / MS_PER_WEEK);
    return sum + cost * weeks;
  }, 0);
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: JSON_HEADERS });
}

export async function GET() {
  const email = cookies().get("google_ads_connected_email")?.value?.trim();
  if (!email) {
    return json({ error: "Not authenticated." }, 401);
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("blocked_searches")
      .select(
        "id, search_term, cost_at_block, impressions_at_block, blocked_at, is_active"
      )
      .eq("account_email", email)
      .eq("is_active", true)
      .order("blocked_at", { ascending: false });

    if (error) {
      console.error("[ads/blocked-searches] Supabase error:", error);
      return json({ error: "Failed to load blocked searches." }, 500);
    }

    const rows = (data ?? []) as {
      id: string;
      search_term: string;
      cost_at_block: number;
      impressions_at_block: number;
      blocked_at: string;
      is_active: boolean;
    }[];
    const monthlyProtected = rows.reduce(
      (sum, r) => sum + (Number(r.cost_at_block) || 0),
      0
    );

    const savedSinceJoining = cumulativeSavedSinceJoining(rows);

    return json({
      rows,
      count: rows.length,
      monthlyProtected,
      savedSinceJoining,
    });
  } catch (e) {
    console.error("[ads/blocked-searches] Unhandled error:", e);
    return json(
      { error: e instanceof Error ? e.message : "Internal server error." },
      500
    );
  }
}
