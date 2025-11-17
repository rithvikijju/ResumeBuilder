"use server";

import { z } from "zod";
import { getOpenAIClient } from "@/lib/openai/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResumeSchema } from "@/lib/resume/schema";
import type { ResumeRecord, JobDescription } from "@/types/database";

const coverLetterSchema = z.object({
  jobDescriptionId: z.string().uuid({
    message: "Select a job description.",
  }),
  resumeId: z.string().uuid().optional().or(z.literal("")),
});

export type CoverLetterState =
  | { status: "error"; message: string }
  | { status: "success"; message: string }
  | {
      status: "success";
      message?: string;
      outline: {
        sections: Array<{
          title: string;
          guidance: string;
          keyPoints?: string[];
          examples?: string[];
        }>;
        tips?: string[];
      };
    };

const initialState: CoverLetterState = { status: "success", message: "" };

export async function generateCoverLetterOutline(
  _prevState: CoverLetterState = initialState,
  formData: FormData
): Promise<CoverLetterState> {
  void _prevState;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You need to sign in again." };
  }

  const parsed = coverLetterSchema.safeParse({
    jobDescriptionId: formData.get("jobDescriptionId"),
    resumeId: formData.get("resumeId"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.issues?.[0]?.message ?? "Check your selection and try again.";
    return { status: "error", message };
  }

  const { jobDescriptionId, resumeId } = parsed.data;

  // Fetch job description
  const { data: jobDescriptionData, error: jobError } = await supabase
    .from("job_descriptions")
    .select("*")
    .eq("id", jobDescriptionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (jobError || !jobDescriptionData) {
    return { status: "error", message: "Job description not found." };
  }

  const jobDescription = jobDescriptionData as JobDescription;

  // Fetch resume if provided
  let resumeData = null;
  if (resumeId) {
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!resumeError && resume) {
      const resumeRecord = resume as ResumeRecord;
      const validation = ResumeSchema.safeParse(resumeRecord.structured_content);
      if (validation.success) {
        resumeData = validation.data;
      }
    }
  }

  // Build prompt for outline generation
  const jobText = `${jobDescription.role_title || ""} ${jobDescription.company || ""} ${jobDescription.job_text}`.trim();
  
  let resumeContext = "";
  if (resumeData) {
    const summary = resumeData.summary?.map(s => s.sentence).join(" ") || "";
    const sections = resumeData.sections.map(s => 
      `${s.title}: ${s.items.map(i => i.content).join(" ")}`
    ).join("\n");
    resumeContext = `\n\nCandidate's Resume Summary:\n${summary}\n\nKey Experience:\n${sections}`;
  }

  const prompt = `You are a career coach helping someone write a cover letter. DO NOT write the cover letter for them. Instead, create a comprehensive outline and template that guides them on WHAT to write in each section.

Job Description:
${jobText.substring(0, 3000)}${resumeContext}

Create a structured outline with the following sections:
1. Opening/Greeting - How to address the hiring manager and introduce yourself
2. Why This Role - How to express interest in this specific position
3. Why This Company - How to show knowledge of and interest in the company
4. Your Relevant Experience - How to connect your background to their needs
5. Your Unique Value - How to highlight what makes you stand out
6. Closing - How to wrap up professionally

For each section, provide:
- Clear guidance on what to write (not the actual text, but what to cover)
- 2-3 key points they should include
- 1-2 example phrases they can adapt (not full sentences, just phrases to inspire their own writing)

Also provide 3-5 general writing tips for making the cover letter sound authentic and not AI-generated.

Output as JSON with this structure:
{
  "sections": [
    {
      "title": "Section Name",
      "guidance": "What to write in this section...",
      "keyPoints": ["Point 1", "Point 2"],
      "examples": ["Example phrase 1", "Example phrase 2"]
    }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

  const openai = getOpenAIClient();

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const text =
      (response.output_text ?? "").trim() ||
      (Array.isArray(response.output)
        ? response.output
            .map((item) =>
              "content" in item && Array.isArray(item.content)
                ? item.content
                    .map((chunk) =>
                      typeof chunk === "string"
                        ? chunk
                        : "text" in chunk
                        ? chunk.text
                        : ""
                    )
                    .join("")
                : ""
            )
            .join("")
        : "");

    const outline = JSON.parse(text || "{}");

    // Validate structure
    if (!outline.sections || !Array.isArray(outline.sections)) {
      return {
        status: "error",
        message: "Failed to generate outline. Please try again.",
      };
    }

    return {
      status: "success",
      outline: {
        sections: outline.sections,
        tips: outline.tips || [],
      },
    };
  } catch (error) {
    console.error("Cover letter outline generation failed:", error);
    return {
      status: "error",
      message: "Failed to generate outline. Please try again.",
    };
  }
}

