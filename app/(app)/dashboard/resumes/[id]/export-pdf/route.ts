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

  // Check if resume is structured format
  const isStructured = "header" in resume || "experience" in resume || "education" in resume;

  if (isStructured) {
    // Handle structured resume format
    const structuredResume = resume as Extract<typeof resume, { header?: unknown }>;
    
    // Header info - Professional formatting matching LaTeX style
    if (structuredResume.header) {
      const header = structuredResume.header;
      if (header.name) {
        // Large, bold, centered name (matching \Huge \scshape in LaTeX)
        doc.setFontSize(20); // Large size
        doc.setFont(pdfFont, "bold");
        const nameText = header.name.toUpperCase(); // Small caps effect
        const nameWidth = doc.getTextWidth(nameText);
        doc.text(nameText, (pageWidth - nameWidth) / 2, yPos); // Centered
        yPos += 0.15; // Small space after name
      }
      if (header.email || header.phone || (header.links && header.links.length > 0)) {
        // Contact info on one line with separators
        doc.setFontSize(fontSize - 1); // Small font
        doc.setFont(pdfFont, "normal");
        const contactParts: string[] = [];
        if (header.phone) contactParts.push(header.phone);
        if (header.email) contactParts.push(header.email);
        if (header.links && header.links.length > 0) {
          header.links.forEach((link) => {
            const url = link.url.replace(/^https?:\/\//, "");
            contactParts.push(url);
          });
        }
        const contactText = contactParts.join(" | ");
        const contactWidth = doc.getTextWidth(contactText);
        doc.text(contactText, (pageWidth - contactWidth) / 2, yPos); // Centered
        yPos += 0.2; // Space after contact
      }
      yPos += 0.1; // Extra space before sections
    }

    // Education - Professional two-column format
    if (structuredResume.education && structuredResume.education.length > 0) {
      if (yPos > maxY - lineHeight * 2) return;
      // Section header with underline effect
      doc.setFontSize(fontSize + 1);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("EDUCATION", margin, yPos);
      // Draw underline
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 0.02, pageWidth - margin, yPos + 0.02);
      yPos += 0.12; // Compact spacing
      
      structuredResume.education.forEach((edu) => {
        if (yPos > maxY - lineHeight * 1.5) return;
        // Two-column layout: Institution/Location on left, Dates on right
        doc.setFontSize(fontSize);
        doc.setFont(pdfFont, "bold");
        const institutionText = `${edu.institution}${edu.location ? `, ${edu.location}` : ""}`;
        doc.text(institutionText, margin, yPos);
        
        const dateText = `${edu.start_date || ""} -- ${edu.end_date || "Present"}`;
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - margin - dateWidth, yPos);
        yPos += 0.08; // Tight spacing
        
        // Degree on second line, italic
        doc.setFont(pdfFont, "normal");
        doc.setFontSize(fontSize);
        doc.text(edu.degree, margin, yPos);
        yPos += 0.12; // Space between entries
      });
      yPos += 0.05; // Space after section
    }

    // Experience - Professional two-column format with bullets
    if (structuredResume.experience && structuredResume.experience.length > 0) {
      if (yPos > maxY - lineHeight * 2) return;
      // Section header with underline
      doc.setFontSize(fontSize + 1);
      doc.setFont(pdfFont, "bold");
      doc.text("EXPERIENCE", margin, yPos);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 0.02, pageWidth - margin, yPos + 0.02);
      yPos += 0.12;
      
      structuredResume.experience.forEach((exp) => {
        if (yPos > maxY - lineHeight * 1.5) return;
        // Two-column: Title on left, Dates on right
        doc.setFontSize(fontSize);
        doc.setFont(pdfFont, "bold");
        doc.text(exp.title, margin, yPos);
        const dateText = `${exp.start_date || ""} -- ${exp.end_date || "Present"}`;
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - margin - dateWidth, yPos);
        yPos += 0.08;
        
        // Organization/Location on second line, italic
        doc.setFont(pdfFont, "italic");
        doc.setFontSize(fontSize - 1);
        const orgText = `${exp.organization}${exp.location ? `, ${exp.location}` : ""}`;
        doc.text(orgText, margin, yPos);
        yPos += 0.1;
        
        // Bullets with compact spacing
        doc.setFont(pdfFont, "normal");
        doc.setFontSize(fontSize);
        exp.bullets.forEach((bullet) => {
          if (yPos > maxY - lineHeight) return;
          const bulletText = `• ${bullet}`;
          const lines = doc.splitTextToSize(bulletText, contentWidth - 0.15);
          doc.text(lines, margin + 0.15, yPos);
          yPos += lines.length * 0.08; // Very tight spacing
        });
        yPos += 0.05; // Space between experiences
      });
      yPos += 0.05;
    }

    // Projects - Professional format with tech stack
    if (structuredResume.projects && structuredResume.projects.length > 0) {
      if (yPos > maxY - lineHeight * 2) return;
      // Section header with underline
      doc.setFontSize(fontSize + 1);
      doc.setFont(pdfFont, "bold");
      doc.text("PROJECTS", margin, yPos);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 0.02, pageWidth - margin, yPos + 0.02);
      yPos += 0.12;
      
      structuredResume.projects.forEach((project) => {
        if (yPos > maxY - lineHeight * 1.5) return;
        // Two-column: Project Name | Tech Stack on left, Dates on right
        doc.setFontSize(fontSize);
        doc.setFont(pdfFont, "bold");
        const projName = project.name;
        const techStack = project.tech_stack && project.tech_stack.length > 0 
          ? ` | ${project.tech_stack.join(", ")}`
          : "";
        const projTitle = `${projName}${techStack}`;
        doc.text(projTitle, margin, yPos);
        const dateText = `${project.start_date || ""} -- ${project.end_date || "Present"}`;
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - margin - dateWidth, yPos);
        yPos += 0.1;
        doc.setFont(pdfFont, "normal");
        
        // Bullets with compact spacing
        project.bullets.forEach((bullet) => {
          if (yPos > maxY - lineHeight) return;
          const bulletText = `• ${bullet}`;
          const lines = doc.splitTextToSize(bulletText, contentWidth - 0.15);
          doc.text(lines, margin + 0.15, yPos);
          yPos += lines.length * 0.08; // Very tight spacing
        });
        yPos += 0.05; // Space between projects
      });
      yPos += 0.05;
    }

    // Technical Skills - Professional format with categories
    if (template.layout.showSkills && structuredResume.technical_skills && yPos < maxY - lineHeight * 2) {
      // Section header with underline
      doc.setFontSize(fontSize + 1);
      doc.setFont(pdfFont, "bold");
      doc.text("TECHNICAL SKILLS", margin, yPos);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 0.02, pageWidth - margin, yPos + 0.02);
      yPos += 0.12;
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(fontSize);
      
      // Format as "Category: skill1, skill2, skill3"
      const skillLines: string[] = [];
      Object.entries(structuredResume.technical_skills).forEach(([category, skills]) => {
        if (skills && skills.length > 0) {
          skillLines.push(`\\textbf{${category}}: ${skills.join(", ")}`);
        }
      });
      
      skillLines.forEach((line) => {
        if (yPos > maxY - lineHeight) return;
        // Remove LaTeX commands for PDF (they're for LaTeX export)
        const cleanLine = line.replace(/\\textbf\{([^}]+)\}/g, "$1");
        const lines = doc.splitTextToSize(cleanLine, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 0.08; // Tight spacing
      });
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

