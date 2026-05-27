-- Change foreign keys on memos/likes/favorites to reference profiles(id)
-- instead of auth.users(id), so PostgREST can embed profiles in queries.
-- profiles.id is itself FK to auth.users(id) on delete cascade,
-- so behavior is identical.
-- Apply in Supabase Dashboard → SQL Editor → paste → Run.

alter table public.memos
  drop constraint if exists memos_user_id_fkey;

alter table public.memos
  add constraint memos_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.likes
  drop constraint if exists likes_user_id_fkey;

alter table public.likes
  add constraint likes_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.favorites
  drop constraint if exists favorites_user_id_fkey;

alter table public.favorites
  add constraint favorites_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;
