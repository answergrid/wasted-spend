/**
 * Shared logic for wasted search terms (same filters as /api/ads/search-terms).
 */

const GAQL_QUERY = `
SELECT
  search_term_view.search_term,
  metrics.cost_micros,
  metrics.conversions,
  metrics.impressions
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
AND metrics.impressions > 50
ORDER BY metrics.cost_micros DESC
LIMIT 100
`
  .replace(/\s+/g, " ")
  .trim();

const COST_MICROS_THRESHOLD = 500_000;

export type WastedTerm = {
  search_term: string;
  cost: number;
  impressions: number;
  conversions: number;
};

const MOCK_SEARCH_TERMS: WastedTerm[] = [
  { search_term: "free google ads", cost: 12.4, impressions: 340, conversions: 0 },
  { search_term: "google ads jobs", cost: 8.2, impressions: 210, conversions: 0 },
  { search_term: "how to cancel google ads", cost: 6.8, impressions: 180, conversions: 0 },
  { search_term: "google ads tutorial free", cost: 5.5, impressions: 150, conversions: 0 },
  { search_term: "diy google ads setup", cost: 4.9, impressions: 120, conversions: 0 },
  { search_term: "google ads competitor", cost: 3.2, impressions: 90, conversions: 0 },
  { search_term: "google ads refund", cost: 2.8, impressions: 75, conversions: 0 },
];

type GoogleAdsRow = {
  searchTermView?: { searchTerm?: string };
  metrics?: {
    costMicros?: string | number;
    conversions?: string | number;
    impressions?: string | number;
  };
};

function normalizeCustomerId(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    throw new Error("Google Ads customer ID has no digits");
  }
  return digits;
}

function toNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function extractRowsFromParsedBody(parsed: unknown): GoogleAdsRow[] {
  const chunks = Array.isArray(parsed) ? parsed : [parsed];
  const rows: GoogleAdsRow[] = [];
  for (const chunk of chunks) {
    if (chunk && typeof chunk === "object" && "results" in chunk) {
      const r = (chunk as { results?: GoogleAdsRow[] }).results;
      if (Array.isArray(r)) rows.push(...r);
    }
  }
  return rows;
}

async function parseSearchStreamResponse(res: Response): Promise<{
  ok: true;
  rows: GoogleAdsRow[];
} | { ok: false; status: number; bodyText: string }> {
  const bodyText = await res.text();

  if (!res.ok) {
    console.error("[google-ads] SearchStream error:", {
      status: res.status,
      body: bodyText,
    });
    return { ok: false, status: res.status, bodyText };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch (e) {
    console.error("[google-ads] SearchStream not JSON:", e, bodyText);
    return { ok: false, status: 502, bodyText: "Invalid JSON" };
  }

  return { ok: true, rows: extractRowsFromParsedBody(parsed) };
}

export type FetchWastedTermsResult =
  | { ok: true; terms: WastedTerm[] }
  | {
      ok: false;
      error: string;
      status?: number;
      /** True when Google returned invalid_grant (revoked/expired refresh token). */
      reconnectRequired?: boolean;
    };

/**
 * Fetches wasted search terms for the connected user's Google Ads customer.
 * @param adsCustomerId — Digits-only customer ID from `connected_accounts.customer_id`
 */
export async function fetchWastedSearchTerms(
  refreshToken: string,
  adsCustomerId: string | null
): Promise<FetchWastedTermsResult> {
  if (process.env.MOCK_MODE === "true") {
    return { ok: true, terms: [...MOCK_SEARCH_TERMS] };
  }

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

  if (!adsCustomerId?.trim()) {
    return {
      ok: false,
      error:
        "No Google Ads customer on file. Reconnect your Google account so we can detect your account.",
      status: 400,
    };
  }

  if (!developerToken || !clientId || !clientSecret) {
    return {
      ok: false,
      error: "Missing Google Ads or OAuth environment variables.",
      status: 500,
    };
  }

  let customerId: string;
  try {
    customerId = normalizeCustomerId(adsCustomerId);
  } catch {
    return { ok: false, error: "Invalid stored Google Ads customer ID.", status: 500 };
  }

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
    console.error("[google-ads] Token refresh network error:", e);
    return { ok: false, error: "Token refresh failed (network).", status: 502 };
  }

  const tokenBodyText = await tokenRes.text();
  if (!tokenRes.ok) {
    let reconnectRequired = false;
    try {
      const errJson = JSON.parse(tokenBodyText) as { error?: string };
      if (errJson?.error === "invalid_grant") {
        reconnectRequired = true;
      }
    } catch {
      /* non-JSON error body */
    }
    console.error("[google-ads] Token refresh failed:", tokenBodyText);
    if (reconnectRequired) {
      return {
        ok: false,
        error: "reconnect_required",
        status: 401,
        reconnectRequired: true,
      };
    }
    return {
      ok: false,
      error: "Failed to refresh Google access token.",
      status: tokenRes.status >= 400 && tokenRes.status < 600 ? tokenRes.status : 502,
    };
  }

  let accessToken: string;
  try {
    const tokenJson = JSON.parse(tokenBodyText) as { access_token?: string };
    if (!tokenJson.access_token) {
      return { ok: false, error: "No access_token in refresh response.", status: 502 };
    }
    accessToken = tokenJson.access_token;
  } catch {
    return { ok: false, error: "Invalid token response from Google.", status: 502 };
  }

  const googleAdsUrl = `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": developerToken,
    "Content-Type": "application/json",
  };
  const loginCustomerRaw = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  if (loginCustomerRaw?.trim()) {
    try {
      headers["login-customer-id"] = normalizeCustomerId(loginCustomerRaw);
    } catch {
      return { ok: false, error: "Invalid GOOGLE_ADS_LOGIN_CUSTOMER_ID.", status: 500 };
    }
  }

  let adsRes: Response;
  try {
    adsRes = await fetch(googleAdsUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: GAQL_QUERY }),
    });
  } catch (e) {
    console.error("[google-ads] SearchStream fetch error:", e);
    return { ok: false, error: "Google Ads API request failed.", status: 502 };
  }

  const stream = await parseSearchStreamResponse(adsRes);
  if (!stream.ok) {
    return {
      ok: false,
      error: "Google Ads API request failed.",
      status: stream.status >= 400 ? stream.status : 502,
    };
  }

  const wasted: WastedTerm[] = [];
  for (const row of stream.rows) {
    const term = row.searchTermView?.searchTerm;
    if (!term) continue;
    const costMicros = toNumber(row.metrics?.costMicros);
    const conversions = toNumber(row.metrics?.conversions);
    const impressions = toNumber(row.metrics?.impressions);
    if (costMicros <= COST_MICROS_THRESHOLD) continue;
    if (conversions !== 0) continue;
    wasted.push({
      search_term: term,
      cost: costMicros / 1_000_000,
      impressions,
      conversions,
    });
  }

  return { ok: true, terms: wasted };
}
