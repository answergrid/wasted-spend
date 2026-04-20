import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readGoogleAdsConnectedEmail } from "@/lib/cookies/google-ads-connected-email";
import { createSupabaseServerClient } from "@/lib/supabase";
import {
  findPatternMatches,
  patternReasons,
} from "@/lib/ads/term-waste-patterns";

export const dynamic = "force-dynamic";

/** Dev / QA: skip `is_paid` when body `preview === "pro"` or this header is `pro`. */
const PREVIEW_PRO_HEADER = "x-wasted-spend-preview";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: JSON_HEADERS });
}

function normalizeTerm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Same term or obvious substring overlap (close variant). */
function matchesCloseVariant(query: string, blocked: string): boolean {
  const q = normalizeTerm(query);
  const b = normalizeTerm(blocked);
  if (!q || !b) return false;
  if (q === b) return true;
  if (q.length < 2 || b.length < 2) return false;
  return q.includes(b) || b.includes(q);
}

export type CheckTermResult = {
  risk: "high" | "medium" | "low";
  reasons: string[];
  previously_blocked_by_you: boolean;
  blocked_by_others_count: number;
};

export async function POST(req: Request) {
  const email = readGoogleAdsConnectedEmail(cookies());
  if (!email) {
    return json({ error: "Not authenticated." }, 401);
  }

  let body: { search_term?: string; email?: string; preview?: string };
  try {
    body = (await req.json()) as {
      search_term?: string;
      email?: string;
      preview?: string;
    };
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const previewPro =
    body.preview === "pro" ||
    req.headers.get(PREVIEW_PRO_HEADER)?.trim().toLowerCase() === "pro";

  if (body.email && body.email.trim() !== email) {
    return json({ error: "Email does not match session." }, 403);
  }

  const raw = typeof body.search_term === "string" ? body.search_term : "";
  const search_term = raw.trim();
  if (!search_term) {
    return json({ error: "search_term is required." }, 400);
  }

  const supabase = createSupabaseServerClient();

  const { data: acct, error: acctErr } = await supabase
    .from("connected_accounts")
    .select("is_paid")
    .eq("email", email)
    .maybeSingle();

  if (acctErr) {
    console.error("[check-term] connected_accounts:", acctErr);
    return json({ error: "Failed to verify account." }, 500);
  }

  if (
    !previewPro &&
    (!acct || !(acct as { is_paid?: boolean }).is_paid)
  ) {
    return json({ error: "upgrade_required", message: "Pro only." }, 403);
  }

  const norm = normalizeTerm(search_term);

  const { data: myBlocks, error: myErr } = await supabase
    .from("blocked_searches")
    .select("search_term")
    .eq("account_email", email)
    .eq("is_active", true);

  if (myErr) {
    console.error("[check-term] my blocks:", myErr);
    return json({ error: "Failed to read blocked terms." }, 500);
  }

  const previously_blocked_by_you = (myBlocks ?? []).some((row) =>
    matchesCloseVariant(search_term, String((row as { search_term: string }).search_term))
  );

  const { data: otherRows, error: otherErr } = await supabase
    .from("blocked_searches")
    .select("account_email, search_term")
    .eq("is_active", true)
    .neq("account_email", email)
    .limit(15000);

  if (otherErr) {
    console.error("[check-term] other blocks:", otherErr);
    return json({ error: "Failed to read network blocks." }, 500);
  }

  const othersEmails = new Set<string>();
  for (const row of otherRows ?? []) {
    const r = row as { account_email: string; search_term: string };
    if (matchesCloseVariant(search_term, r.search_term)) {
      othersEmails.add(r.account_email);
    }
  }
  const blocked_by_others_count = othersEmails.size;

  const patternHits = findPatternMatches(norm);
  const patternReasonStrings = patternReasons(patternHits);

  const reasons: string[] = [];

  if (previously_blocked_by_you) {
    reasons.push(
      "You've already blocked this term or a close variant in your account."
    );
  } else if (blocked_by_others_count >= 3) {
    reasons.push("Commonly blocked by other advertisers.");
  } else if (blocked_by_others_count >= 1 && blocked_by_others_count <= 2) {
    reasons.push(
      `Blocked by ${blocked_by_others_count} other advertiser${
        blocked_by_others_count === 1 ? "" : "s"
      } — a common waste signal.`
    );
  }

  reasons.push(...patternReasonStrings);

  let risk: CheckTermResult["risk"] = "low";
  if (previously_blocked_by_you || blocked_by_others_count >= 3) {
    risk = "high";
  } else if (
    (blocked_by_others_count >= 1 && blocked_by_others_count <= 2) ||
    patternReasonStrings.length > 0
  ) {
    risk = "medium";
  }

  const { error: logErr } = await supabase.from("term_checks").insert({
    account_email: email,
    search_term: search_term,
    risk_level: risk,
    reasons: reasons.length ? reasons : [],
  });

  if (logErr) {
    console.error("[check-term] term_checks insert:", logErr);
  }

  const result: CheckTermResult = {
    risk,
    reasons,
    previously_blocked_by_you,
    blocked_by_others_count,
  };

  return json(result);
}
