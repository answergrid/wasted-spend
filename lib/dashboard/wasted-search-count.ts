import { cookies, headers } from "next/headers";

/**
 * Server-only: fetch wasted search term count for dashboard copy (same data as /api/ads/search-terms).
 */
export async function getWastedSearchTermCount(): Promise<number | null> {
  const cookieStore = cookies();
  const email = cookieStore.get("google_ads_connected_email")?.value?.trim();
  if (!email) return null;

  const headerList = headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const url = `${protocol}://${host}/api/ads/search-terms`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data.length;
    if (
      typeof data === "object" &&
      data !== null &&
      "terms" in data &&
      Array.isArray((data as { terms: unknown }).terms)
    ) {
      return (data as { terms: unknown[] }).terms.length;
    }
    return null;
  } catch {
    return null;
  }
}
