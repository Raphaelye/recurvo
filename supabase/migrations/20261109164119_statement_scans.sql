-- Recurvo: a row per statement sent to the parse-statement Edge Function (card
-- read or full scan), so it can cap each account at 20 a day. Each request spends
-- OpenAI credits.
--
-- Only the Edge Function reaches this table, with service_role, which skips RLS.
-- The app can't read or write it: anon and authenticated get no grants, and RLS
-- is on with no policies as a second lock. No statement contents are kept here,
-- only who sent one and when.

create table public.statement_scans (
  id bigint generated always as identity primary key,
  -- The Clerk user id ("sub" of the session token the function verified).
  user_id text not null check (char_length(user_id) between 1 and 100),
  created_at timestamptz not null default now()
);

-- The function counts an account's rows from the last 24 hours.
create index statement_scans_user_id_created_at_idx
  on public.statement_scans (user_id, created_at);

revoke all on table public.statement_scans from anon, authenticated;
grant select, insert, delete on table public.statement_scans to service_role;

alter table public.statement_scans enable row level security;
