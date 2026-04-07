import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  const email = cookies().get("google_ads_connected_email")?.value?.trim();
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();

  const { error: blockedError } = await supabase
    .from("blocked_searches")
    .delete()
    .eq("account_email", email);

  if (blockedError) {
    console.error("[auth/disconnect] blocked_searches delete:", blockedError);
    return NextResponse.json(
      { error: "Failed to delete blocked search history." },
      { status: 500 }
    );
  }

  const { error: accountError } = await supabase
    .from("connected_accounts")
    .delete()
    .eq("email", email);

  if (accountError) {
    console.error("[auth/disconnect] connected_accounts delete:", accountError);
    return NextResponse.json(
      { error: "Failed to delete connected account." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("google_ads_connected_email", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
