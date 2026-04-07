import type { CSSProperties } from "react";

const sectionLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "#4b5563",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

/**
 * Pro-only: explains weekly automation; no persisted scan log in DB yet.
 */
export function WeeklyScanHistory() {
  return (
    <section className="mt-12 rounded-xl border border-subtle bg-card p-6 shadow-lg shadow-black/20 sm:p-8">
      <p style={{ ...sectionLabel, margin: 0 }}>Weekly scans</p>
      <p style={{ fontSize: 14, color: "#4b5563", margin: "12px 0 0" }}>
        Runs every Monday at 9am. Results arrive in your inbox.
      </p>
    </section>
  );
}
