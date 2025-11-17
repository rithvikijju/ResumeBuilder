create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  headline text,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  summary text,
  highlights text[],
  raw_input text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.job_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  role_title text,
  company text,
  location text,
  job_description text,
  seniority text,
  skills text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create type public.resume_format as enum ('pdf', 'latex');

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  job_target_id uuid references public.job_targets on delete set null,
  title text not null,
  status text default 'draft',
  format resume_format default 'pdf',
  structured_content jsonb not null,
  ai_prompt jsonb,
  ai_response jsonb,
  pdf_url text,
  latex_source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.resume_activity_log (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes on delete cascade,
  event text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.project_records enable row level security;
alter table public.job_targets enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_activity_log enable row level security;

create policy "Users can manage their profile"
  on public.profiles
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can manage their projects"
  on public.project_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their job targets"
  on public.job_targets
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can view their resumes"
  on public.resumes
  for select using (user_id = auth.uid());

create policy "Users can modify their resumes"
  on public.resumes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can view their resume activity"
  on public.resume_activity_log
  for select using (
    resume_id in (
      select id from public.resumes where user_id = auth.uid()
    )
  );

create policy "Users can append resume activity"
  on public.resume_activity_log
  for insert with check (
    resume_id in (
      select id from public.resumes where user_id = auth.uid()
    )
  );

-- Ensure timestamps reflect updates
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_project_records_updated_at
  before update on public.project_records
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_job_targets_updated_at
  before update on public.job_targets
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_resumes_updated_at
  before update on public.resumes
  for each row
  execute procedure public.handle_updated_at();

