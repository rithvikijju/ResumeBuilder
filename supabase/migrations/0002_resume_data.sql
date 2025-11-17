create extension if not exists "pg_trgm";

create table if not exists public.resume_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  original_filename text,
  mime_type text,
  extracted_text text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  role_title text,
  company text,
  location text,
  seniority text,
  source_url text,
  job_text text not null,
  keywords text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.experience_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  resume_source_id uuid references public.resume_sources on delete set null,
  organization text,
  role_title text,
  location text,
  start_date date,
  end_date date,
  is_current boolean default false,
  summary text,
  achievements text[],
  skills text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.education_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  resume_source_id uuid references public.resume_sources on delete set null,
  institution text,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  achievements text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.skill_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  resume_source_id uuid references public.resume_sources on delete set null,
  category text,
  skills text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.resume_sources enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.experience_records enable row level security;
alter table public.education_records enable row level security;
alter table public.skill_records enable row level security;

create policy "Users manage resume sources"
  on public.resume_sources
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage job descriptions"
  on public.job_descriptions
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage experience records"
  on public.experience_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage education records"
  on public.education_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage skill records"
  on public.skill_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger handle_resume_sources_updated_at
  before update on public.resume_sources
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_job_descriptions_updated_at
  before update on public.job_descriptions
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_experience_records_updated_at
  before update on public.experience_records
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_education_records_updated_at
  before update on public.education_records
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_skill_records_updated_at
  before update on public.skill_records
  for each row
  execute procedure public.handle_updated_at();

alter table public.resumes
  add column if not exists job_description_id uuid references public.job_descriptions on delete set null;

