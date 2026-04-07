import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: JSON_HEADERS });
}

function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

/** Best-effort: only set when a Supabase row exists for the cookie email (never blocks checkout). */
async function resolveVerifiedEmail(): Promise<string | undefined> {
  const cookieStore = cookies();
  const cookieEmail = cookieStore.get("google_ads_connected_email")?.value?.trim();
  if (!cookieEmail) return undefined;

  try {
    const supabase = createSupabaseServerClient();
    const { data: row, error } = await supabase
      .from("connected_accounts")
      .select("email")
      .eq("email", cookieEmail)
      .maybeSingle();

    if (error) {
      console.error("[stripe/checkout] Supabase lookup (non-fatal):", error);
      return undefined;
    }

    if (row?.email && typeof row.email === "string") {
      return row.email.trim();
    }

    console.log(
      "[stripe/checkout] No connected_accounts row for cookie email; checkout without prefilled email"
    );
    return undefined;
  } catch (e) {
    console.error("[stripe/checkout] Supabase lookup threw (non-fatal):", e);
    return undefined;
  }
}

export async function POST() {
  console.log(
    "Stripe key prefix:",
    process.env.STRIPE_SECRET_KEY?.substring(0, 12)
  );

  if (!process.env.STRIPE_SECRET_KEY) {
    return json({ error: "Stripe is not configured." }, 500);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  } as unknown as Stripe.StripeConfig);

  const email = await resolveVerifiedEmail();
  const base = getAppBaseUrl();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Wasted Spend Pro" },
          unit_amount: 2900,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    customer_email: email || undefined,
    success_url: `${base}/dashboard?upgraded=true`,
    cancel_url: `${base}/dashboard`,
  };

  if (email) {
    sessionParams.metadata = { connected_account_email: email };
    sessionParams.subscription_data = {
      metadata: { connected_account_email: email },
    };
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      console.error("[stripe/checkout] Session created but missing url:", session.id);
      return json({ error: "Failed to create checkout session." }, 500);
    }

    return json({ url: session.url });
  } catch (e) {
    console.error("[stripe/checkout] Stripe checkout.sessions.create failed:", e);
    if (e && typeof e === "object") {
      const err = e as Record<string, unknown>;
      console.error("[stripe/checkout] Error type:", err.type);
      console.error("[stripe/checkout] Error message:", err.message);
      if (err.raw !== undefined) {
        console.error("[stripe/checkout] Stripe raw:", JSON.stringify(err.raw, null, 2));
      }
      if (err.statusCode !== undefined) {
        console.error("[stripe/checkout] HTTP status:", err.statusCode);
      }
    }
    const message =
      e instanceof Error ? e.message : "Checkout session creation failed.";
    return json({ error: message }, 500);
  }
}
