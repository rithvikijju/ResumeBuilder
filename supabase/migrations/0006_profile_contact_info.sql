-- Add phone and links to profiles table for resume header
alter table public.profiles
  add column if not exists phone text,
  add column if not exists links jsonb default '[]'::jsonb;

-- Add trigger for profiles updated_at (drop first if exists)
drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

