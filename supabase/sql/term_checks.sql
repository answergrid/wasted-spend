-- Run in Supabase SQL editor. Audit log for manual search-term waste checks.

CREATE TABLE IF NOT EXISTS term_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_email text NOT NULL,
  search_term text NOT NULL,
  risk_level text NOT NULL,
  reasons jsonb,
  checked_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS term_checks_account_checked_at_idx
  ON term_checks (account_email, checked_at DESC);

COMMENT ON TABLE term_checks IS 'Pro “Check a search term” submissions for product intelligence.';
