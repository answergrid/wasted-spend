-- Run in Supabase SQL editor: billing flags for Stripe + Customer Portal

alter table public.connected_accounts
  add column if not exists is_paid boolean not null default false;

alter table public.connected_accounts
  add column if not exists stripe_customer_id text;

create index if not exists connected_accounts_stripe_customer_id_idx
  on public.connected_accounts (stripe_customer_id);
