-- Recurvo: one user's data per row, locked to that user with RLS.
--
-- Users sign in with Clerk, not Supabase Auth. Supabase checks the Clerk session
-- token and puts its claims in auth.jwt(). The Clerk user id ("user_2ab...") is
-- the "sub" claim. auth.uid() is not used: it expects a UUID.
--
-- Only signed-in users (the "authenticated" role) can reach these tables, and only
-- their own rows. The "anon" role gets nothing. Edge Functions use service_role,
-- which skips RLS, to send reminders and reviews.

-- Keeps updated_at current on every update.
create extension if not exists moddatetime with schema extensions;


-- Subscriptions ---------------------------------------------------------------
-- One row per TrackedSubscription (types/subscription.ts).

create table public.subscriptions (
  user_id text not null default (auth.jwt() ->> 'sub'),
  -- Made by the app, e.g. "1234-apple". Re-importing a card's statement reuses it.
  id text not null check (char_length(id) between 1 and 100),
  name text not null check (char_length(name) between 1 and 200),
  amount numeric not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  cycle text not null check (cycle in ('Weekly', 'Monthly', 'Yearly')),
  -- The exact time the app sends. Later renewals are projected from it and the cycle.
  next_renewal timestamptz not null,
  -- Only the card's name, last 4 digits and type, never the full number.
  card_name text not null check (char_length(card_name) between 1 and 100),
  card_last4 text not null check (card_last4 ~ '^[0-9]{4}$'),
  card_type text not null check (card_type in ('Debit', 'Credit', 'Virtual')),
  -- Remind 3 days before renewal. Statement imports don't set it and count as on.
  remind boolean not null default true,
  -- Set while the user has cancelled it.
  cancelled_at timestamptz,
  -- Remind the user to cancel with the provider before the next charge.
  cancel_reminder boolean not null default false,
  -- Set when added by hand. Statement imports have none.
  added_at timestamptz,
  -- A foreign-currency subscription's rate when it was added: one unit of
  -- `currency` in start_rate_currency. Both set or both empty.
  start_rate_currency text check (start_rate_currency ~ '^[A-Z]{3}$'),
  start_rate numeric check (start_rate > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check ((start_rate_currency is null) = (start_rate is null))
);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure extensions.moddatetime (updated_at);


-- Preferences -----------------------------------------------------------------
-- One row per user. The reminder and review functions read it.

create table public.preferences (
  user_id text primary key default (auth.jwt() ->> 'sub'),
  -- Empty until picked on Create account.
  preferred_currency text check (preferred_currency ~ '^[A-Z]{3}$'),
  -- Settings' Notifications switch. Off stops every notification.
  notifications_enabled boolean not null default true,
  -- How often the AI smart review is sent.
  review_alerts text not null default 'Weekly'
    check (review_alerts in ('Weekly', 'Monthly', 'Off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger preferences_updated_at
  before update on public.preferences
  for each row execute procedure extensions.moddatetime (updated_at);


-- Kept reviews ----------------------------------------------------------------
-- The Smart Reviews the user answered "Keep" to, so they stay hidden.

create table public.kept_reviews (
  user_id text not null default (auth.jwt() ->> 'sub'),
  review_id text not null check (char_length(review_id) between 1 and 200),
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);


-- Push tokens -----------------------------------------------------------------
-- Each device's Expo push token. A phone can be signed into different accounts
-- over time, so the same token can have a row per account. The app deletes its
-- row on sign-out and saves it again on sign-in, which moves updated_at forward.
-- The reminder function only sends a token to the account with the newest
-- updated_at, so an old account's row that was never deleted is never used.

create table public.push_tokens (
  user_id text not null default (auth.jwt() ->> 'sub'),
  token text not null check (token ~ '^Expo(nent)?PushToken\[.+\]$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

-- The reminder function looks up the newest account per token.
create index push_tokens_token_updated_at_idx
  on public.push_tokens (token, updated_at desc);

create trigger push_tokens_updated_at
  before update on public.push_tokens
  for each row execute procedure extensions.moddatetime (updated_at);


-- Access ----------------------------------------------------------------------
-- Grants decide who can reach a table through the Data API, RLS decides which
-- rows. Revoke first so anon gets nothing, whatever the project's default grants.

revoke all on table
  public.subscriptions, public.preferences, public.kept_reviews, public.push_tokens
  from anon, authenticated;

grant select, insert, update, delete on table public.subscriptions to authenticated;
grant select, insert, update, delete on table public.preferences to authenticated;
grant select, insert, delete on table public.kept_reviews to authenticated;
grant select, insert, update, delete on table public.push_tokens to authenticated;

grant select, insert, update, delete on table
  public.subscriptions, public.preferences, public.kept_reviews, public.push_tokens
  to service_role;

alter table public.subscriptions enable row level security;
alter table public.preferences enable row level security;
alter table public.kept_reviews enable row level security;
alter table public.push_tokens enable row level security;


-- RLS policies ----------------------------------------------------------------
-- Every policy: a signed-in user, and only rows whose user_id is their Clerk id.
-- (select ...) makes Postgres read the token once per query, not once per row.
-- Updates check both the row before (using) and after (with check), so a user
-- can't move a row to another account.

create policy "Users can read their own subscriptions"
  on public.subscriptions for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can add their own subscriptions"
  on public.subscriptions for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can change their own subscriptions"
  on public.subscriptions for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own subscriptions"
  on public.subscriptions for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);


create policy "Users can read their own preferences"
  on public.preferences for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can add their own preferences"
  on public.preferences for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can change their own preferences"
  on public.preferences for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own preferences"
  on public.preferences for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);


create policy "Users can read their own kept reviews"
  on public.kept_reviews for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can add their own kept reviews"
  on public.kept_reviews for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own kept reviews"
  on public.kept_reviews for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);


create policy "Users can read their own push tokens"
  on public.push_tokens for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can add their own push tokens"
  on public.push_tokens for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can change their own push tokens"
  on public.push_tokens for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own push tokens"
  on public.push_tokens for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);
