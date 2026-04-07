/** Lowercase substrings / phrases for waste-intent signals (check-term feature). */

export const WASTE_PATTERN_GROUPS = [
  {
    label: "Job/career",
    patterns: [
      "jobs",
      "careers",
      "salary",
      "hiring",
      "resume",
      "interview",
      "work from home",
    ],
  },
  {
    label: "Free/cheap",
    patterns: [
      "free",
      "cheap",
      "discount",
      "trial",
      "no cost",
      "affordable",
      "coupon",
    ],
  },
  {
    label: "DIY/how-to",
    patterns: [
      "how to",
      "tutorial",
      "guide",
      "diy",
      "yourself",
      "learn",
      "course",
      "training",
    ],
  },
  {
    label: "Competitor/research",
    patterns: [
      "vs",
      "versus",
      "alternative",
      "competitor",
      "review",
      "comparison",
      "best",
    ],
  },
  {
    label: "Negative intent",
    patterns: [
      "cancel",
      "refund",
      "complaint",
      "scam",
      "problem",
      "issue",
      "bad",
    ],
  },
] as const;

export type PatternMatch = { label: string; matched: string };

export function findPatternMatches(normalizedQuery: string): PatternMatch[] {
  const out: PatternMatch[] = [];
  const q = normalizedQuery.toLowerCase();

  for (const group of WASTE_PATTERN_GROUPS) {
    for (const p of group.patterns) {
      if (q.includes(p.toLowerCase())) {
        out.push({ label: group.label, matched: p });
        break;
      }
    }
  }
  return out;
}

export function patternReasons(matches: PatternMatch[]): string[] {
  return matches.map(
    (m) =>
      `${m.label}: matches “${m.matched}” — often lower purchase intent or off-topic traffic.`
  );
}
