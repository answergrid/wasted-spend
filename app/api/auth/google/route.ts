import { NextResponse } from "next/server";

/** Space-separated; both are required for Ads API + userinfo email. */
const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function getRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return `${base}/api/auth/google/callback`;
}

/**
 * Starts Google OAuth for Google Ads API (AdWords scope).
 * Register the same redirect URI in Google Cloud Console → OAuth client.
 */
export async function GET() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_ADS_CLIENT_ID is not configured." },
      { status: 500 }
    );
  }

  const redirectUri = getRedirectUri();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
