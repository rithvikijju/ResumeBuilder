import fs from "fs";
import path from "path";

export function getLatexTemplatePath(templateId: string): string {
  // Map template IDs to LaTeX template files
  const templateMap: Record<string, string> = {
    cs: "cs-professional.tex",
    "cs-professional": "cs-professional.tex",
    ib: "ib-professional.tex",
    quant: "quant-professional.tex",
  };

  const templateFile = templateMap[templateId] || "cs-professional.tex";
  return path.join(process.cwd(), "templates", "latex", templateFile);
}

export function loadLatexTemplate(templateId: string): string {
  try {
    const templatePath = getLatexTemplatePath(templateId);
    return fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    console.error(`Failed to load LaTeX template ${templateId}:`, error);
    // Fallback to default template
    const defaultPath = path.join(process.cwd(), "templates", "latex", "cs-professional.tex");
    if (fs.existsSync(defaultPath)) {
      return fs.readFileSync(defaultPath, "utf-8");
    }
    throw new Error(`Template file not found: ${templateId}`);
  }
}

export function fillLatexTemplate(
  template: string,
  data: {
    header?: {
      name?: string;
      email?: string;
      phone?: string;
      links?: Array<{ label: string; url: string }>;
    };
    education?: Array<{
      institution: string;
      location?: string;
      degree: string;
      start_date?: string;
      end_date?: string;
    }>;
    experience?: Array<{
      title: string;
      organization: string;
      location?: string;
      start_date?: string;
      end_date?: string;
      bullets: string[];
    }>;
    projects?: Array<{
      name: string;
      tech_stack?: string[];
      start_date?: string;
      end_date?: string;
      bullets: string[];
    }>;
    technical_skills?: Record<string, string[]>;
  }
): string {
  function escapeLaTeX(text: string): string {
    return text
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\$/g, "\\$")
      .replace(/\&/g, "\\&")
      .replace(/#/g, "\\#")
      .replace(/\^/g, "\\textasciicircum{}")
      .replace(/_/g, "\\_")
      .replace(/%/g, "\\%")
      .replace(/~/g, "\\textasciitilde{}");
  }

  let filled = template;

  // Fill header
  if (data.header) {
    const header = data.header;
    const name = header.name ? escapeLaTeX(header.name) : "";
    filled = filled.replace("{{HEADER_NAME}}", name);

    const contactParts: string[] = [];
    if (header.phone) contactParts.push(escapeLaTeX(header.phone));
    if (header.email) {
      contactParts.push(
        `\\href{mailto:${escapeLaTeX(header.email)}}{\\underline{${escapeLaTeX(header.email)}}}`
      );
    }
    if (header.links && header.links.length > 0) {
      header.links.forEach((link) => {
        const url = link.url.replace(/^https?:\/\//, "");
        contactParts.push(`\\href{${escapeLaTeX(link.url)}}{\\underline{${escapeLaTeX(url)}}}`);
      });
    }
    const contact = contactParts.join(" $|$ ");
    filled = filled.replace("{{HEADER_CONTACT}}", contact);
  } else {
    filled = filled.replace("{{HEADER_NAME}}", "");
    filled = filled.replace("{{HEADER_CONTACT}}", "");
  }

  // Fill education - matching exact format from Jake Ryan template
  if (data.education && data.education.length > 0) {
    const eduEntries = data.education
      .map((edu) => {
        const dateRange = `${escapeLaTeX(edu.start_date || "")} -- ${escapeLaTeX(edu.end_date || "Present")}`;
        return `    \\resumeSubheading\n      {${escapeLaTeX(edu.institution)}}{${escapeLaTeX(edu.location || "")}}\n      {${escapeLaTeX(edu.degree)}}{${dateRange}}`;
      })
      .join("\n");
    filled = filled.replace("{{EDUCATION_ENTRIES}}", eduEntries);
  } else {
    filled = filled.replace("{{EDUCATION_ENTRIES}}", "");
  }

  // Fill experience - matching exact format from Jake Ryan template
  if (data.experience && data.experience.length > 0) {
    const expEntries = data.experience
      .map((exp) => {
        const dateRange = `${escapeLaTeX(exp.start_date || "")} -- ${escapeLaTeX(exp.end_date || "Present")}`;
        const bullets = exp.bullets
          .map((bullet) => `        \\resumeItem{${escapeLaTeX(bullet)}}`)
          .join("\n");
        return `    \\resumeSubheading\n      {${escapeLaTeX(exp.title)}}{${dateRange}}\n      {${escapeLaTeX(exp.organization)}}{${escapeLaTeX(exp.location || "")}}\n      \\resumeItemListStart\n${bullets}\n      \\resumeItemListEnd`;
      })
      .join("\n\n");
    filled = filled.replace("{{EXPERIENCE_ENTRIES}}", expEntries);
  } else {
    filled = filled.replace("{{EXPERIENCE_ENTRIES}}", "");
  }

  // Fill projects - matching exact format from Jake Ryan template
  if (data.projects && data.projects.length > 0) {
    const projectEntries = data.projects
      .map((project) => {
        const dateRange = `${escapeLaTeX(project.start_date || "")} -- ${escapeLaTeX(project.end_date || "Present")}`;
        const techStack = project.tech_stack && project.tech_stack.length > 0
          ? `\\emph{${escapeLaTeX(project.tech_stack.join(", "))}}`
          : "";
        const projectTitle = techStack
          ? `\\textbf{${escapeLaTeX(project.name)}} $|$ ${techStack}`
          : `\\textbf{${escapeLaTeX(project.name)}}`;
        const bullets = project.bullets
          .map((bullet) => `            \\resumeItem{${escapeLaTeX(bullet)}}`)
          .join("\n");
        return `      \\resumeProjectHeading\n          {${projectTitle}}{${dateRange}}\n          \\resumeItemListStart\n${bullets}\n          \\resumeItemListEnd`;
      })
      .join("\n");
    filled = filled.replace("{{PROJECT_ENTRIES}}", projectEntries);
  } else {
    filled = filled.replace("{{PROJECT_ENTRIES}}", "");
  }

  // Fill skills
  if (data.technical_skills) {
    const skillCategories: string[] = [];
    Object.entries(data.technical_skills).forEach(([category, skills]) => {
      if (skills && skills.length > 0) {
        skillCategories.push(`     \\textbf{${escapeLaTeX(category)}}{: ${escapeLaTeX(skills.join(", "))}}`);
      }
    });
    const skillsText = skillCategories.join(" \\\\\n");
    filled = filled.replace("{{SKILLS_ENTRIES}}", skillsText);
  } else {
    filled = filled.replace("{{SKILLS_ENTRIES}}", "");
  }

  return filled;
}

