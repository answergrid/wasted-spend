import type { Metadata } from "next";
import Link from "next/link";
import { BlogHeader } from "./_components/blog-header";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical guides for Google Ads advertisers who want less wasted spend and a repeatable negative keyword practice.",
  alternates: {
    canonical: "https://wastedspend.app/blog",
  },
};

const posts = [
  {
    href: "/blog/stop-wasting-google-ads-budget",
    title: "How to Stop Wasting Google Ads Budget on Irrelevant Searches",
    description:
      "What 23% waste means in dollars, why broad match and weak negatives leak budget, how to use the Search terms report, manual vs automated negative keywords, and Wasted Spend.",
  },
  {
    href: "/blog/automate-negative-keywords",
    title: "How to Automate Negative Keywords in Google Ads",
    description:
      "What negatives are, why manual management fails, how ~23% of budget often leaks to irrelevant searches, and how automation closes the loop.",
  },
  {
    href: "/blog/reduce-google-ads-wasted-spend",
    title: "How to Reduce Wasted Spend in Google Ads",
    description:
      "Causes of wasted spend, why advertisers underuse the Search terms report, how to estimate cost from zero-conversion queries, and a weekly negative keyword system.",
  },
  {
    href: "/blog/google-ads-search-terms-report",
    title: "Google Ads Search Terms Report: Find and Fix Wasted Budget",
    description:
      "How to read the report, spot irrelevant terms, choose manual vs automated negatives, and why weekly audits beat one-off cleanups.",
  },
] as const;

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-app text-slate-100">
      <BlogHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:max-w-4xl lg:py-16">
        <h1
          className="text-3xl font-bold text-[#e8eaf0] sm:text-4xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          Blog
        </h1>
        <p
          className="mt-4 max-w-2xl text-lg leading-[1.7] text-[#9ca3af]"
        >
          Practical guides for Google Ads advertisers who want less wasted spend and
          a repeatable negative keyword practice—manual, automated, or both.
        </p>

        <ul className="mt-12 space-y-8">
          {posts.map((post) => (
            <li key={post.href}>
              <article className="rounded-2xl border border-subtle bg-card p-6 transition hover:border-white/10 sm:p-8">
                <h2
                  className="text-xl font-semibold sm:text-2xl"
                  style={{ letterSpacing: "-0.015em", color: "#e8eaf0" }}
                >
                  <Link
                    href={post.href}
                    className="text-white transition-colors hover:text-brand"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 leading-[1.7] text-[#9ca3af]">
                  {post.description}
                </p>
                <Link
                  href={post.href}
                  className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand/80"
                >
                  Read article →
                </Link>
              </article>
            </li>
          ))}
        </ul>
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
