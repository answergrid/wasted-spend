-- Run in Supabase SQL editor (or migrate) to add the blocked searches library.

create table if not exists public.blocked_searches (
  id uuid default gen_random_uuid() primary key,
  account_email text not null,
  search_term text not null,
  cost_at_block numeric not null,
  impressions_at_block integer not null,
  blocked_at timestamp with time zone default now(),
  is_active boolean default true
);

create index if not exists blocked_searches_account_email_idx
  on public.blocked_searches (account_email);

create index if not exists blocked_searches_account_active_idx
  on public.blocked_searches (account_email)
  where is_active = true;

alter table public.blocked_searches enable row level security;

-- API routes use SUPABASE_SERVICE_ROLE_KEY and bypass RLS.
-- If you ever use the anon key from the client, add explicit policies.
