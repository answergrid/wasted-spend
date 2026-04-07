import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: JSON_HEADERS });
}

function getReturnUrl(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return `${base}/dashboard`;
}

export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return json({ error: "Stripe is not configured." }, 500);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    } as unknown as Stripe.StripeConfig);

    const cookieStore = cookies();
    const email = cookieStore.get("google_ads_connected_email")?.value?.trim();

    if (!email) {
      return json({ error: "Not authenticated." }, 401);
    }

    const supabase = createSupabaseServerClient();
    const { data: row, error } = await supabase
      .from("connected_accounts")
      .select("stripe_customer_id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[stripe/portal] Supabase error:", error);
      return json({ error: "Could not load billing profile." }, 500);
    }

    const customerId = row?.stripe_customer_id as string | null | undefined;
    if (!customerId) {
      return json(
        { error: "No Stripe customer on file. Complete checkout first." },
        400
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: getReturnUrl(),
    });

    const portalUrl = session.url;
    if (!portalUrl) {
      return json({ error: "Failed to create portal session." }, 500);
    }

    return json({ url: portalUrl });
  } catch (e) {
    console.error("[stripe/portal] Error:", e);
    return json(
      { error: e instanceof Error ? e.message : "Portal session failed." },
      500
    );
  }
}
