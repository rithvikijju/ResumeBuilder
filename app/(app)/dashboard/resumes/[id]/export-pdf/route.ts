import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResumeSchema } from "@/lib/resume/schema";
import { getTemplateById } from "@/lib/resume/templates";
import jsPDF from "jspdf";

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

  // Create PDF with template settings
  const doc = new jsPDF({
    unit: "in",
    format: "letter",
  });
  
  let yPos = 0.5; // Start at 0.5 inches from top
  const pageWidth = 8.5;
  const pageHeight = 11;
  const margin = 0.5;
  const contentWidth = pageWidth - 2 * margin;
  const maxY = pageHeight - margin; // One page limit
  
  // Set template font (approximate mapping)
  const fontMap: Record<string, string> = {
    "Times New Roman, serif": "times",
    "Arial, sans-serif": "helvetica",
    "Calibri, Arial, sans-serif": "helvetica",
  };
  const pdfFont = fontMap[template.style.fontFamily] || "helvetica";
  
  // Parse font size (remove 'pt')
  const fontSize = parseFloat(template.style.fontSize.replace("pt", "")) || 11;
  const lineHeight = parseFloat(template.style.lineHeight) * (fontSize / 72); // Convert to inches

  // Helper to add text with word wrap
  const addText = (text: string, size: number, isBold = false, x = margin, color?: string) => {
    if (yPos > maxY) return 0; // One page limit
    
    doc.setFontSize(size);
    doc.setFont(pdfFont, isBold ? "bold" : "normal");
    if (color) {
      const rgb = hexToRgb(color);
      if (rgb) doc.setTextColor(rgb.r, rgb.g, rgb.b);
    }
    const lines = doc.splitTextToSize(text, contentWidth);
    const spaceNeeded = lines.length * lineHeight;
    
    if (yPos + spaceNeeded > maxY) {
      // Truncate if it would exceed page
      const linesThatFit = Math.floor((maxY - yPos) / lineHeight);
      if (linesThatFit > 0) {
        doc.text(lines.slice(0, linesThatFit), x, yPos);
        yPos = maxY;
        return linesThatFit;
      }
      return 0;
    }
    
    doc.text(lines, x, yPos);
    yPos += spaceNeeded;
    return lines.length;
  };

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Title (if header is centered)
  if (template.layout.headerStyle === "centered") {
    doc.setFontSize(fontSize + 4);
    doc.setFont(pdfFont, "bold");
    const titleText = data.title || "Resume";
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);
    yPos += lineHeight * 1.5;
  } else {
    addText(data.title || "Resume", fontSize + 2, true, margin, template.style.colors.primary);
    yPos += lineHeight * 0.5;
  }

  // Check if resume is structured format
  const isStructured = "header" in resume || "experience" in resume || "education" in resume;

  if (isStructured) {
    // Handle structured resume format
    const structuredResume = resume as Extract<typeof resume, { header?: unknown }>;
    
    // Header info (if available)
    if (structuredResume.header) {
      const header = structuredResume.header;
      if (header.name) {
        doc.setFontSize(fontSize + 4);
        doc.setFont(pdfFont, "bold");
        const nameWidth = doc.getTextWidth(header.name);
        if (template.layout.headerStyle === "centered") {
          doc.text(header.name, (pageWidth - nameWidth) / 2, yPos);
        } else {
          doc.text(header.name, margin, yPos);
        }
        yPos += lineHeight * 1.5;
      }
      if (header.email || header.phone) {
        const contactInfo = [header.email, header.phone].filter(Boolean).join(" | ");
        addText(contactInfo, fontSize - 1, false, template.layout.headerStyle === "centered" ? (pageWidth - doc.getTextWidth(contactInfo)) / 2 : margin);
        yPos += lineHeight * 0.5;
      }
    }

    // Education
    if (structuredResume.education && structuredResume.education.length > 0) {
      if (yPos > maxY - lineHeight * 2) return;
      addText("EDUCATION", fontSize + 1, true, margin, template.style.colors.primary);
      yPos += lineHeight * 0.3;
      
      structuredResume.education.forEach((edu) => {
        if (yPos > maxY - lineHeight) return;
        const eduText = `${edu.degree} - ${edu.institution}${edu.location ? `, ${edu.location}` : ""}`;
        addText(eduText, fontSize, true, margin);
        yPos += lineHeight * 0.1;
        if (edu.start_date || edu.end_date) {
          addText(`${edu.start_date || ""} - ${edu.end_date || "Present"}`, fontSize - 1, false, margin + 0.1);
          yPos += lineHeight * 0.2;
        }
      });
      yPos += lineHeight * 0.3;
    }

    // Experience
    if (structuredResume.experience && structuredResume.experience.length > 0) {
      if (yPos > maxY - lineHeight * 2) return;
      addText("EXPERIENCE", fontSize + 1, true, margin, template.style.colors.primary);
      yPos += lineHeight * 0.3;
      
      structuredResume.experience.forEach((exp) => {
        if (yPos > maxY - lineHeight) return;
        const expTitle = `${exp.title} | ${exp.organization}${exp.location ? `, ${exp.location}` : ""}`;
        addText(expTitle, fontSize, true, margin);
        yPos += lineHeight * 0.1;
        if (exp.start_date || exp.end_date) {
          addText(`${exp.start_date || ""} - ${exp.end_date || "Present"}`, fontSize - 1, false, margin + 0.1);
          yPos += lineHeight * 0.2;
        }
        exp.bullets.forEach((bullet) => {
          if (yPos > maxY - lineHeight) return;
          addText(`• ${bullet}`, fontSize, false, margin + 0.1);
          yPos += lineHeight * 0.2;
        });
        yPos += lineHeight * 0.1;
      });
      yPos += lineHeight * 0.3;
    }

    // Projects
    if (structuredResume.projects && structuredResume.projects.length > 0) {
      if (yPos > maxY - lineHeight * 2) return;
      addText("PROJECTS", fontSize + 1, true, margin, template.style.colors.primary);
      yPos += lineHeight * 0.3;
      
      structuredResume.projects.forEach((project) => {
        if (yPos > maxY - lineHeight) return;
        const projTitle = project.name + (project.tech_stack && project.tech_stack.length > 0 ? ` (${project.tech_stack.join(", ")})` : "");
        addText(projTitle, fontSize, true, margin);
        yPos += lineHeight * 0.1;
        if (project.start_date || project.end_date) {
          addText(`${project.start_date || ""} - ${project.end_date || "Present"}`, fontSize - 1, false, margin + 0.1);
          yPos += lineHeight * 0.2;
        }
        project.bullets.forEach((bullet) => {
          if (yPos > maxY - lineHeight) return;
          addText(`• ${bullet}`, fontSize, false, margin + 0.1);
          yPos += lineHeight * 0.2;
        });
        yPos += lineHeight * 0.1;
      });
      yPos += lineHeight * 0.3;
    }

    // Technical Skills
    if (template.layout.showSkills && structuredResume.technical_skills && yPos < maxY - lineHeight * 2) {
      addText("TECHNICAL SKILLS", fontSize + 1, true, margin, template.style.colors.primary);
      yPos += lineHeight * 0.3;
      
      const allSkills: string[] = [];
      Object.values(structuredResume.technical_skills).forEach((skillArray) => {
        allSkills.push(...skillArray);
      });
      addText(allSkills.join(" • "), fontSize, false, margin);
    }
  } else {
    // Handle standard resume format
    // Summary (if template shows it)
    if (template.layout.showSummary && resume.summary && resume.summary.length > 0) {
      const sectionTitle = template.category === "finance" ? "PROFESSIONAL SUMMARY" : "Professional Summary";
      addText(sectionTitle, fontSize + 1, true, margin, template.style.colors.primary);
      yPos += lineHeight * 0.3;
      
      resume.summary.slice(0, 3).forEach((item) => { // Limit to 3 for one page
        const bullet = template.formatting.bulletStyle === "bullet" ? "•" : template.formatting.bulletStyle === "dash" ? "—" : "";
        addText(`${bullet} ${item.sentence}`, fontSize, false, margin + (bullet ? 0.1 : 0));
        yPos += lineHeight * 0.2;
      });
      yPos += lineHeight * 0.5;
    }

    // Sections in template order
    if ("sections" in resume && resume.sections) {
      const sectionsToShow = template.layout.sectionOrder
        .map((title) => resume.sections.find((s) => s.title === title))
        .filter(Boolean) as typeof resume.sections;

      // Add any sections not in template order
      const remainingSections = resume.sections.filter(
        (s) => !template.layout.sectionOrder.includes(s.title)
      );
      sectionsToShow.push(...remainingSections);

      sectionsToShow.forEach((section) => {
        if (yPos > maxY - lineHeight * 2) return; // Skip if no space
        
        const sectionTitle = template.category === "finance" ? section.title.toUpperCase() : section.title;
        addText(sectionTitle, fontSize + 1, true, margin, template.style.colors.primary);
        yPos += lineHeight * 0.3;

        section.items.forEach((item) => {
          if (yPos > maxY - lineHeight) return; // Skip if no space
          
          if (item.heading) {
            addText(item.heading, fontSize, true, margin);
            yPos += lineHeight * 0.2;
          }
          
          const bullet = template.formatting.bulletStyle === "bullet" ? "•" : template.formatting.bulletStyle === "dash" ? "—" : "";
          addText(`${bullet} ${item.content}`, fontSize, false, margin + (bullet ? 0.1 : 0));
          yPos += lineHeight * 0.2;

          if (item.metrics && item.metrics.length > 0) {
            const metricsText = item.metrics
              .map((m) => `${m.value} ${m.label}`)
              .join(" • ");
            addText(metricsText, fontSize - 1, false, margin + 0.2);
            yPos += lineHeight * 0.2;
          }
          yPos += lineHeight * 0.1;
        });
        yPos += lineHeight * 0.3;
      });
    }

    // Skills (if template shows it)
    if (template.layout.showSkills && resume.skills && yPos < maxY - lineHeight * 2) {
      addText("SKILLS", fontSize + 1, true, margin, template.style.colors.primary);
      yPos += lineHeight * 0.3;

      if (template.layout.skillsFormat === "inline") {
        const allSkills = [
          ...(resume.skills.primary || []),
          ...(resume.skills.secondary || []),
          ...(resume.skills.tools || []),
        ];
        addText(allSkills.join(" • "), fontSize, false, margin);
      } else {
        if (resume.skills.primary && resume.skills.primary.length > 0) {
          addText(`Primary: ${resume.skills.primary.join(", ")}`, fontSize, false, margin);
          yPos += lineHeight * 0.2;
        }
        if (resume.skills.secondary && resume.skills.secondary.length > 0) {
          addText(`Secondary: ${resume.skills.secondary.join(", ")}`, fontSize, false, margin);
          yPos += lineHeight * 0.2;
        }
        if (resume.skills.tools && resume.skills.tools.length > 0) {
          addText(`Tools: ${resume.skills.tools.join(", ")}`, fontSize, false, margin);
        }
      }
    }
  }

  // Generate PDF buffer
  const pdfArrayBuffer = doc.output("arraybuffer");
  const pdfBuffer = Buffer.from(pdfArrayBuffer);

  const safeFilename = (data.title || "resume").replace(/[^a-z0-9]/gi, "_");
  const originalFilename = data.title || "resume";

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename}.pdf"; filename*=UTF-8''${encodeURIComponent(originalFilename)}.pdf`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}

