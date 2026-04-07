/**
 * Completed week Mon–Sun in UTC (relative to `now`), for digest copy.
 * When cron runs Monday 09:00 UTC, this is the prior Mon–Sun.
 */
export function getCompletedWeekRangeUtc(now: Date = new Date()): {
  label: string;
} {
  const utcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const d = new Date(utcMidnight);
  const dow = d.getUTCDay(); // 0 Sun … 6 Sat

  const lastSunday = new Date(d);
  lastSunday.setUTCDate(d.getUTCDate() - dow);

  const lastMonday = new Date(lastSunday);
  lastMonday.setUTCDate(lastSunday.getUTCDate() - 6);

  const fmt = (x: Date) =>
    x.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

  return {
    label: `Week of ${fmt(lastMonday)} to ${fmt(lastSunday)}`,
  };
}
