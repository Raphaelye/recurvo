-- Recurvo: AI Smart Reviews.
--
-- Every hour, pg_cron calls the smart-reviews Edge Function. It finds the
-- accounts whose review is due (Weekly: Monday 9 AM, Monthly: the 1st at 9 AM,
-- in the phone's time zone), asks OpenAI to review their tracked subscriptions,
-- saves the reviews here and pushes { type: "review" } to the account's phone.
--
-- The app can read and delete its own reviews (deleting is for account deletion).
-- Only the function writes them, with service_role, which skips RLS.

-- The phone's time zone ---------------------------------------------------------
-- An IANA name such as "Africa/Lagos", saved by the app, so the review arrives at
-- 9 AM on the phone. Empty until the app saves it: the function then uses UTC.
alter table public.preferences
  add column time_zone text check (char_length(time_zone) between 1 and 64);

-- Smart reviews ----------------------------------------------------------------
-- The account's latest batch of reviews. Each run replaces the last one.
create table public.smart_reviews (
  user_id text not null,
  -- "<kind>:<subscription id>", e.g. "most-expensive:1234-netflix". The same as
  -- the app's local reviews, so a review answered with Keep (kept_reviews) stays
  -- hidden from one batch to the next.
  id text not null check (char_length(id) between 1 and 200),
  -- The tracked subscription the review is about. Cancel stops tracking it.
  subscription_id text not null check (char_length(subscription_id) between 1 and 100),
  kind text not null
    check (kind in ('most_expensive', 'overlap', 'foreign_currency', 'upcoming')),
  title text not null check (char_length(title) between 1 and 200),
  message text not null check (char_length(message) between 1 and 500),
  -- Order on Insights, 0 first. The push shows the first review's title.
  position smallint not null check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Review batches ---------------------------------------------------------------
-- One row per account: when its latest batch was made and in which currency its
-- amounts are written. The function uses it to send one review per due day. The
-- app shows the AI reviews only while the preferred currency is still this one.
create table public.review_batches (
  user_id text primary key,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now()
);

-- Access -----------------------------------------------------------------------
revoke all on table public.smart_reviews, public.review_batches from anon, authenticated;
grant select, delete on table public.smart_reviews, public.review_batches to authenticated;
grant select, insert, update, delete on table public.smart_reviews, public.review_batches
  to service_role;

alter table public.smart_reviews enable row level security;
alter table public.review_batches enable row level security;

create policy "Users can read their own smart reviews"
  on public.smart_reviews for select to authenticated
  using ((select auth.jwt()) ->> 'sub' = user_id);
create policy "Users can delete their own smart reviews"
  on public.smart_reviews for delete to authenticated
  using ((select auth.jwt()) ->> 'sub' = user_id);

create policy "Users can read their own review batch"
  on public.review_batches for select to authenticated
  using ((select auth.jwt()) ->> 'sub' = user_id);
create policy "Users can delete their own review batch"
  on public.review_batches for delete to authenticated
  using ((select auth.jwt()) ->> 'sub' = user_id);

-- Hourly run -------------------------------------------------------------------
-- pg_net sends the request after the job's transaction commits. The function's
-- URL and the shared secret it checks live in Vault, set once outside migrations:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<random secret>', 'smart_reviews_cron_secret');
-- The same secret is the function's SMART_REVIEWS_CRON_SECRET. It only starts a
-- run, so it is not the project's secret key.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- On the hour, so a review arrives at 9:00 in whole-hour time zones. The function
-- can take a couple of minutes, so pg_net waits up to 150s instead of 2s.
select cron.schedule(
  'send-smart-reviews',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/smart-reviews',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'smart_reviews_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);
