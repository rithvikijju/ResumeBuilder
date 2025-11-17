alter table public.resume_sources
  add column if not exists parse_status text default 'pending',
  add column if not exists parsed_at timestamptz,
  add column if not exists parse_error text;

create index if not exists resume_sources_user_status_idx
  on public.resume_sources (user_id, parse_status);

