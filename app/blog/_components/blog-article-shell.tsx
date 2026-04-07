import Link from "next/link";
import type { ReactNode } from "react";
import { BlogHeader } from "./blog-header";

type Props = {
  children: ReactNode;
  /** Defaults to `/dashboard`. */
  ctaHref?: string;
};

export function BlogArticleShell({
  children,
  ctaHref = "/dashboard",
}: Props) {
  return (
    <div className="min-h-screen bg-app text-slate-100">
      <BlogHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:max-w-4xl lg:py-16">
        <div className="blog-prose text-base leading-[1.7] text-[#9ca3af] [&_a]:text-brand [&_a]:underline-offset-2 hover:[&_a]:underline [&_h1]:tracking-[-0.02em] [&_h1]:text-[#e8eaf0] [&_h2]:tracking-[-0.015em] [&_h2]:text-[#e8eaf0] [&_h3]:text-[#e8eaf0] [&_strong]:text-white">
          {children}
        </div>
        <section className="mt-16 rounded-2xl border border-brand/30 bg-brand/[0.08] p-8 text-center">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Ready to cut wasted spend?
          </h2>
          <p className="mt-3 text-[#9ca3af]">
            Connect your Google Ads account and find high-cost, zero-conversion
            searches in minutes.
          </p>
          <Link
            href={ctaHref}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand px-8 py-3 text-base font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-brand/90"
          >
            See your wasted spend free
          </Link>
        </section>
      </article>
      <footer className="border-t border-white/[0.06] py-8">
        <p className="text-center text-sm text-slate-500">
          <Link href="/blog" className="text-brand hover:underline">
            More articles
          </Link>
          {" · "}
          <Link href="/" className="hover:text-slate-400">
            Home
          </Link>
        </p>
      </footer>
    </div>
  );
}
