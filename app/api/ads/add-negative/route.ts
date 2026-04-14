import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: JSON_HEADERS });
}

type ConnectedAccountRow = {
  refresh_token: string;
  is_paid?: boolean | null;
  customer_id?: string | null;
};

function parseCostImpressions(body: unknown): { cost: number; impressions: number } {
  if (typeof body !== "object" || body === null) {
    return { cost: 0, impressions: 0 };
  }
  const o = body as Record<string, unknown>;
  const costRaw = o.cost;
  const impRaw = o.impressions;
  const cost =
    typeof costRaw === "number" && Number.isFinite(costRaw)
      ? costRaw
      : Number(costRaw);
  const impressions = Math.round(
    typeof impRaw === "number" && Number.isFinite(impRaw)
      ? impRaw
      : Number(impRaw)
  );
  return {
    cost: Number.isFinite(cost) ? cost : 0,
    impressions: Number.isFinite(impressions) ? impressions : 0,
  };
}

function normalizeCustomerId(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    throw new Error("GOOGLE_ADS_CUSTOMER_ID has no digits");
  }
  return digits;
}

function normalizeLoginCustomerId(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    throw new Error("GOOGLE_ADS_LOGIN_CUSTOMER_ID has no digits");
  }
  return digits;
}

function normalizeCampaignId(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    throw new Error("GOOGLE_ADS_CAMPAIGN_ID must contain a numeric campaign ID");
  }
  return digits;
}

/** As requested. If Google returns 404, switch path segment to `campaignCriteria:mutate`. */
function mutateCampaignCriterionUrl(customerId: string): string {
  return `https://googleads.googleapis.com/v17/customers/${customerId}/campaignCriterion:mutate`;
}

export async function POST(request: NextRequest) {
  const cookieEmail = cookies().get("google_ads_connected_email")?.value?.trim();
  if (!cookieEmail) {
    return json({ error: "Not authenticated." }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.error("[ads/add-negative] Invalid JSON body");
    return json({ error: "Invalid JSON body" }, 500);
  }

  const search_term =
    typeof body === "object" &&
    body !== null &&
    "search_term" in body &&
    typeof (body as { search_term: unknown }).search_term === "string"
      ? (body as { search_term: string }).search_term.trim()
      : "";

  if (!search_term) {
    return json({ error: "Missing or invalid search_term" }, 500);
  }

  const { cost: costAtBlock, impressions: impressionsAtBlock } =
    parseCostImpressions(body);

  if (process.env.MOCK_MODE === "true") {
    try {
      const supabase = createSupabaseServerClient();
      const { error: insertError } = await supabase.from("blocked_searches").insert({
        account_email: cookieEmail,
        search_term,
        cost_at_block: costAtBlock,
        impressions_at_block: impressionsAtBlock,
      });
      if (insertError) {
        console.error("[ads/add-negative] MOCK blocked_searches insert:", insertError);
      }
    } catch (e) {
      console.error("[ads/add-negative] MOCK insert threw:", e);
    }
    return json({ success: true, mock: true });
  }

  const supabase = createSupabaseServerClient();
  const { data: account, error: accountError } = await supabase
    .from("connected_accounts")
    .select("refresh_token, is_paid, customer_id")
    .eq("email", cookieEmail)
    .maybeSingle();

  if (accountError) {
    console.error("[ads/add-negative] Supabase connected_accounts error:", accountError);
    return json({ error: "Failed to load connected account." }, 500);
  }

  const refreshTokenEarly = (account as ConnectedAccountRow | null)?.refresh_token;
  if (!refreshTokenEarly) {
    console.error("[ads/add-negative] No connected_accounts row for cookie email");
    return json(
      { error: "No connected Google account. Complete OAuth first." },
      401
    );
  }

  const isPaid = Boolean((account as ConnectedAccountRow | null)?.is_paid);

  if (!isPaid) {
    return json(
      {
        error: "upgrade_required",
        message: "Upgrade to Pro to block searches",
      },
      403
    );
  }

  try {
    const customerIdRaw = (account as ConnectedAccountRow | null)?.customer_id;
    const loginCustomerIdRaw = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
    const campaignIdRaw = process.env.GOOGLE_ADS_CAMPAIGN_ID;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

    if (!customerIdRaw?.trim()) {
      return json(
        {
          error:
            "No Google Ads customer on file. Reconnect your Google account so we can detect your account.",
        },
        400
      );
    }

    if (!campaignIdRaw || !developerToken || !clientId || !clientSecret) {
      console.error("[ads/add-negative] Missing env:", {
        hasCampaignId: Boolean(campaignIdRaw),
        hasDeveloperToken: Boolean(developerToken),
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
      });
      return json(
        {
          error:
            "Missing required env: GOOGLE_ADS_CAMPAIGN_ID, GOOGLE_ADS_DEVELOPER_TOKEN, or OAuth client vars.",
        },
        500
      );
    }

    let customerId: string;
    let loginCustomerId: string | undefined;
    let campaignId: string;
    try {
      customerId = normalizeCustomerId(customerIdRaw);
      if (loginCustomerIdRaw?.trim()) {
        loginCustomerId = normalizeLoginCustomerId(loginCustomerIdRaw);
      }
      campaignId = normalizeCampaignId(campaignIdRaw);
    } catch (e) {
      console.error("[ads/add-negative] Invalid ID env:", e);
      return json(
        { error: e instanceof Error ? e.message : "Invalid customer, login, or campaign ID" },
        500
      );
    }

    const refreshToken = refreshTokenEarly;

    let tokenRes: Response;
    try {
      tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
    } catch (e) {
      console.error("[ads/add-negative] Token refresh fetch threw:", e);
      return json({ error: "Token refresh failed (network)." }, 500);
    }

    const tokenBodyText = await tokenRes.text();

    if (!tokenRes.ok) {
      console.error("[ads/add-negative] Token refresh failed:", {
        status: tokenRes.status,
        statusText: tokenRes.statusText,
        body: tokenBodyText,
      });
      return json({ error: "Failed to refresh Google access token." }, 500);
    }

    let accessToken: string;
    try {
      const tokenJson = JSON.parse(tokenBodyText) as { access_token?: string };
      if (!tokenJson.access_token) {
        console.error("[ads/add-negative] Token JSON missing access_token:", tokenBodyText);
        return json({ error: "No access_token in refresh response." }, 500);
      }
      accessToken = tokenJson.access_token;
    } catch (e) {
      console.error("[ads/add-negative] Token response not JSON:", {
        parseError: e,
        body: tokenBodyText,
      });
      return json({ error: "Invalid token response from Google." }, 500);
    }

    const mutateUrl = mutateCampaignCriterionUrl(customerId);
    console.log("[ads/add-negative] Mutate URL:", mutateUrl);

    const mutateBody = {
      operations: [
        {
          create: {
            campaign: `customers/${customerId}/campaigns/${campaignId}`,
            negative: true,
            keyword: {
              text: search_term,
              matchType: "BROAD",
            },
          },
        },
      ],
    };

    let mutateRes: Response;
    try {
      mutateRes = await fetch(mutateUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
          ...(loginCustomerId
            ? { "login-customer-id": loginCustomerId }
            : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mutateBody),
      });
    } catch (e) {
      console.error("[ads/add-negative] Google Ads mutate fetch threw:", e);
      return json({ error: "Google Ads API request failed (network)." }, 500);
    }

    const mutateText = await mutateRes.text();

    if (!mutateRes.ok) {
      console.error("[ads/add-negative] Google Ads mutate failed:", {
        status: mutateRes.status,
        statusText: mutateRes.statusText,
        body: mutateText,
        url: mutateUrl,
        requestBody: mutateBody,
      });
      let message = `Google Ads API error (${mutateRes.status})`;
      try {
        const errJson = JSON.parse(mutateText) as { error?: { message?: string; status?: string } };
        if (errJson?.error?.message) message = errJson.error.message;
      } catch {
        if (mutateText) message = mutateText.slice(0, 500);
      }
      return json({ error: message }, 500);
    }

    const { error: insertError } = await supabase.from("blocked_searches").insert({
      account_email: cookieEmail,
      search_term,
      cost_at_block: costAtBlock,
      impressions_at_block: impressionsAtBlock,
    });
    if (insertError) {
      console.error("[ads/add-negative] blocked_searches insert failed:", insertError);
    }

    return json({ success: true });
  } catch (e) {
    console.error("[ads/add-negative] Unhandled error:", e);
    return json(
      {
        error:
          e instanceof Error ? e.message : "Internal server error.",
      },
      500
    );
  }
}
