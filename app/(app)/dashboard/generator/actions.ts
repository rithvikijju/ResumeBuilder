"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOpenAIClient } from "@/lib/openai/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResumeSchema } from "@/lib/resume/schema";

const generateSchema = z.object({
  jobDescriptionId: z.string().uuid({
    message: "Select a job description.",
  }),
  title: z
    .string()
    .max(120, "Resume title should be under 120 characters.")
    .optional()
    .or(z.literal("")),
});

export type GenerateState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; resumeId: string; message: string };

const initialState: GenerateState = { status: "idle" };

/**
 * Batch score relevance of multiple items against a job description using AI
 */
async function scoreRelevanceBatch(
  items: Array<{
    id: string;
    type: "experience" | "education" | "skill" | "project";
    content: string;
  }>,
  jobDescription: string
): Promise<Map<string, number>> {
  if (items.length === 0) return new Map();
  
  const openai = getOpenAIClient();
  
  const itemsList = items.map((item, idx) => 
    `${idx + 1}. [${item.type.toUpperCase()}] ${item.content.substring(0, 500)}`
  ).join("\n\n");
  
  const prompt = `Rate the relevance of each item below to the job description on a scale of 0-100.

Job Description:
${jobDescription.substring(0, 2000)}

Items to score:
${itemsList}

Respond with ONLY a JSON object mapping item numbers (1, 2, 3, etc.) to scores (0-100), like: {"1": 85, "2": 42, "3": 90}`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      temperature: 0,
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

    const scores = JSON.parse(text || "{}");
    const result = new Map<string, number>();
    
    items.forEach((item, idx) => {
      const score = parseInt(scores[String(idx + 1)] || scores[idx + 1] || "50", 10);
      result.set(item.id, Math.max(0, Math.min(100, score)));
    });
    
    return result;
  } catch (error) {
    console.warn(`Failed to score batch, defaulting to 50 for all:`, error);
    // Default to medium relevance if scoring fails
    const result = new Map<string, number>();
    items.forEach(item => result.set(item.id, 50));
    return result;
  }
}

/**
 * Automatically select the most relevant items based on job description
 */
async function selectRelevantItems(
  jobDescription: { job_text: string; role_title: string | null; company: string | null },
  allExperiences: Array<{ id: string; organization: string | null; role_title: string | null; achievements: string[] | null; summary: string | null }>,
  allEducation: Array<{ id: string; institution: string | null; degree: string | null; field_of_study: string | null }>,
  allSkills: Array<{ id: string; category: string | null; skills: string[] | null }>,
  allProjects: Array<{ id: string; title: string; summary: string | null; highlights: string[] | null }>
): Promise<{
  experiences: string[];
  education: string[];
  skills: string[];
  projects: string[];
}> {
  const jobText = `${jobDescription.role_title || ""} ${jobDescription.company || ""} ${jobDescription.job_text}`.trim();

  // Batch score all items for efficiency
  const experienceItems = allExperiences.map((exp) => ({
    id: exp.id,
    type: "experience" as const,
    content: `${exp.organization || ""} ${exp.role_title || ""} ${exp.summary || ""} ${(exp.achievements || []).join(" ")}`.trim(),
  }));

  const educationItems = allEducation.map((edu) => ({
    id: edu.id,
    type: "education" as const,
    content: `${edu.institution || ""} ${edu.degree || ""} ${edu.field_of_study || ""}`.trim(),
  }));

  const skillItems = allSkills.map((skill) => ({
    id: skill.id,
    type: "skill" as const,
    content: `${skill.category || ""} ${(skill.skills || []).join(" ")}`.trim(),
  }));

  const projectItems = allProjects.map((proj) => ({
    id: proj.id,
    type: "project" as const,
    content: `${proj.title} ${proj.summary || ""} ${(proj.highlights || []).join(" ")}`.trim(),
  }));

  // Score all batches in parallel
  const [experienceScoresMap, educationScoresMap, skillScoresMap, projectScoresMap] = await Promise.all([
    scoreRelevanceBatch(experienceItems, jobText),
    scoreRelevanceBatch(educationItems, jobText),
    scoreRelevanceBatch(skillItems, jobText),
    scoreRelevanceBatch(projectItems, jobText),
  ]);

  // Convert maps to arrays
  const experienceScores = Array.from(experienceScoresMap.entries()).map(([id, score]) => ({ id, score }));
  const educationScores = Array.from(educationScoresMap.entries()).map(([id, score]) => ({ id, score }));
  const skillScores = Array.from(skillScoresMap.entries()).map(([id, score]) => ({ id, score }));
  const projectScores = Array.from(projectScoresMap.entries()).map(([id, score]) => ({ id, score }));

  // Select top-scoring items (top 5-7 experiences, top 2-3 education, top 3-5 skills, top 3-5 projects)
  const topExperiences = experienceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .filter(item => item.score >= 30) // Only include if relevance >= 30%
    .map(item => item.id);

  const topEducation = educationScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(item => item.score >= 20)
    .map(item => item.id);

  const topSkills = skillScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .filter(item => item.score >= 40)
    .map(item => item.id);

  const topProjects = projectScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .filter(item => item.score >= 30)
    .map(item => item.id);

  console.log(`Auto-selected: ${topExperiences.length} experiences, ${topEducation.length} education, ${topSkills.length} skills, ${topProjects.length} projects`);

  return {
    experiences: topExperiences,
    education: topEducation,
    skills: topSkills,
    projects: topProjects,
  };
}

export async function generateResume(
  _prevState: GenerateState = initialState,
  formData: FormData
): Promise<GenerateState> {
  void _prevState;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You need to sign in again." };
  }

  const parsed = generateSchema.safeParse({
    jobDescriptionId: formData.get("jobDescriptionId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.issues?.[0]?.message ?? "Check your selection and try again.";
    return { status: "error", message };
  }

  const { jobDescriptionId, title } = parsed.data;

  const jobDescriptionPromise = supabase
    .from("job_descriptions")
    .select("*")
    .eq("id", jobDescriptionId)
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch job description and ALL available data
  const [{ data: jobDescription }, allProjectsRes, allExperiencesRes, allEducationRes, allSkillsRes] =
    await Promise.all([
      jobDescriptionPromise,
      supabase
        .from("project_records")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("experience_records")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false }),
      supabase
        .from("education_records")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false }),
      supabase
        .from("skill_records")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  if (allProjectsRes?.error) {
    console.error("Failed to fetch projects:", allProjectsRes.error);
    return { status: "error", message: "Unable to load projects." };
  }

  if (allExperiencesRes?.error) {
    console.error("Failed to fetch experiences:", allExperiencesRes.error);
    return { status: "error", message: "Unable to load experience entries." };
  }

  if (allEducationRes?.error) {
    console.error("Failed to fetch education:", allEducationRes.error);
    return { status: "error", message: "Unable to load education entries." };
  }

  if (allSkillsRes?.error) {
    console.error("Failed to fetch skills:", allSkillsRes.error);
    return { status: "error", message: "Unable to load skill groups." };
  }

  if (!jobDescription) {
    return { status: "error", message: "Job description not found." };
  }

  const allProjects = allProjectsRes?.data ?? [];
  const allExperiences = allExperiencesRes?.data ?? [];
  const allEducation = allEducationRes?.data ?? [];
  const allSkills = allSkillsRes?.data ?? [];

  if (!allExperiences.length && !allProjects.length) {
    return {
      status: "error",
      message:
        "Add experiences or projects to your library first. Import a resume or add entries manually.",
    };
  }

  // Automatically select the most relevant items based on job description
  const selected = await selectRelevantItems(
    jobDescription,
    allExperiences,
    allEducation,
    allSkills,
    allProjects
  );

  // Fetch the selected items
  const [selectedProjectsRes, selectedExperiencesRes, selectedEducationRes, selectedSkillsRes] = await Promise.all([
    selected.projects.length > 0
      ? supabase
          .from("project_records")
          .select("*")
          .in("id", selected.projects)
          .eq("user_id", user.id)
      : { data: [], error: null },
    selected.experiences.length > 0
      ? supabase
          .from("experience_records")
          .select("*")
          .in("id", selected.experiences)
          .eq("user_id", user.id)
      : { data: [], error: null },
    selected.education.length > 0
      ? supabase
          .from("education_records")
          .select("*")
          .in("id", selected.education)
          .eq("user_id", user.id)
      : { data: [], error: null },
    selected.skills.length > 0
      ? supabase
          .from("skill_records")
          .select("*")
          .in("id", selected.skills)
          .eq("user_id", user.id)
      : { data: [], error: null },
  ]);

  const projects = selectedProjectsRes.data ?? [];
  const experiences = selectedExperiencesRes.data ?? [];
  const education = selectedEducationRes.data ?? [];
  const skills = selectedSkillsRes.data ?? [];

  if (!experiences.length && !projects.length) {
    return {
      status: "error",
      message:
        "No relevant experiences or projects found for this job description. Try adding more entries to your library.",
    };
  }

  const prompt = buildPrompt(
    jobDescription,
    projects,
    experiences,
    education,
    skills
  );
  const openai = getOpenAIClient();

  let structuredResume;
  let rawResponse: unknown;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      temperature: 0,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      text: { format: { type: "json_object" } },
    });

    rawResponse = response;

    const text = Array.isArray(response.output)
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
      : (response as unknown as { output_text?: string }).output_text ?? "";

    if (!text.length) {
      throw new Error("OpenAI response did not include text output.");
    }

    const parsedJson = JSON.parse(text);
    const validation = ResumeSchema.safeParse(parsedJson);
    if (!validation.success) {
      throw new Error(
        `Resume JSON validation failed: ${validation.error.message}`
      );
    }

    structuredResume = validation.data;
  } catch (error) {
    console.error("OpenAI resume generation failed:", error);

    await supabase.from("resume_activity_log").insert({
      event: "generation_failed",
      metadata: {
        jobDescriptionId,
        projectIds,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      status: "error",
      message: "AI generation failed. Try again in a moment.",
    };
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title:
        title && title.length
          ? title
          : `${jobDescription.role_title ?? "Tailored"} Resume`,
      status: "generated",
      format: "pdf",
      structured_content: structuredResume,
      ai_prompt: {
        jobDescriptionId,
        projectIds: selectedProjectIds,
        experienceIds: selectedExperienceIds,
        educationIds: selectedEducationIds,
        skillIds: selectedSkillIds,
        prompt,
      },
      ai_response: rawResponse,
      job_description_id: jobDescription.id,
      job_target_id: null,
    })
    .select()
    .maybeSingle();

  if (resumeError || !resume) {
    console.error("Failed to store generated resume:", resumeError);
    return {
      status: "error",
      message: "Could not store the generated resume.",
    };
  }

  await supabase.from("resume_activity_log").insert({
    resume_id: resume.id,
    event: "generation_completed",
    metadata: {
      jobDescriptionId: jobDescription.id,
      projectIds: selectedProjectIds,
      experienceIds: selectedExperienceIds,
      educationIds: selectedEducationIds,
      skillIds: selectedSkillIds,
    },
  });

  revalidatePath("/dashboard/resumes");

  return {
    status: "success",
    resumeId: resume.id,
    message: "Resume generated successfully.",
  };
}

function buildPrompt(
  jobDescription: {
    role_title: string | null;
    company: string | null;
    location: string | null;
    seniority: string | null;
    source_url: string | null;
    job_text: string;
    keywords: string[] | null;
  },
  projects: {
    title: string;
    summary: string | null;
    highlights: string[] | null;
    tags: string[] | null;
  }[],
  experiences: {
    organization: string | null;
    role_title: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean | null;
    summary: string | null;
    achievements: string[] | null;
  }[],
  education: {
    institution: string | null;
    degree: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
    achievements: string[] | null;
  }[],
  skills: {
    category: string | null;
    skills: string[] | null;
  }[]
) {
  const jobSummary = [
    jobDescription.role_title ? `Role: ${jobDescription.role_title}` : null,
    jobDescription.company ? `Company: ${jobDescription.company}` : null,
    jobDescription.location ? `Location: ${jobDescription.location}` : null,
    jobDescription.seniority ? `Seniority: ${jobDescription.seniority}` : null,
    jobDescription.source_url ? `Source: ${jobDescription.source_url}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const jobText = jobDescription.job_text
    ? jobDescription.job_text
    : "No job description provided.";

  const jobKeywords = jobDescription.keywords?.length
    ? jobDescription.keywords.join(", ")
    : "No specific skills provided.";

  const projectDetails =
    projects.length > 0
      ? projects
          .map((project, index) => {
            const highlights = project.highlights?.length
              ? project.highlights.map((item) => `- ${item}`).join("\n")
              : "No highlights provided.";

            const tags = project.tags?.length
              ? `Tags: ${project.tags.join(", ")}`
              : "";

            return `Project ${index + 1}:
Title: ${project.title}
Summary: ${project.summary ?? "N/A"}
${tags}
Highlights:
${highlights}`;
          })
          .join("\n\n")
      : "No standalone project records selected.";

  const experienceDetails =
    experiences.length > 0
      ? experiences
          .map((experience, index) => {
            const achievements = experience.achievements?.length
              ? experience.achievements.map((item) => `- ${item}`).join("\n")
              : "No bullet achievements provided.";

            return `Experience ${index + 1}:
Role: ${experience.role_title ?? "N/A"}
Organization: ${experience.organization ?? "N/A"}
Location: ${experience.location ?? "N/A"}
Dates: ${experience.start_date ?? "?"} – ${
              experience.is_current ? "Present" : experience.end_date ?? "?"
            }
Summary: ${experience.summary ?? "N/A"}
Achievements:
${achievements}`;
          })
          .join("\n\n")
      : "No structured experience entries selected.";

  const educationDetails =
    education.length > 0
      ? education
          .map((item, index) => {
            const highlights = item.achievements?.length
              ? item.achievements.map((ach) => `- ${ach}`).join("\n")
              : "No highlights provided.";

            return `Education ${index + 1}:
Institution: ${item.institution ?? "N/A"}
Degree: ${item.degree ?? "N/A"}
Field of study: ${item.field_of_study ?? "N/A"}
Dates: ${item.start_date ?? "?"} – ${item.end_date ?? "?"}
Highlights:
${highlights}`;
          })
          .join("\n\n")
      : "No education entries selected.";

  const skillDetails =
    skills.length > 0
      ? skills
          .map((group, index) => {
            const list = group.skills?.length
              ? group.skills.join(", ")
              : "No skills listed.";
            return `Skill group ${index + 1} (${group.category ?? "General"}):
${list}`;
          })
          .join("\n\n")
      : "No additional skill groups selected.";

  return [
    "You are an expert resume writer.",
    "Use the latest best practices for ATS-friendly resumes tailored to the job description.",
    "",
    "Job description details:",
    jobSummary,
    "",
    "Job description:",
    jobText,
    "",
    `Important skills or keywords: ${jobKeywords}`,
    "",
    "Candidate project experience:",
    projectDetails,
    "",
    "Structured professional experience:",
    experienceDetails,
    "",
    "Education history:",
    educationDetails,
    "",
    "Skill groups:",
    skillDetails,
    "",
    "Create a tailored resume structure in JSON following this schema:",
    JSON.stringify(
      {
        summary: [
          {
            sentence: "string",
          },
        ],
        sections: [
          {
            title: "string",
            items: [
              {
                heading: "string",
                content: "string",
                metrics: [
                  {
                    label: "string",
                    value: "string",
                  },
                ],
              },
            ],
          },
        ],
        skills: {
          primary: ["string"],
          secondary: ["string"],
          tools: ["string"],
        },
      },
      null,
      2
    ),
    "",
    "Focus on measurable impact, align wording with the job, and keep each bullet under 30 words.",
  ].join("\n");
}

