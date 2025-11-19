-- Create resume_templates table for storing custom templates
create table if not exists public.resume_templates (
  id text primary key,
  name text not null,
  description text,
  category text not null check (category in ('finance', 'tech', 'custom')),
  is_default boolean default false,
  template_config jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists idx_resume_templates_category on public.resume_templates(category);
create index if not exists idx_resume_templates_default on public.resume_templates(is_default);

-- Enable RLS (but allow public read access for templates)
alter table public.resume_templates enable row level security;

-- Allow anyone to read templates (they're not user-specific)
create policy "Templates are publicly readable"
  on public.resume_templates
  for select
  using (true);

-- Only authenticated users can insert/update/delete (for admin functionality)
create policy "Authenticated users can manage templates"
  on public.resume_templates
  for all
  using (auth.role() = 'authenticated');

-- Create updated_at trigger
create or replace function handle_resume_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_resume_templates_updated_at
  before update on public.resume_templates
  for each row
  execute function handle_resume_templates_updated_at();

-- Insert default templates (these can also be loaded via the load-templates script)
-- To load templates from JSON files, run: npm run load-templates
insert into public.resume_templates (id, name, description, category, is_default, template_config) values
('ib', 'Investment Banking', 'Traditional, conservative format preferred by finance firms. Clean, professional, and ATS-friendly.', 'finance', true, '{
  "style": {
    "fontFamily": "Times New Roman, serif",
    "fontSize": "11pt",
    "lineHeight": "1.15",
    "spacing": "tight",
    "colors": {
      "primary": "#000000",
      "secondary": "#333333",
      "accent": "#000000",
      "text": "#000000",
      "background": "#FFFFFF"
    }
  },
  "layout": {
    "headerStyle": "centered",
    "sectionOrder": ["Education", "Experience", "Leadership", "Skills", "Additional"],
    "showSummary": true,
    "showSkills": true,
    "skillsFormat": "categories"
  },
  "formatting": {
    "emphasisStyle": "bold",
    "dateFormat": "MM/YYYY",
    "bulletStyle": "bullet"
  }
}'),
('quant', 'Quantitative Finance', 'Technical format emphasizing skills, projects, and quantitative achievements. Perfect for quant roles.', 'finance', true, '{
  "style": {
    "fontFamily": "Arial, sans-serif",
    "fontSize": "10pt",
    "lineHeight": "1.2",
    "spacing": "normal",
    "colors": {
      "primary": "#1a1a1a",
      "secondary": "#4a4a4a",
      "accent": "#0066cc",
      "text": "#1a1a1a",
      "background": "#FFFFFF"
    }
  },
  "layout": {
    "headerStyle": "left-aligned",
    "sectionOrder": ["Education", "Technical Skills", "Experience", "Projects", "Publications"],
    "showSummary": true,
    "showSkills": true,
    "skillsFormat": "categories"
  },
  "formatting": {
    "emphasisStyle": "bold",
    "dateFormat": "MMM YYYY",
    "bulletStyle": "bullet"
  }
}'),
('cs', 'Computer Science', 'Modern tech resume format. Highlights projects, technical skills, and impact metrics. Great for software engineering roles.', 'tech', true, '{
  "style": {
    "fontFamily": "Calibri, Arial, sans-serif",
    "fontSize": "11pt",
    "lineHeight": "1.3",
    "spacing": "normal",
    "colors": {
      "primary": "#2c3e50",
      "secondary": "#34495e",
      "accent": "#3498db",
      "text": "#2c3e50",
      "background": "#FFFFFF"
    }
  },
  "layout": {
    "headerStyle": "left-aligned",
    "sectionOrder": ["Experience", "Projects", "Education", "Technical Skills"],
    "showSummary": false,
    "showSkills": true,
    "skillsFormat": "inline"
  },
  "formatting": {
    "emphasisStyle": "bold",
    "dateFormat": "MMM YYYY",
    "bulletStyle": "bullet"
  }
}')
on conflict (id) do nothing;

