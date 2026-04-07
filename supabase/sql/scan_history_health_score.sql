-- Run in Supabase SQL editor. Adds persisted health score per scan for trends.

ALTER TABLE scan_history
  ADD COLUMN IF NOT EXISTS health_score numeric NOT NULL DEFAULT 100;

COMMENT ON COLUMN scan_history.health_score IS 'Account health 0–100 at scan time; compare consecutive rows for delta.';
