import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: accounts, error } = await supabase
    .from("connected_accounts")
    .select("email, refresh_token")
    .eq("is_paid", true);

  if (error || !accounts) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  console.log("Found accounts:", accounts.length);
  let sentCount = 0;

  for (const account of accounts) {
    console.log("Processing:", account.email);

    try {
      // Get mock terms directly here for now
      const terms = [
        { search_term: "free google ads", cost: 12.4, impressions: 340 },
        { search_term: "google ads jobs", cost: 8.2, impressions: 210 },
        { search_term: "how to cancel google ads", cost: 6.8, impressions: 180 },
        { search_term: "google ads tutorial free", cost: 5.5, impressions: 150 },
        { search_term: "diy google ads setup", cost: 4.9, impressions: 120 },
      ];

      const total = terms.reduce((sum, t) => sum + t.cost, 0);
      console.log("Total:", total);

      const { data: blockedRows } = await supabase
        .from("blocked_searches")
        .select("cost_at_block")
        .eq("account_email", account.email)
        .eq("is_active", true);

      const blockedCount = blockedRows?.length ?? 0;
      const monthlyBudgetProtected =
        blockedRows?.reduce(
          (sum, row) => sum + (Number(row.cost_at_block) || 0),
          0
        ) ?? 0;

      const tableRows = terms
        .map(
          (t) => `
        <tr>
          <td style="color:white;padding:10px 0;font-size:14px;border-bottom:1px solid #334155;">${t.search_term}</td>
          <td style="color:#ef4444;text-align:right;padding:10px 0;font-size:14px;border-bottom:1px solid #334155;">$${t.cost.toFixed(2)}</td>
          <td style="color:#94a3b8;text-align:right;padding:10px 0;font-size:14px;border-bottom:1px solid #334155;">${t.impressions}</td>
        </tr>
      `
        )
        .join("");

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0f172a;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">Wasted Spend Weekly Report</h1>
          </div>
          <div style="background:#1e293b;padding:24px;">
            <div style="background:#0f172a;padding:20px;border-radius:8px;margin-bottom:24px;">
              <p style="color:#94a3b8;margin:0 0 8px;font-size:12px;text-transform:uppercase;">Total wasted spend found</p>
              <p style="color:#0d9f6e;margin:0;font-size:36px;font-weight:bold;">$${total.toFixed(2)}</p>
            </div>
            <p style="color:#cbd5e1;margin:0 0 20px;font-size:14px;line-height:1.55;">
              Total searches blocked to date: ${blockedCount}<br/>
              Estimated monthly budget protected: $${monthlyBudgetProtected.toFixed(2)}
            </p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <thead>
                <tr>
                  <th style="color:#94a3b8;text-align:left;padding:8px 0;font-size:12px;">Search Term</th>
                  <th style="color:#94a3b8;text-align:right;padding:8px 0;font-size:12px;">Cost</th>
                  <th style="color:#94a3b8;text-align:right;padding:8px 0;font-size:12px;">Impressions</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
            <a href="https://wastedspend.app/dashboard"
               style="display:block;background:#0d9f6e;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Review and block these now
            </a>
          </div>
          <div style="background:#0f172a;padding:16px 24px;border-radius:0 0 8px 8px;">
            <p style="color:#475569;margin:0;font-size:12px;">
              You're receiving this because you connected your Google Ads account to Wasted Spend.
              $49/month · Cancel anytime
            </p>
          </div>
        </div>
      `;

      console.log("Sending email to:", account.email);

      const { data, error: emailError } = await resend.emails.send({
        from: "Wasted Spend <onboarding@resend.dev>",
        to: account.email,
        subject: `Your weekly wasted spend report — $${total.toFixed(2)} found`,
        html,
      });

      console.log("Email data:", JSON.stringify(data));
      console.log("Email error:", JSON.stringify(emailError));

      if (!emailError) sentCount++;
    } catch (err) {
      console.error("Error for", account.email, ":", err);
    }
  }

  console.log("Done. Sent:", sentCount);
  return NextResponse.json({ success: true, sent: sentCount });
}
