/*
 * Supabase: run in SQL editor (adjust schema as needed).
 *
 * create table public.connected_accounts (
 *   id uuid primary key default gen_random_uuid(),
 *   email text not null unique,
 *   access_token text not null,
 *   refresh_token text not null,
 *   created_at timestamptz not null default now(),
 *   is_paid boolean not null default false,
 *   stripe_customer_id text
 * );
 *
 * -- If the table already exists, add billing columns:
 * alter table public.connected_accounts
 *   add column if not exists is_paid boolean not null default false;
 * alter table public.connected_accounts
 *   add column if not exists stripe_customer_id text;
 *
 * create index connected_accounts_email_idx on public.connected_accounts (email);
 *
 * alter table public.connected_accounts enable row level security;
 *
 * -- Inserts from this API route use the service role key (bypasses RLS).
 * -- If you use only the anon key, add policies or use a server-side Edge Function.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

function getRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return `${base}/api/auth/google/callback`;
}

const COOKIE_EMAIL = "google_ads_connected_email";

const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

function getEmailFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as { email?: string };
    return typeof payload.email === "string" ? payload.email : null;
  } catch (e) {
    console.error("[google oauth] id_token decode failed:", e, { idTokenLen: idToken.length });
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const oauthError = searchParams.get("error");
  const code = searchParams.get("code");

  const dashboardUrl = new URL("/dashboard", request.url);

  if (oauthError) {
    const desc = searchParams.get("error_description");
    console.error("[google oauth] Google returned error param:", {
      error: oauthError,
      error_description: desc,
    });
    dashboardUrl.searchParams.set("error", oauthError);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    console.error("[google oauth] Missing ?code= in callback URL");
    dashboardUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(dashboardUrl);
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[google oauth] Missing GOOGLE_ADS_CLIENT_ID or GOOGLE_ADS_CLIENT_SECRET");
    dashboardUrl.searchParams.set("error", "oauth_config");
    return NextResponse.redirect(dashboardUrl);
  }

  const redirectUri = getRedirectUri();

  let tokenRes: Response;
  try {
    tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
  } catch (e) {
    console.error("[google oauth] Token exchange fetch threw:", e);
    dashboardUrl.searchParams.set("error", "token_exchange");
    return NextResponse.redirect(dashboardUrl);
  }

  const tokenRaw = await tokenRes.text();

  if (!tokenRes.ok) {
    console.error("[google oauth] Token exchange failed:", {
      status: tokenRes.status,
      statusText: tokenRes.statusText,
      body: tokenRaw,
    });
    dashboardUrl.searchParams.set("error", "token_exchange");
    return NextResponse.redirect(dashboardUrl);
  }

  let tokenJson: TokenResponse;
  try {
    tokenJson = JSON.parse(tokenRaw) as TokenResponse;
  } catch (e) {
    console.error("[google oauth] Token response is not JSON:", {
      parseError: e,
      body: tokenRaw,
    });
    dashboardUrl.searchParams.set("error", "token_exchange");
    return NextResponse.redirect(dashboardUrl);
  }

  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    console.error("[google oauth] Token JSON missing access_token:", tokenJson);
    dashboardUrl.searchParams.set("error", "no_access_token");
    return NextResponse.redirect(dashboardUrl);
  }

  let email: string | null = null;

  let userInfoRes: Response;
  try {
    userInfoRes = await fetch(USERINFO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  } catch (e) {
    console.error("[google oauth] Userinfo fetch threw:", e);
    dashboardUrl.searchParams.set("error", "userinfo");
    return NextResponse.redirect(dashboardUrl);
  }

  const userInfoRaw = await userInfoRes.text();

  if (userInfoRes.ok) {
    try {
      const userInfo = JSON.parse(userInfoRaw) as { email?: string };
      email = typeof userInfo.email === "string" ? userInfo.email : null;
      if (!email) {
        console.error("[google oauth] Userinfo JSON had no email field:", userInfo);
      }
    } catch (e) {
      console.error("[google oauth] Userinfo response is not JSON:", {
        parseError: e,
        body: userInfoRaw,
      });
    }
  } else {
    console.error("[google oauth] Userinfo request failed:", {
      url: USERINFO_URL,
      status: userInfoRes.status,
      statusText: userInfoRes.statusText,
      body: userInfoRaw,
      token_scope: tokenJson.scope,
    });
  }

  if (!email) {
    const fromId = getEmailFromIdToken(tokenJson.id_token);
    if (fromId) {
      email = fromId;
      console.log("[google oauth] Using email from id_token (userinfo unavailable or empty)");
    }
  }

  if (!email) {
    dashboardUrl.searchParams.set("error", "userinfo");
    return NextResponse.redirect(dashboardUrl);
  }

  let refreshToken = tokenJson.refresh_token;
  const supabase = createSupabaseServerClient();

  if (!refreshToken) {
    const { data: existing, error: selectError } = await supabase
      .from("connected_accounts")
      .select("refresh_token")
      .eq("email", email)
      .maybeSingle();

    if (selectError) {
      console.error("[google oauth] Supabase select refresh_token failed:", selectError);
    }

    refreshToken = existing?.refresh_token ?? undefined;
  }

  if (!refreshToken) {
    console.error("[google oauth] No refresh_token from Google and none stored for this email");
    dashboardUrl.searchParams.set("error", "no_refresh_token");
    return NextResponse.redirect(dashboardUrl);
  }

  const { data: existing, error: existingError } = await supabase
    .from("connected_accounts")
    .select("id, is_paid")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    console.error("[google oauth] Supabase select connected_accounts failed:", existingError);
    dashboardUrl.searchParams.set("error", "database");
    return NextResponse.redirect(dashboardUrl);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("connected_accounts")
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        needs_reconnect: false,
      })
      .eq("email", email);

    if (updateError) {
      console.error("[google oauth] Supabase update failed:", updateError);
      dashboardUrl.searchParams.set("error", "database");
      return NextResponse.redirect(dashboardUrl);
    }
  } else {
    const { error: insertError } = await supabase.from("connected_accounts").insert({
      email: email,
      access_token: accessToken,
      refresh_token: refreshToken,
      needs_reconnect: false,
    });

    if (insertError) {
      console.error("[google oauth] Supabase insert failed:", insertError);
      dashboardUrl.searchParams.set("error", "database");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  dashboardUrl.searchParams.set("connected", "1");

  const response = NextResponse.redirect(dashboardUrl);
  response.cookies.set(COOKIE_EMAIL, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
