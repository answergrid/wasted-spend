import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";

export default function Home() {
  return (
    <div className="min-h-screen bg-app text-slate-100">
      <header className="sticky top-0 z-50 bg-app/90 backdrop-blur-md">
        <LandingNav />
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pt-24">
          <h1
            className="text-balance text-2xl font-semibold text-white sm:text-4xl lg:text-5xl"
            style={{ letterSpacing: "-0.03em", lineHeight: 1.15 }}
          >
            Stop paying for searches that don&apos;t convert.
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl text-base sm:mt-6 sm:text-lg"
            style={{ color: "#6b7280", fontWeight: 400 }}
          >
            Connect your Google Ads account. We find the searches wasting your
            budget. Block them in one click.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex w-full max-w-sm items-center justify-center text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-[#0a0f1a] sm:w-auto"
              style={{
                background: "#0d9f6e",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                padding: "12px 24px",
                letterSpacing: "-0.01em",
              }}
            >
              See my wasted spend
            </Link>
            <p className="mt-2 text-sm text-slate-500">
              Free scan included — no credit card required
            </p>
          </div>
        </section>

        {/* Social proof bar */}
        <section className="border-y border-white/[0.06] bg-white/[0.02] py-8 sm:py-10">
          <p className="mx-auto max-w-3xl px-4 text-center text-sm leading-relaxed text-slate-500 sm:px-6 sm:text-base">
            The average Google Ads account wastes 23% of budget on irrelevant
            searches.
          </p>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <h2 className="text-center text-2xl font-semibold text-white sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-slate-400 sm:text-base">
            Three steps to cut wasted spend without guesswork.
          </p>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            <li className="relative rounded-2xl border border-subtle bg-card p-6 text-center md:text-left">
              <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand md:mx-0">
                1
              </span>
              <h3 className="text-lg font-semibold text-white">Connect</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Link your Google Ads account securely in one click
              </p>
            </li>
            <li className="relative rounded-2xl border border-subtle bg-card p-6 text-center md:text-left">
              <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand md:mx-0">
                2
              </span>
              <h3 className="text-lg font-semibold text-white">Review</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                See exactly which searches are wasting your budget
              </p>
            </li>
            <li className="relative rounded-2xl border border-subtle bg-card p-6 text-center md:text-left">
              <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand md:mx-0">
                3
              </span>
              <h3 className="text-lg font-semibold text-white">Block</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Stop paying for searches that never convert
              </p>
            </li>
          </ol>
        </section>

        {/* Pricing */}
        <section className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-semibold text-white sm:text-3xl">
              Pricing
            </h2>

            <div className="mt-10 grid gap-6 rounded-2xl border border-subtle bg-card p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Free
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <span className="text-slate-500" aria-hidden>
                      —
                    </span>
                    See your top 3 wasted searches
                  </li>
                  <li className="flex gap-2">
                    <span className="text-slate-500" aria-hidden>
                      —
                    </span>
                    One on-demand scan
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  $29
                  <span className="text-base font-medium text-slate-400 sm:text-lg">
                    /mo
                  </span>
                </p>
                <h3 className="mt-3 text-center text-sm font-semibold uppercase tracking-wide text-brand">
                  Pro
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <span className="text-brand" aria-hidden>
                      ✓
                    </span>
                    See all wasted searches
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand" aria-hidden>
                      ✓
                    </span>
                    One-click blocking
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand" aria-hidden>
                      ✓
                    </span>
                    Weekly automated scans
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand" aria-hidden>
                      ✓
                    </span>
                    Email digest every Monday
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand" aria-hidden>
                      ✓
                    </span>
                    Blocked searches library
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand" aria-hidden>
                      ✓
                    </span>
                    Cancel anytime
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="px-4 text-center sm:px-6">
          <p className="text-sm text-slate-500">
            Wasted Spend — Built for Google Ads advertisers
          </p>
          <a
            href="/privacy"
            className="mt-3 inline-block text-sm text-slate-400 hover:text-white"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
