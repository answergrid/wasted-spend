import Link from "next/link";

/** Logo mark + “Wasted Spend” (shared by landing + dashboard nav). */
export function BrandLogoLink() {
  return (
    <Link
      href="/"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          background: "#0d9f6e",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
          <rect
            x="1"
            y="7"
            width="3"
            height="6"
            rx="1"
            fill="rgba(255,255,255,0.6)"
          />
          <rect
            x="5.5"
            y="4"
            width="3"
            height="9"
            rx="1"
            fill="rgba(255,255,255,0.6)"
          />
          <rect x="10" y="1" width="3" height="12" rx="1" fill="white" />
          <path
            d="M2.5 6 L7 3.5 L11.5 1"
            stroke="white"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#e8eaf0",
          letterSpacing: "-0.01em",
        }}
      >
        Wasted Spend
      </span>
    </Link>
  );
}
