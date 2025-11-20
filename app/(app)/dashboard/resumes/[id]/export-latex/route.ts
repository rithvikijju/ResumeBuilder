import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResumeSchema } from "@/lib/resume/schema";
import { getTemplateById } from "@/lib/resume/templates";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return new Response("Resume not found", { status: 404 });
  }

  const validation = ResumeSchema.safeParse(data.structured_content);
  if (!validation.success) {
    return new Response("Invalid resume data", { status: 400 });
  }

  const resume = validation.data;
  const templateId = (data as any).template_id || "cs";
  const template = (await getTemplateById(templateId)) || (await getTemplateById("cs"))!;

  // Map font families to LaTeX fonts
  const fontMap: Record<string, string> = {
    "Times New Roman, serif": "\\usepackage{times}",
    "Arial, sans-serif": "\\usepackage{helvet}\n\\renewcommand{\\familydefault}{\\sfdefault}",
    "Calibri, Arial, sans-serif": "\\usepackage{helvet}\n\\renewcommand{\\familydefault}{\\sfdefault}",
  };
  const latexFont = fontMap[template.style.fontFamily] || "";

  // Parse font size
  const fontSize = template.style.fontSize.replace("pt", "") || "11";

  // Build LaTeX document
  let latex = `\\documentclass[${fontSize}pt,letterpaper]{article}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{enumitem}
\\usepackage{url}
\\setlist[itemize]{leftmargin=*,nosep}
\\pagestyle{empty}
${latexFont}

\\begin{document}

`;

  // Title/Header
  if (template.layout.headerStyle === "centered") {
    latex += `\\begin{center}
\\textbf{\\Large ${escapeLaTeX(data.title || "Resume")}}
\\end{center}
\\vspace{0.2cm}

`;
  } else {
    latex += `\\textbf{\\Large ${escapeLaTeX(data.title || "Resume")}}
\\vspace{0.2cm}

`;
  }

  // Check if resume is structured format
  const isStructured = "header" in resume || "experience" in resume || "education" in resume;

  if (isStructured) {
    // Handle structured resume format
    const structuredResume = resume as Extract<typeof resume, { header?: unknown }>;
    
    // Header info
    if (structuredResume.header) {
      const header = structuredResume.header;
      if (header.name) {
        if (template.layout.headerStyle === "centered") {
          latex += `\\begin{center}\n\\textbf{\\Large ${escapeLaTeX(header.name)}}\n\\end{center}\n`;
        } else {
          latex += `\\textbf{\\Large ${escapeLaTeX(header.name)}}\n`;
        }
      }
      if (header.email || header.phone) {
        const contactInfo = [header.email, header.phone].filter(Boolean).join(" $|$ ");
        latex += `${escapeLaTeX(contactInfo)}\n`;
      }
      if (header.links && header.links.length > 0) {
        const links = header.links.map((link) => `${escapeLaTeX(link.label)}: \\url{${escapeLaTeX(link.url)}}`).join(" $|$ ");
        latex += `${links}\n`;
      }
      latex += `\\vspace{0.2cm}\n\n`;
    }

    // Education
    if (structuredResume.education && structuredResume.education.length > 0) {
      latex += `\\textbf{EDUCATION}\n\\begin{itemize}\n`;
      structuredResume.education.forEach((edu) => {
        const eduText = `${escapeLaTeX(edu.degree)} - ${escapeLaTeX(edu.institution)}${edu.location ? `, ${escapeLaTeX(edu.location)}` : ""}`;
        latex += `  \\item[\\textbf{${eduText}}]`;
        if (edu.start_date || edu.end_date) {
          latex += ` ${escapeLaTeX(edu.start_date || "")} - ${escapeLaTeX(edu.end_date || "Present")}`;
        }
        latex += "\n";
      });
      latex += `\\end{itemize}\n\\vspace{0.2cm}\n\n`;
    }

    // Experience
    if (structuredResume.experience && structuredResume.experience.length > 0) {
      latex += `\\textbf{EXPERIENCE}\n\\begin{itemize}\n`;
      structuredResume.experience.forEach((exp) => {
        const expTitle = `${escapeLaTeX(exp.title)} $|$ ${escapeLaTeX(exp.organization)}${exp.location ? `, ${escapeLaTeX(exp.location)}` : ""}`;
        latex += `  \\item[\\textbf{${expTitle}}]`;
        if (exp.start_date || exp.end_date) {
          latex += ` ${escapeLaTeX(exp.start_date || "")} - ${escapeLaTeX(exp.end_date || "Present")}`;
        }
        latex += "\n    \\begin{itemize}\n";
        exp.bullets.forEach((bullet) => {
          latex += `      \\item ${escapeLaTeX(bullet)}\n`;
        });
        latex += `    \\end{itemize}\n`;
      });
      latex += `\\end{itemize}\n\\vspace{0.2cm}\n\n`;
    }

    // Projects
    if (structuredResume.projects && structuredResume.projects.length > 0) {
      latex += `\\textbf{PROJECTS}\n\\begin{itemize}\n`;
      structuredResume.projects.forEach((project) => {
        const projTitle = escapeLaTeX(project.name) + (project.tech_stack && project.tech_stack.length > 0 ? ` (${escapeLaTeX(project.tech_stack.join(", "))})` : "");
        latex += `  \\item[\\textbf{${projTitle}}]`;
        if (project.start_date || project.end_date) {
          latex += ` ${escapeLaTeX(project.start_date || "")} - ${escapeLaTeX(project.end_date || "Present")}`;
        }
        latex += "\n    \\begin{itemize}\n";
        project.bullets.forEach((bullet) => {
          latex += `      \\item ${escapeLaTeX(bullet)}\n`;
        });
        latex += `    \\end{itemize}\n`;
      });
      latex += `\\end{itemize}\n\\vspace{0.2cm}\n\n`;
    }

    // Technical Skills
    if (template.layout.showSkills && structuredResume.technical_skills) {
      latex += `\\textbf{TECHNICAL SKILLS}\n`;
      const allSkills: string[] = [];
      Object.values(structuredResume.technical_skills).forEach((skillArray) => {
        allSkills.push(...skillArray);
      });
      latex += `${escapeLaTeX(allSkills.join(" $\\bullet$ "))}\n`;
    }
  } else {
    // Handle standard resume format
    // Summary
    if (template.layout.showSummary && resume.summary && resume.summary.length > 0) {
      const sectionTitle = template.category === "finance" ? "\\textbf{PROFESSIONAL SUMMARY}" : "\\textbf{Professional Summary}";
      latex += `${sectionTitle}
\\begin{itemize}
`;
      resume.summary.slice(0, 3).forEach((item) => {
        latex += `  \\item ${escapeLaTeX(item.sentence)}\n`;
      });
      latex += `\\end{itemize}
\\vspace{0.2cm}

`;
    }

    // Sections in template order
    if ("sections" in resume && resume.sections) {
      const sectionsToShow = template.layout.sectionOrder
        .map((title) => resume.sections.find((s) => s.title === title))
        .filter(Boolean) as typeof resume.sections;

      const remainingSections = resume.sections.filter(
        (s) => !template.layout.sectionOrder.includes(s.title)
      );
      sectionsToShow.push(...remainingSections);

      sectionsToShow.forEach((section) => {
        const sectionTitle = template.category === "finance" 
          ? section.title.toUpperCase() 
          : section.title;
        latex += `\\textbf{${escapeLaTeX(sectionTitle)}}
\\begin{itemize}
`;

        section.items.forEach((item) => {
          if (item.heading) {
            latex += `  \\item[\\textbf{${escapeLaTeX(item.heading)}}] ${escapeLaTeX(item.content)}`;
          } else {
            const bullet = template.formatting.bulletStyle === "bullet" 
              ? "\\item" 
              : template.formatting.bulletStyle === "dash" 
              ? "\\item[---]" 
              : "\\item[]";
            latex += `  ${bullet} ${escapeLaTeX(item.content)}`;
          }
          
          if (item.metrics && item.metrics.length > 0) {
            const metricsText = item.metrics
              .map((m) => `${m.value} ${m.label}`)
              .join(" $\\bullet$ ");
            latex += ` \\textit{(${escapeLaTeX(metricsText)})}`;
          }
          latex += "\n";
        });

        latex += `\\end{itemize}
\\vspace{0.2cm}

`;
      });
    }

    // Skills
    if (template.layout.showSkills && resume.skills) {
      latex += `\\textbf{SKILLS}
`;

      if (template.layout.skillsFormat === "inline") {
        const allSkills = [
          ...(resume.skills.primary || []),
          ...(resume.skills.secondary || []),
          ...(resume.skills.tools || []),
        ];
        latex += `${escapeLaTeX(allSkills.join(" $\\bullet$ "))}\n`;
      } else {
        if (resume.skills.primary && resume.skills.primary.length > 0) {
          latex += `\\textbf{Primary:} ${escapeLaTeX(resume.skills.primary.join(", "))}\\\\\n`;
        }
        if (resume.skills.secondary && resume.skills.secondary.length > 0) {
          latex += `\\textbf{Secondary:} ${escapeLaTeX(resume.skills.secondary.join(", "))}\\\\\n`;
        }
        if (resume.skills.tools && resume.skills.tools.length > 0) {
          latex += `\\textbf{Tools:} ${escapeLaTeX(resume.skills.tools.join(", "))}\n`;
        }
      }
    }
  }

  latex += `\\end{document}
`;

  const filename = `${(data.title || "resume").replace(/[^a-z0-9]/gi, "_")}.tex`;

  return new Response(latex, {
    headers: {
      "Content-Type": "application/x-latex",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(data.title || "resume")}.tex`,
      "Content-Length": Buffer.byteLength(latex, "utf8").toString(),
    },
  });
}

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

