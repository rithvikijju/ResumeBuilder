import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResumeSchema } from "@/lib/resume/schema";
import { getTemplateById } from "@/lib/resume/templates";
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
    return new Response("Only structured resume format is supported for LaTeX export", { status: 400 });
  }

  const structuredResume = resume as Extract<typeof resume, { header?: unknown }>;

  // Load the LaTeX template file
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
    return new Response("Failed to generate LaTeX", { status: 500 });
  }

  const filename = `${(data.title || "resume").replace(/[^a-z0-9]/gi, "_")}.tex`;

  return new Response(latex, {
    headers: {
      "Content-Type": "application/x-latex",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(data.title || "resume")}.tex`,
      "Content-Length": Buffer.byteLength(latex, "utf8").toString(),
    },
  });
}


