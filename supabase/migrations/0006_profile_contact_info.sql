-- Add phone and links to profiles table for resume header
alter table public.profiles
  add column if not exists phone text,
  add column if not exists links jsonb default '[]'::jsonb;

-- Add trigger for profiles updated_at
create trigger if not exists handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

