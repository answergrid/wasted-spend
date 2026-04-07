import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy | Wasted Spend",
  description:
    "Privacy policy for Wasted Spend covering data collection, usage, storage, and deletion requests.",
};

const doc: CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  padding: "60px 32px",
};

const h1: CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  color: "#e8eaf0",
  letterSpacing: "-0.02em",
  marginBottom: 8,
};

const updated: CSSProperties = {
  fontSize: 13,
  color: "#4b5563",
  marginBottom: 48,
};

const h2: CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  color: "#e8eaf0",
  letterSpacing: "-0.01em",
  margin: "36px 0 12px",
};

const p: CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  lineHeight: 1.7,
  margin: "0 0 16px",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-app text-slate-100">
      <main>
        <div style={doc}>
          <h1 style={h1}>Privacy Policy</h1>
          <p style={updated}>Last updated: March 20, 2026</p>

          <h2 style={{ ...h2, marginTop: 0 }}>What we collect</h2>
          <p style={p}>
            We collect your Google account email and OAuth tokens to access your
            Google Ads account on your behalf. We read search term performance data
            to identify wasted spend. We do not collect personally identifiable
            information beyond your email address.
          </p>

          <h2 style={h2}>How we use your data</h2>
          <p style={p}>
            Your data is used exclusively to generate wasted spend reports and
            negative keyword suggestions inside Wasted Spend. We do not sell, share,
            or use your data for advertising or any purpose other than providing the
            service.
          </p>

          <h2 style={h2}>How we store your data</h2>
          <p style={p}>
            Account credentials and OAuth tokens are stored in Supabase with
            encryption at rest. Search term data is processed in memory and not
            permanently stored. We retain your data only as long as you have an
            active account.
          </p>

          <h2 style={h2}>Deleting your data</h2>
          <p style={p}>
            To delete your account and all associated data, visit your dashboard and
            click &quot;Disconnect Google Ads account&quot; at the bottom of the
            page. All data is permanently and immediately deleted. You can also
            email us at{" "}
            <a
              href="mailto:aaron@wastedspend.app"
              className="text-brand underline-offset-2 hover:underline"
            >
              aaron@wastedspend.app
            </a>{" "}
            to request deletion.
          </p>

          <h2 style={h2}>Contact</h2>
          <p style={{ ...p, marginBottom: 0 }}>
            For any privacy questions or requests, email{" "}
            <a
              href="mailto:aaron@wastedspend.app"
              className="text-brand underline-offset-2 hover:underline"
            >
              aaron@wastedspend.app
            </a>
          </p>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-8">
        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="text-brand hover:underline">
            Home
          </Link>
          {" · "}
          <Link href="/dashboard" className="hover:text-slate-400">
            Dashboard
          </Link>
        </p>
      </footer>
    </div>
  );
}
