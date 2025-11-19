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

  latex += `\\end{document}
`;

  return new Response(latex, {
    headers: {
      "Content-Type": "application/x-latex",
      "Content-Disposition": `attachment; filename="${(data.title || "resume").replace(/[^a-z0-9]/gi, "_")}.tex"`,
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

