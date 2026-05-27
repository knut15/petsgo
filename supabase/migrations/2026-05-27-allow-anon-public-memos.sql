-- Allow anonymous (logged-out) users to read public memos and profiles.
-- Apply in Supabase Dashboard → SQL Editor → paste → Run.

-- ── memos: split into two policies, explicitly target both roles ──
drop policy if exists "memos_select_public_or_self" on public.memos;
drop policy if exists "memos_select_public" on public.memos;
drop policy if exists "memos_select_own" on public.memos;

create policy "memos_select_public" on public.memos
  for select
  to anon, authenticated
  using (is_public);

create policy "memos_select_own" on public.memos
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ── profiles: explicit anon + authenticated for the !inner join to work ──
drop policy if exists "profiles_select_all" on public.profiles;

create policy "profiles_select_all" on public.profiles
  for select
  to anon, authenticated
  using (true);

-- ── (bonus) likes view should already be readable by anon, ensure it ──
drop policy if exists "likes_select_all" on public.likes;

create policy "likes_select_all" on public.likes
  for select
  to anon, authenticated
  using (true);
