-- PetTrip Supabase schema
-- Apply this in Supabase Dashboard → SQL Editor → New query → paste → Run

-- ──────────────────────────────────────────────────────────────────
-- profiles: 1:1 with auth.users
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_upsert_self" on public.profiles;
create policy "profiles_upsert_self" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile row when a new auth.users is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'preferred_username',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────
-- favorites: per-user place collection
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  title text not null,
  addr1 text,
  firstimage text,
  contenttypeid text,
  added_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create index if not exists favorites_user_added_idx
  on public.favorites (user_id, added_at desc);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_self" on public.favorites;
create policy "favorites_select_self" on public.favorites
  for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert_self" on public.favorites;
create policy "favorites_insert_self" on public.favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_self" on public.favorites;
create policy "favorites_delete_self" on public.favorites
  for delete using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────
-- likes: global counts, per-user record
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create index if not exists likes_content_idx on public.likes (content_id);

alter table public.likes enable row level security;

drop policy if exists "likes_select_all" on public.likes;
create policy "likes_select_all" on public.likes
  for select using (true);

drop policy if exists "likes_insert_self" on public.likes;
create policy "likes_insert_self" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "likes_delete_self" on public.likes;
create policy "likes_delete_self" on public.likes
  for delete using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────
-- memos: one per (user, place), 200 chars max, public/private
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  body text not null check (char_length(body) between 1 and 200),
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, content_id)
);

create index if not exists memos_content_public_idx
  on public.memos (content_id) where is_public = true;

create index if not exists memos_user_idx
  on public.memos (user_id, updated_at desc);

alter table public.memos enable row level security;

drop policy if exists "memos_select_public_or_self" on public.memos;
create policy "memos_select_public_or_self" on public.memos
  for select using (is_public or auth.uid() = user_id);

drop policy if exists "memos_insert_self" on public.memos;
create policy "memos_insert_self" on public.memos
  for insert with check (auth.uid() = user_id);

drop policy if exists "memos_update_self" on public.memos;
create policy "memos_update_self" on public.memos
  for update using (auth.uid() = user_id);

drop policy if exists "memos_delete_self" on public.memos;
create policy "memos_delete_self" on public.memos
  for delete using (auth.uid() = user_id);

-- Auto-update updated_at on memo change.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists memos_touch on public.memos;
create trigger memos_touch
  before update on public.memos
  for each row execute function public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────────
-- like_counts: aggregated view (read-only)
-- ──────────────────────────────────────────────────────────────────
create or replace view public.like_counts as
  select content_id, count(*)::int as count
  from public.likes
  group by content_id;
