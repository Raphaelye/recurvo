-- Same policies, written so Supabase's Advisors recognise them.
--
-- (select auth.jwt() ->> 'sub') already reads the token once per query, but
-- Postgres stores it as "SELECT (auth.jwt() ->> ...)", which the auth_rls_initplan
-- check doesn't match. (select auth.jwt()) ->> 'sub' is stored as
-- "SELECT auth.jwt() AS jwt", which it does. Access is unchanged.

alter policy "Users can read their own subscriptions" on public.subscriptions
  using ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can add their own subscriptions" on public.subscriptions
  with check ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can change their own subscriptions" on public.subscriptions
  using ((select auth.jwt()) ->> 'sub' = user_id)
  with check ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can delete their own subscriptions" on public.subscriptions
  using ((select auth.jwt()) ->> 'sub' = user_id);

alter policy "Users can read their own preferences" on public.preferences
  using ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can add their own preferences" on public.preferences
  with check ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can change their own preferences" on public.preferences
  using ((select auth.jwt()) ->> 'sub' = user_id)
  with check ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can delete their own preferences" on public.preferences
  using ((select auth.jwt()) ->> 'sub' = user_id);

alter policy "Users can read their own kept reviews" on public.kept_reviews
  using ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can add their own kept reviews" on public.kept_reviews
  with check ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can delete their own kept reviews" on public.kept_reviews
  using ((select auth.jwt()) ->> 'sub' = user_id);

alter policy "Users can read their own push tokens" on public.push_tokens
  using ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can add their own push tokens" on public.push_tokens
  with check ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can change their own push tokens" on public.push_tokens
  using ((select auth.jwt()) ->> 'sub' = user_id)
  with check ((select auth.jwt()) ->> 'sub' = user_id);
alter policy "Users can delete their own push tokens" on public.push_tokens
  using ((select auth.jwt()) ->> 'sub' = user_id);
