const COOKIE_NAME = "google_ads_connected_email";

type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
};

/**
 * Cookie value may be URL-encoded (e.g. user%40domain.com); Supabase stores plain email.
 */
export function readGoogleAdsConnectedEmail(
  cookieStore: CookieStoreLike
): string | null {
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (raw == null || raw === "") return null;
  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    const fallback = raw.trim();
    return fallback || null;
  }
}
