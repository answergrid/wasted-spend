import type { Metadata } from "next";
import Link from "next/link";
import { BlogArticleShell } from "../_components/blog-article-shell";

export const metadata: Metadata = {
  title: "Google Ads Search Terms Report: Find and Fix Wasted Budget",
  alternates: {
    canonical: "https://wastedspend.app/blog/google-ads-search-terms-report",
  },
};

const h2 =
  "mt-12 mb-4 border-b border-slate-800 pb-2 text-2xl font-semibold tracking-[-0.015em] text-[#e8eaf0] sm:mt-14";
const h3 = "mt-8 mb-3 text-lg font-semibold text-[#e8eaf0]";
const p = "mb-5 leading-[1.7] text-[#9ca3af]";
const ul = "mb-5 list-disc space-y-2 pl-6 leading-[1.7] text-[#9ca3af]";

export default function GoogleAdsSearchTermsReportPage() {
  return (
    <BlogArticleShell>
      <h1 className="mb-6 text-3xl font-bold leading-tight tracking-[-0.02em] text-[#e8eaf0] sm:text-4xl">
        Google Ads Search Terms Report: Find and Fix Wasted Budget
      </h1>
      <p className={`${p} text-lg`}>
        The Search terms report is where your keywords meet reality: the exact
        phrases people typed before Google showed your ad. Learning to read it well
        is the fastest path to stopping budget leaks—whether you work manually or
        pair the report with automation.
      </p>
      <p className={p}>
        If you want the same ideas with heavier emphasis on{" "}
        <strong>what waste costs in real money</strong> before you open the UI, read{" "}
        <Link href="/blog/stop-wasting-google-ads-budget">
          how to stop wasting Google Ads budget on irrelevant searches
        </Link>
        —it builds from spend-level examples into the report workflow below.
      </p>

      <h2 className={h2}>What the search terms report shows</h2>
      <p className={p}>
        In the Google Ads UI, the Search terms view (under Campaigns → Keywords →
        Search terms, or via the Insights and reporting menus depending on your
        workspace version) lists queries that triggered impressions or clicks for
        your ads. Each row typically includes the search term, the keyword that
        matched, match type, and performance metrics.
      </p>
      <p className={p}>
        That last part is critical: you are not guessing what people might search;
        you are looking at <strong>evidence</strong>. If a query spent $40 last
        month with zero conversions while your account average is healthy, that row
        deserves a decision—negate, tighten match type, or isolate it in its own
        ad group with tailored creative.
      </p>
      <p className={p}>
        The report is also where you discover <strong>positive</strong> surprises:
        queries you might promote to their own exact-match keywords. This article
        focuses on waste, but the same screen fuels growth when you mine it in
        both directions.
      </p>

      <h2 className={h2}>How to identify irrelevant search terms</h2>
      <p className={p}>
        &quot;Irrelevant&quot; is not always profanity or obviously off-topic
        strings. Often it is softer intent: someone comparing vendors, looking for
        DIY instructions, or searching for a free template when you sell enterprise
        software. Use a simple rubric:
      </p>
      <ul className={ul}>
        <li>
          <strong>Intent:</strong> Would a person who converts on your site
          realistically type this?
        </li>
        <li>
          <strong>Economics:</strong> Is the CPC high enough that even a few clicks
          per week matter?
        </li>
        <li>
          <strong>Conversion history:</strong> Has this term (or close variants)
          ever converted? If not over a long lookback, skepticism is warranted.
        </li>
        <li>
          <strong>Brand safety:</strong> Does the query associate your brand with
          topics you avoid?
        </li>
      </ul>
      <p className={p}>
        Sorting by cost while filtering conversions to zero is the classic
        starting point. From there, expand to &quot;low conversion rate vs.
        account average&quot; if you want a more nuanced model. For framing how
        that spend fits into overall account waste, our guide on{" "}
        <Link href="/blog/reduce-google-ads-wasted-spend">
          reducing wasted spend in Google Ads
        </Link>{" "}
        walks through the cost side in more detail—including how averages like{" "}
        <strong>~23% of budget on irrelevant searches</strong> show up in
        benchmarks.
      </p>

      <h2 className={h2}>How to add negative keywords manually vs automatically</h2>
      <p className={p}>
        <strong>Manual addition</strong> is straightforward: select a search
        term, choose &quot;Add as negative keyword,&quot; pick campaign or ad group
        scope, and select match type (broad, phrase, or exact negative). Shared
        negative lists help when the same exclusions should apply across many
        campaigns—brand protection and employment-related queries are common
        examples.
      </p>
      <h3 className={h3}>Where manual work hurts</h3>
      <p className={p}>
        Manual work scales linearly with account complexity. Each new bad query is
        another row, another dialog, another chance to pick the wrong scope. Teams
        batch work in spreadsheets; freelancers bill by the hour. Neither model
        loves infinite repetition.
      </p>
      <p className={p}>
        <strong>Automation</strong> does not remove judgment—it removes tedium. A
        tool can run the same report logic every week, rank candidates by spend and
        conversion data, and prepare negatives for approval. You still decide what
        to block, but you spend minutes instead of afternoons. For the philosophy
        and workflow, read{" "}
        <Link href="/blog/automate-negative-keywords">
          how to automate negative keywords in Google Ads
        </Link>
        .
      </p>
      <p className={p}>
        Wasted Spend sits in the automated camp: connect your account, review
        surfaced terms, approve negatives in one click, repeat on a weekly rhythm.
        The goal is to make &quot;weekly search term hygiene&quot; the default, not
        the exception.
      </p>

      <h2 className={h2}>Why weekly audits matter</h2>
      <p className={p}>
        Search behavior is not static. Seasonality, news cycles, competitor moves,
        and Google&apos;s own matching behavior all introduce new queries. A
        quarterly audit might feel sufficient on paper, but in practice it means
        weeks of spend on patterns you would have blocked on day one if you had
        seen them.
      </p>
      <p className={p}>
        Weekly cadence hits a sweet spot: frequent enough to cap damage, rare
        enough that batching work still feels efficient—especially when software
        pre-sorts the list for you. It also aligns with how most advertisers think
        about other recurring tasks: bid checks, budget pacing, creative refreshes.
        The Search terms report deserves the same recurring calendar invite.
      </p>
      <p className={p}>
        Whether you start manually or jump straight to tooling, the objective is
        the same: <strong>less budget on searches that never convert</strong>, and
        more on the terms that do. The report is the map; negatives are the edits
        you make to stay on route.
      </p>
    </BlogArticleShell>
  );
}
