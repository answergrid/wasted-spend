-- Run in Supabase SQL editor before deploying OAuth customer discovery.

ALTER TABLE public.connected_accounts
  ADD COLUMN IF NOT EXISTS customer_id text;

ALTER TABLE public.connected_accounts
  ADD COLUMN IF NOT EXISTS accessible_customer_ids jsonb;

COMMENT ON COLUMN public.connected_accounts.customer_id IS
  'Google Ads customer ID (digits) to scan — chosen at OAuth via listAccessibleCustomers.';

COMMENT ON COLUMN public.connected_accounts.accessible_customer_ids IS
  'JSON array of customer ID strings the user can access.';
