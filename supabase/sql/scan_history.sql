-- Run in Supabase SQL editor. Stores one row per dashboard/API scan for week-over-week comparison.

CREATE TABLE IF NOT EXISTS scan_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_email text NOT NULL,
  total_wasted numeric NOT NULL,
  term_count integer NOT NULL,
  scanned_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS scan_history_account_email_scanned_at_idx
  ON scan_history (account_email, scanned_at DESC);

COMMENT ON TABLE scan_history IS 'Wasted-spend scan snapshots; latest two rows per account drive WoW delta in the dashboard.';
