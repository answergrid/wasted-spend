/* eslint-disable @next/next/no-page-custom-font -- Inter loaded via <link> per product design */
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wastedspend.app"),
  title: {
    default: "Wasted Spend — Stop Paying for Google Ads That Don't Convert",
    template: "%s | Wasted Spend",
  },
  description:
    "Find and block Google Ads search terms wasting your budget. Connect your account, see zero-conversion searches, block them in one click.",
  alternates: {
    canonical: "https://wastedspend.app",
  },
  verification: {
    google: [
      "M9dx9Sb-bNiQ4zLHMcfJlcdHCBaTublSzqlhpBSxNhY",
      "rWaUA1aH5DqBLB7kXGO8BpL_cvbL2h6lIEEUWj32b0E",
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0f1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-app text-slate-100 antialiased">{children}</body>
    </html>
  );
}
