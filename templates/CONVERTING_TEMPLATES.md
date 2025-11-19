# Converting Filled-Out Resumes to Templates

When you have a filled-out resume JSON (like the CS template example), you need to convert it into a template configuration. Here's how:

## Step 1: Extract the Structure

Your filled-out resume has actual data:
```json
{
  "header": {
    "name": "Jake Ryan",  // ← This is sample data
    "phone": "123-456-7890",
    ...
  }
}
```

## Step 2: Create Template Config

The template config defines:
1. **Structure format** - What fields to include
2. **Styling** - Fonts, colors, spacing
3. **Layout** - Section order, header style
4. **Formatting** - Date formats, bullet styles

## Step 3: Template JSON Format

Create a JSON file in `templates/` with this structure:

```json
{
  "id": "your-template-id",
  "name": "Your Template Name",
  "description": "Description of the template",
  "category": "tech" | "finance" | "custom",
  "is_default": false,
  "template_config": {
    "structure": "structured",  // ← Use "structured" for your format
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
      "sectionOrder": ["education", "experience", "projects", "technical_skills"],
      "showSummary": false,
      "showSkills": true,
      "skillsFormat": "categories"
    },
    "formatting": {
      "emphasisStyle": "bold",
      "dateFormat": "MMM YYYY",
      "bulletStyle": "bullet"
    },
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
  }
}
```

## Step 4: What Gets Replaced

When a resume is generated:
- **Template config** stays the same (defines structure/styling)
- **Resume data** comes from user's experiences, education, projects, skills
- The AI will generate data in the structure format you defined

## Example: Your CS Template

Your filled-out resume has:
- `header` with name, phone, email, links
- `education` array with institution, location, degree, dates
- `experience` array with title, organization, location, dates, bullets
- `projects` array with name, tech_stack, dates, bullets
- `technical_skills` object with categories

The template config (`cs-structured.json`) defines:
- How to style these sections
- What fields to show
- Date formats
- Section order

When generating a resume:
1. User selects this template
2. AI generates resume data in this structure
3. Renderer displays it using the template's styling

## Quick Conversion Checklist

- [ ] Remove all sample data (names, companies, etc.)
- [ ] Keep the structure (header, education, experience, etc.)
- [ ] Define styling (fonts, colors)
- [ ] Define layout (section order, header style)
- [ ] Define formatting (date formats, bullets)
- [ ] Set `structure: "structured"` in template_config
- [ ] Add `structureFormat` section to define what fields to show

## Loading Your Template

1. Save your template JSON file in `templates/` directory
2. Run `npm run load-templates`
3. Template will be available in the dashboard

