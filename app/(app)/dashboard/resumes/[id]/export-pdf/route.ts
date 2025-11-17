import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResumeSchema } from "@/lib/resume/schema";
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

  // Create PDF
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 7;
  const sectionSpacing = 10;

  // Helper to add text with word wrap
  const addText = (text: string, fontSize: number, isBold = false, x = margin) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, x, yPos);
    yPos += lines.length * lineHeight;
    return lines.length;
  };

  // Helper to check if we need a new page
  const checkNewPage = () => {
    if (yPos > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Title
  addText(data.title || "Resume", 18, true);
  yPos += 5;

  // Summary
  if (resume.summary && resume.summary.length > 0) {
    checkNewPage();
    addText("PROFESSIONAL SUMMARY", 12, true);
    yPos += 3;
    resume.summary.forEach((item) => {
      checkNewPage();
      addText(`• ${item.sentence}`, 10);
      yPos += 2;
    });
    yPos += sectionSpacing;
  }

  // Sections
  resume.sections.forEach((section) => {
    checkNewPage();
    addText(section.title.toUpperCase(), 12, true);
    yPos += 5;

    section.items.forEach((item) => {
      checkNewPage();
      if (item.heading) {
        addText(item.heading, 11, true);
        yPos += 2;
      }
      addText(item.content, 10);
      yPos += 2;

      if (item.metrics && item.metrics.length > 0) {
        const metricsText = item.metrics
          .map((m) => `${m.value} ${m.label}`)
          .join(" • ");
        addText(metricsText, 9);
        yPos += 2;
      }
      yPos += 3;
    });
    yPos += sectionSpacing;
  });

  // Skills
  if (resume.skills) {
    checkNewPage();
    addText("SKILLS", 12, true);
    yPos += 5;

    if (resume.skills.primary && resume.skills.primary.length > 0) {
      addText(`Primary: ${resume.skills.primary.join(", ")}`, 10);
      yPos += 3;
    }
    if (resume.skills.secondary && resume.skills.secondary.length > 0) {
      addText(`Secondary: ${resume.skills.secondary.join(", ")}`, 10);
      yPos += 3;
    }
    if (resume.skills.tools && resume.skills.tools.length > 0) {
      addText(`Tools: ${resume.skills.tools.join(", ")}`, 10);
      yPos += 3;
    }
  }

  // Generate PDF buffer
  const pdfBlob = doc.output("blob");
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${(data.title || "resume").replace(/[^a-z0-9]/gi, "_")}.pdf"`,
    },
  });
}

