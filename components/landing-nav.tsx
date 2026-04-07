import Link from "next/link";
import { BrandLogoLink } from "./brand-logo";

export function LandingNav() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 0,
      }}
    >
      <BrandLogoLink />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Link
          href="/blog"
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#9ca3af",
            textDecoration: "none",
          }}
        >
          Blog
        </Link>
        <Link
          href="/dashboard"
          style={{
            background: "#0d9f6e",
            color: "white",
            border: "none",
            borderRadius: 7,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
