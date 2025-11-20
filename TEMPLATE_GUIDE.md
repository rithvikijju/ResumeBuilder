# How to Create Professional Resume Templates

Based on the Jake Ryan resume example, here's how to create templates that will produce professional, properly formatted resumes.

## Template Structure

A template JSON file should have this structure:

```json
{
  "id": "template-id",
  "name": "Template Name",
  "description": "Description of the template",
  "category": "tech" | "finance" | "custom",
  "is_default": false,
  "template_config": {
    "structure": "structured",
    "style": {
      "fontFamily": "Calibri, Arial, sans-serif",
      "fontSize": "11pt",
      "lineHeight": "1.3",
      "spacing": "compact",
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
      "sectionOrder": ["Education", "Experience", "Projects", "Technical Skills"],
      "showSummary": false,
      "showSkills": true,
      "skillsFormat": "categories"
    },
    "formatting": {
      "emphasisStyle": "bold",
      "dateFormat": "MMM YYYY",
      "bulletStyle": "bullet"
    }
  }
}
```

## Key Formatting Rules (Based on Jake Ryan Resume)

1. **Header Format:**
   - Name: Large, bold, small caps, centered
   - Contact: Single line with `|` separators
   - Format: `Phone | Email | LinkedIn | GitHub`

2. **Section Headers:**
   - Uppercase, bold, with underline rule
   - Compact spacing (vspace -4pt)

3. **Experience/Education Format:**
   - Two-column layout: Left = Title/Institution, Right = Dates
   - Italic for organization/location
   - Bullets with compact spacing

4. **Projects Format:**
   - Title with tech stack: `Project Name | Tech Stack`
   - Dates on the right
   - Bullets below

5. **Skills Format:**
   - Categories: `Languages:`, `Frameworks:`, `Tools:`
   - Inline with separators

## Steps to Create a Template

1. **Create a JSON file** in `templates/` directory
2. **Use `structure: "structured"`** for professional formatting
3. **Set `headerStyle: "centered"`** for centered header
4. **Set `dateFormat: "MMM YYYY"`** for dates like "Aug. 2018"
5. **Set `spacing: "compact"`** for tight spacing
6. **Run `npm run load-templates`** to load into database

## Example: CS Template Matching Jake Ryan Format

```json
{
  "id": "cs-professional",
  "name": "Computer Science (Professional)",
  "description": "Professional tech resume matching industry standard LaTeX formatting",
  "category": "tech",
  "is_default": true,
  "template_config": {
    "structure": "structured",
    "style": {
      "fontFamily": "Calibri, Arial, sans-serif",
      "fontSize": "11pt",
      "lineHeight": "1.15",
      "spacing": "compact",
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
      "sectionOrder": ["Education", "Experience", "Projects", "Technical Skills"],
      "showSummary": false,
      "showSkills": true,
      "skillsFormat": "categories"
    },
    "formatting": {
      "emphasisStyle": "bold",
      "dateFormat": "MMM YYYY",
      "bulletStyle": "bullet"
    }
  }
}
```

## Export Routes

The export routes (`export-pdf/route.ts` and `export-latex/route.ts`) will automatically:
- Use the template's styling
- Format sections according to the template
- Apply proper spacing and typography
- Match the LaTeX formatting shown in examples

## Testing

1. Create/edit template JSON file
2. Run `npm run load-templates`
3. Generate a resume with that template
4. Export as PDF or LaTeX
5. Verify formatting matches expectations

