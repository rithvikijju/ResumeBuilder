# How to Convert Your Filled-Out Resume to a Template

You have a filled-out resume JSON with sample data (like "Jake Ryan", specific companies, etc.). Here's how to convert it into a template that the system can use.

## The Key Difference

**Your filled-out resume** = Structure + Sample Data
**Template** = Structure + Styling Configuration (no data)

## Step-by-Step Conversion

### 1. Identify the Structure

Your resume has this structure:
```json
{
  "header": { ... },
  "education": [ ... ],
  "experience": [ ... ],
  "projects": [ ... ],
  "technical_skills": { ... }
}
```

### 2. Create Template Config

Create a new JSON file (e.g., `my-template.json`) in the `templates/` directory:

```json
{
  "id": "my-template-id",
  "name": "My Template Name",
  "description": "Description here",
  "category": "tech",
  "is_default": false,
  "template_config": {
    "structure": "structured",
    "style": { ... },
    "layout": { ... },
    "formatting": { ... },
    "structureFormat": { ... }
  }
}
```

### 3. Fill in Template Config

#### A. Style Section
Define fonts, colors, spacing:
```json
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
}
```

#### B. Layout Section
Define section order and what to show:
```json
"layout": {
  "headerStyle": "left-aligned",
  "sectionOrder": ["education", "experience", "projects", "technical_skills"],
  "showSummary": false,
  "showSkills": true,
  "skillsFormat": "categories"
}
```

#### C. Formatting Section
Define date formats, bullets:
```json
"formatting": {
  "emphasisStyle": "bold",
  "dateFormat": "MMM YYYY",
  "bulletStyle": "bullet"
}
```

#### D. Structure Format Section
Define what fields to show in each section:
```json
"structureFormat": {
  "header": {
    "showName": true,
    "showPhone": true,
    "showEmail": true,
    "showLinks": true,
    "linkFormat": "label-url"
  },
  "education": {
    "showLocation": true,
    "showDates": true,
    "dateFormat": "MMM YYYY"
  },
  "experience": {
    "showLocation": true,
    "showDates": true,
    "dateFormat": "MMM YYYY",
    "showBullets": true
  },
  "projects": {
    "showTechStack": true,
    "showDates": true,
    "dateFormat": "MMM YYYY",
    "showBullets": true
  },
  "technical_skills": {
    "format": "categories",
    "showCategories": true
  }
}
```

### 4. What Gets Replaced

When a user generates a resume with your template:

- ✅ **Template config stays** - Defines structure and styling
- ✅ **User's data replaces sample data** - From their experiences, education, projects, skills
- ✅ **AI generates in your structure** - Outputs data matching your format

### 5. Example: Your CS Template

**Your filled-out resume:**
```json
{
  "header": {
    "name": "Jake Ryan",  // ← Sample data
    "phone": "123-456-7890",
    ...
  },
  "experience": [
    {
      "title": "Undergraduate Research Assistant",  // ← Sample data
      "organization": "Texas A&M University",
      ...
    }
  ]
}
```

**Template config (no data, just structure):**
```json
{
  "id": "cs-structured",
  "template_config": {
    "structure": "structured",
    "structureFormat": {
      "header": { "showName": true, ... },
      "experience": { "showLocation": true, ... }
    }
  }
}
```

**Generated resume (user's data in your structure):**
```json
{
  "header": {
    "name": "John Doe",  // ← User's actual name
    "phone": "555-1234",
    ...
  },
  "experience": [
    {
      "title": "Software Engineer",  // ← User's actual experience
      "organization": "Google",
      ...
    }
  ]
}
```

## Quick Checklist

- [ ] Remove all sample data (names, companies, specific experiences)
- [ ] Keep the structure (header, education, experience, projects, technical_skills)
- [ ] Set `"structure": "structured"` in template_config
- [ ] Define styling (fonts, colors)
- [ ] Define layout (section order)
- [ ] Define formatting (date formats, bullets)
- [ ] Add `structureFormat` section
- [ ] Save as `.json` in `templates/` directory
- [ ] Run `npm run load-templates`

## Loading Your Template

1. Save your template JSON in `templates/` directory
2. Run: `npm run load-templates`
3. Template appears in dashboard at `/dashboard/templates`
4. Users can select it when generating resumes

## See Example

Check `templates/cs-structured.json` for a complete example based on your format!

