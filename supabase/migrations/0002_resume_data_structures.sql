create table if not exists public.resume_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  storage_path text not null,
  original_name text,
  content_type text,
  parsed text,
  status text default 'uploaded',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.experience_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  source_document_id uuid references public.resume_documents on delete set null,
  title text not null,
  company text,
  location text,
  start_date date,
  end_date date,
  is_current boolean default false,
  description text,
  highlights text[],
  skills text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.education_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  source_document_id uuid references public.resume_documents on delete set null,
  institution text not null,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  honors text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.skill_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  source_document_id uuid references public.resume_documents on delete set null,
  category text,
  skills text[] not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.achievement_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  source_document_id uuid references public.resume_documents on delete set null,
  title text not null,
  description text,
  issued_by text,
  issued_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.resume_experience_link (
  resume_id uuid references public.resumes on delete cascade,
  experience_id uuid references public.experience_records on delete cascade,
  position integer,
  primary key (resume_id, experience_id)
);

create table if not exists public.resume_education_link (
  resume_id uuid references public.resumes on delete cascade,
  education_id uuid references public.education_records on delete cascade,
  position integer,
  primary key (resume_id, education_id)
);

create table if not exists public.resume_skill_link (
  resume_id uuid references public.resumes on delete cascade,
  skill_id uuid references public.skill_records on delete cascade,
  category text,
  primary key (resume_id, skill_id)
);

alter table public.resume_documents enable row level security;
alter table public.experience_records enable row level security;
alter table public.education_records enable row level security;
alter table public.skill_records enable row level security;
alter table public.achievement_records enable row level security;
alter table public.resume_experience_link enable row level security;
alter table public.resume_education_link enable row level security;
alter table public.resume_skill_link enable row level security;

create policy "Users can manage their resume documents"
  on public.resume_documents
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their experience records"
  on public.experience_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their education records"
  on public.education_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their skill records"
  on public.skill_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their achievements"
  on public.achievement_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage resume experience links"
  on public.resume_experience_link
  using (
    resume_id in (select id from public.resumes where user_id = auth.uid())
    and experience_id in (
      select id from public.experience_records where user_id = auth.uid()
    )
  )
  with check (
    resume_id in (select id from public.resumes where user_id = auth.uid())
    and experience_id in (
      select id from public.experience_records where user_id = auth.uid()
    )
  );

create policy "Users can manage resume education links"
  on public.resume_education_link
  using (
    resume_id in (select id from public.resumes where user_id = auth.uid())
    and education_id in (
      select id from public.education_records where user_id = auth.uid()
    )
  )
  with check (
    resume_id in (select id from public.resumes where user_id = auth.uid())
    and education_id in (
      select id from public.education_records where user_id = auth.uid()
    )
  );

create policy "Users can manage resume skill links"
  on public.resume_skill_link
  using (
    resume_id in (select id from public.resumes where user_id = auth.uid())
    and skill_id in (
      select id from public.skill_records where user_id = auth.uid()
    )
  )
  with check (
    resume_id in (select id from public.resumes where user_id = auth.uid())
    and skill_id in (
      select id from public.skill_records where user_id = auth.uid()
    )
  );

