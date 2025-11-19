# Resume Templates

This directory contains JSON template files that can be loaded into the database.

## How to Load Templates

### Option 1: Using the Script (Recommended)

1. Make sure you have your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the load script:
   ```bash
   npm run load-templates
   ```

This will read all `.json` files in this directory and upload them to the `resume_templates` table.

### Option 2: Manual SQL Insert

You can also manually insert templates using SQL in the Supabase SQL editor. Copy the contents of a template JSON file and use this format:

```sql
INSERT INTO public.resume_templates (id, name, description, category, is_default, template_config)
VALUES (
  'template-id',
  'Template Name',
  'Template description',
  'finance', -- or 'tech' or 'custom'
  true, -- or false
  '{
    "style": { ... },
    "layout": { ... },
    "formatting": { ... }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_default = EXCLUDED.is_default,
  template_config = EXCLUDED.template_config;
```

## Template File Format

Each template file should be a JSON file with the following structure:

```json
{
  "id": "unique-template-id",
  "name": "Template Display Name",
  "description": "Template description",
  "category": "finance" | "tech" | "custom",
  "is_default": true | false,
  "template_config": {
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
      "headerStyle": "centered" | "left-aligned" | "two-column",
      "sectionOrder": ["Education", "Experience", "Skills"],
      "showSummary": true | false,
      "showSkills": true | false,
      "skillsFormat": "list" | "categories" | "inline"
    },
    "formatting": {
      "emphasisStyle": "bold" | "italic" | "underline",
      "dateFormat": "MM/YYYY" | "MMM YYYY" | etc,
      "bulletStyle": "bullet" | "dash" | "none"
    }
  }
}
```

## Adding New Templates

1. Create a new JSON file in this directory (e.g., `my-custom-template.json`)
2. Follow the format above
3. Run `npm run load-templates` to upload it
4. The template will be available in the dashboard immediately

## Notes

- Template IDs must be unique
- The script uses `upsert`, so running it multiple times will update existing templates
- Templates uploaded via the dashboard UI are stored in the database, not in these files
- These files are for pre-loading templates into the database

