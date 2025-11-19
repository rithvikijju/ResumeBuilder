-- Add template_id column to resumes table
alter table public.resumes 
add column if not exists template_id text default 'cs';

-- Add comment
comment on column public.resumes.template_id is 'Template identifier (ib, quant, cs, or custom template id)';

