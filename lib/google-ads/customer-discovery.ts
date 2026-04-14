/**
 * Discover Google Ads customer IDs after OAuth via listAccessibleCustomers
 * and pick a default account (first non-manager when multiple).
 */

function normalizeDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    throw new Error("Customer ID has no digits");
  }
  return digits;
}

export function parseCustomerResourceName(name: string): string | null {
  const m = /^customers\/(\d+)$/.exec(String(name).trim());
  return m ? m[1] : null;
}

type SearchStreamChunk = {
  results?: Array<{
    customer?: { manager?: boolean };
  }>;
};

function extractManagerFromStream(bodyText: string): boolean | null {
  const tryParse = (text: string): boolean | null => {
    try {
      const parsed = JSON.parse(text) as unknown;
      const chunks = Array.isArray(parsed) ? parsed : [parsed];
      for (const chunk of chunks) {
        if (chunk && typeof chunk === "object" && "results" in chunk) {
          const results = (chunk as SearchStreamChunk).results;
          if (Array.isArray(results)) {
            for (const row of results) {
              if (row?.customer && typeof row.customer.manager === "boolean") {
                return row.customer.manager;
              }
            }
          }
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  const single = tryParse(bodyText);
  if (single !== null) return single;

  for (const line of bodyText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed[0] !== "{") continue;
    const fromLine = tryParse(trimmed);
    if (fromLine !== null) return fromLine;
  }

  return null;
}

export async function listAccessibleCustomerIds(
  accessToken: string,
  developerToken: string
): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch(
      "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
          "Content-Type": "application/json",
        },
        body: "{}",
      }
    );
  } catch (e) {
    console.error("[google-ads] listAccessibleCustomers network error:", e);
    return { ok: false, error: "listAccessibleCustomers network error" };
  }

  const text = await res.text();
  if (!res.ok) {
    console.error("[google-ads] listAccessibleCustomers failed:", res.status, text);
    return { ok: false, error: text.slice(0, 500) };
  }

  try {
    const json = JSON.parse(text) as { resourceNames?: string[] };
    const ids: string[] = [];
    for (const rn of json.resourceNames ?? []) {
      const id = parseCustomerResourceName(rn);
      if (id) ids.push(id);
    }
    return { ok: true, ids };
  } catch (e) {
    console.error("[google-ads] listAccessibleCustomers parse error:", e, text);
    return { ok: false, error: "Invalid JSON from listAccessibleCustomers" };
  }
}

async function fetchCustomerIsManager(
  accessToken: string,
  customerId: string,
  developerToken: string,
  loginCustomerId?: string
): Promise<boolean | null> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": developerToken,
    "Content-Type": "application/json",
  };
  if (loginCustomerId) {
    headers["login-customer-id"] = normalizeDigits(loginCustomerId);
  }

  let res: Response;
  try {
    res = await fetch(
      `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: "SELECT customer.manager FROM customer LIMIT 1",
        }),
      }
    );
  } catch (e) {
    console.error("[google-ads] manager check network error:", e);
    return null;
  }

  const text = await res.text();
  if (!res.ok) {
    console.error("[google-ads] manager check failed:", customerId, res.status, text.slice(0, 400));
    return null;
  }

  return extractManagerFromStream(text);
}

export type DiscoverDefaultCustomerResult = {
  defaultId: string;
  allIds: string[];
};

/**
 * Uses listAccessibleCustomers + per-customer manager flag when multiple accounts exist.
 * Single account: uses that ID. Multiple: first non-manager; if all managers or unknown, first ID.
 */
export async function discoverDefaultCustomer(
  accessToken: string,
  developerToken: string,
  loginCustomerIdEnv?: string | null
): Promise<DiscoverDefaultCustomerResult | null> {
  const listed = await listAccessibleCustomerIds(accessToken, developerToken);
  if (!listed.ok || listed.ids.length === 0) {
    return null;
  }

  const allIds = listed.ids;
  const loginForQuery =
    loginCustomerIdEnv && loginCustomerIdEnv.trim()
      ? normalizeDigits(loginCustomerIdEnv)
      : undefined;

  if (allIds.length === 1) {
    return { defaultId: allIds[0], allIds };
  }

  for (const id of allIds) {
    const isManager = await fetchCustomerIsManager(
      accessToken,
      id,
      developerToken,
      loginForQuery
    );
    if (isManager !== true) {
      return { defaultId: id, allIds };
    }
  }

  return { defaultId: allIds[0], allIds };
}
