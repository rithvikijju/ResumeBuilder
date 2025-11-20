import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResumeSchema } from "@/lib/resume/schema";
import { loadLatexTemplate, fillLatexTemplate } from "@/lib/resume/latex-templates";

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

  // Check if resume is structured format
  const isStructured = "header" in resume || "experience" in resume || "education" in resume;

  if (!isStructured) {
    return new Response("Only structured resume format is supported for PDF export", { status: 400 });
  }

  const structuredResume = resume as Extract<typeof resume, { header?: unknown }>;

  // Generate LaTeX from template (same as LaTeX export)
  let latex: string;
  try {
    const templateContent = loadLatexTemplate(templateId);
    latex = fillLatexTemplate(templateContent, {
      header: structuredResume.header as any,
      education: structuredResume.education as any,
      experience: structuredResume.experience as any,
      projects: structuredResume.projects as any,
      technical_skills: structuredResume.technical_skills as any,
    });
  } catch (error) {
    console.error("Failed to load/fill LaTeX template:", error);
    return new Response("Failed to generate LaTeX template", { status: 500 });
  }

  // Compile LaTeX to PDF using LaTeX.Online API
  // This is a free service that compiles LaTeX to PDF
  try {
    const compileResponse = await fetch("https://latexonline.cc/compile", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: latex,
    });

    if (!compileResponse.ok) {
      const errorText = await compileResponse.text();
      console.error("LaTeX compilation failed:", errorText);
      
      // Fallback: return LaTeX file with instructions
      return new Response(
        `LaTeX compilation service unavailable. Please compile the LaTeX file manually using Overleaf or a local LaTeX installation.\n\n${latex}`,
        {
          headers: {
            "Content-Type": "text/plain",
            "Content-Disposition": `attachment; filename="${(data.title || "resume").replace(/[^a-z0-9]/gi, "_")}.tex"`,
          },
        }
      );
    }

    const pdfBuffer = await compileResponse.arrayBuffer();
    const pdfBytes = Buffer.from(pdfBuffer);

    const safeFilename = (data.title || "resume").replace(/[^a-z0-9]/gi, "_");
    const originalFilename = data.title || "resume";

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}.pdf"; filename*=UTF-8''${encodeURIComponent(originalFilename)}.pdf`,
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to compile LaTeX to PDF:", error);
    // Fallback: return LaTeX file
    return new Response(
      `LaTeX compilation failed. Please compile the LaTeX file manually using Overleaf (https://www.overleaf.com) or a local LaTeX installation.\n\n${latex}`,
      {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${(data.title || "resume").replace(/[^a-z0-9]/gi, "_")}.tex"`,
        },
      }
    );
  }
}
