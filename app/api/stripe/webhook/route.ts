import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/*
 * Supabase — add billing columns (run in SQL editor):
 *
 * alter table public.connected_accounts
 *   add column if not exists is_paid boolean not null default false;
 *
 * alter table public.connected_accounts
 *   add column if not exists stripe_customer_id text;
 *
 * create index if not exists connected_accounts_stripe_customer_id_idx
 *   on public.connected_accounts (stripe_customer_id);
 */

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  } as unknown as Stripe.StripeConfig);

  const body = await req.text();
  const sig = headers().get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json(
      { error: "Webhook signature failed" },
      { status: 400 }
    );
  }

  console.log("Webhook received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email =
      session.customer_email || session.customer_details?.email;

    if (email) {
      const supabase = createSupabaseServerClient();
      const { error: updateError } = await supabase
        .from("connected_accounts")
        .update({ is_paid: true })
        .eq("email", email);

      if (updateError) {
        console.error("[stripe/webhook] Failed to update connected_accounts:", updateError);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }
    } else {
      console.error(
        "[stripe/webhook] checkout.session.completed: no customer_email or customer_details.email"
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
