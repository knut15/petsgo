-- One pet per user. Stored inline on profiles since cardinality is 1:1.
-- If multi-pet support is later required, migrate to a `pets` table.

alter table public.profiles
  add column if not exists pet_name text,
  add column if not exists pet_species text,
  add column if not exists pet_avatar_url text;

alter table public.profiles
  drop constraint if exists profiles_pet_species_check;

alter table public.profiles
  add constraint profiles_pet_species_check
  check (pet_species is null or pet_species in ('dog', 'cat', 'other'));
