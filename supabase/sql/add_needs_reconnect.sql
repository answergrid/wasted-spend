-- Run in Supabase SQL editor: flag accounts whose Google refresh token is invalid.

alter table public.connected_accounts
  add column if not exists needs_reconnect boolean not null default false;

comment on column public.connected_accounts.needs_reconnect is
  'Set true when Google OAuth refresh returns invalid_grant; cleared on successful scan or new OAuth.';
