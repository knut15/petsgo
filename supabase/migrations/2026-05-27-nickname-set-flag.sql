-- Track whether user has explicitly set their nickname.
-- false on auto-create (OAuth-derived default), true after user updates display_name.

alter table public.profiles
  add column if not exists nickname_set boolean not null default false;
