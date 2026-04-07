/**
 * Account health 0–100 from unblocked wasted terms + blocked search count.
 * Deductions capped at 80 pts (floor 20 before block bonuses); total capped at 100.
 */
export function computeHealthScore(
  unblockedWastedTerms: { cost: number }[],
  blockedSearchCount: number
): number {
  let deductions = 0;
  for (const t of unblockedWastedTerms) {
    const c = Number(t.cost) || 0;
    if (c > 5) deductions += 8;
    else if (c >= 2) deductions += 4;
    else deductions += 2;
  }
  deductions = Math.min(deductions, 80);

  let score = 100 - deductions;
  score += blockedSearchCount * 3;
  score = Math.min(100, score);
  score = Math.max(20, score);

  return Math.round(score);
}

export function healthScoreColor(score: number): string {
  if (score >= 80) return "#0d9f6e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}
