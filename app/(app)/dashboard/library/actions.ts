"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/resume/extract";
import { parseResumeText } from "@/lib/resume/parser";

/**
 * Parse human-readable date strings into PostgreSQL date format (YYYY-MM-DD)
 * Handles formats like "June 2025", "Aug 2025", "Jan 2023", "2025", etc.
 */
function parseDateString(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  
  // Try to parse as ISO date first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString().split('T')[0];
  }
  
  // Month name mapping
  const monthMap: Record<string, number> = {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12,
  };
  
  // Try "Month Year" format (e.g., "June 2025", "Aug 2025")
  const monthYearMatch = trimmed.match(/^([a-z]+)\s+(\d{4})$/i);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase();
    const year = parseInt(monthYearMatch[2], 10);
    const month = monthMap[monthName];
    
    if (month && year) {
      // Use first day of month for start dates, last day for end dates
      // For simplicity, we'll use first day - caller can adjust if needed
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
  }
  
  // Try "Year" format (e.g., "2025")
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year >= 1900 && year <= 2100) {
      return `${year}-01-01`;
    }
  }
  
  // Try "MM/YYYY" or "MM-YYYY" format
  const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10);
    const year = parseInt(slashMatch[2], 10);
    if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
  }
  
  // If we can't parse it, return null
  console.warn(`Could not parse date string: "${dateStr}"`);
  return null;
}

/**
 * Calculate similarity between two strings
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
  }
  
  // Simple word overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Check if an experience record already exists
 */
function isExperienceDuplicate(
  newExp: {
    organization: string;
    role_title: string;
    start_date: string | null;
  },
  existing: {
    organization: string | null;
    role_title: string | null;
    start_date: string | null;
  }
): boolean {
  const orgSim = stringSimilarity(
    newExp.organization,
    existing.organization || ""
  );
  const roleSim = stringSimilarity(
    newExp.role_title,
    existing.role_title || ""
  );
  
  // If both organization and role are very similar, consider duplicate
  if (orgSim > 0.8 && roleSim > 0.8) {
    return true;
  }
  
  // If organization is identical and dates are similar
  if (orgSim > 0.9 && newExp.start_date && existing.start_date) {
    const dateSim = stringSimilarity(newExp.start_date, existing.start_date);
    if (dateSim > 0.7) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if an education record already exists
 */
function isEducationDuplicate(
  newEdu: {
    institution: string;
    degree: string | null;
    field_of_study: string | null;
  },
  existing: {
    institution: string | null;
    degree: string | null;
    field_of_study: string | null;
  }
): boolean {
  const instSim = stringSimilarity(
    newEdu.institution,
    existing.institution || ""
  );
  
  if (instSim > 0.85) {
    // Same institution, check if degree/field overlap
    const degree1 = newEdu.degree || "";
    const degree2 = existing.degree || "";
    const field1 = newEdu.field_of_study || "";
    const field2 = existing.field_of_study || "";
    
    if (degree1 && degree2 && stringSimilarity(degree1, degree2) > 0.7) {
      return true;
    }
    if (field1 && field2 && stringSimilarity(field1, field2) > 0.7) {
      return true;
    }
    // If same institution and no conflicting degree info, likely duplicate
    if (!degree1 && !degree2 && !field1 && !field2) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a skill category already exists
 */
function isSkillCategoryDuplicate(
  newSkill: {
    category: string | null;
    skills: string[];
  },
  existing: {
    category: string | null;
    skills: string[] | null;
  }
): boolean {
  const category1 = (newSkill.category || "").toLowerCase().trim();
  const category2 = (existing.category || "").toLowerCase().trim();
  
  // If categories match (or both are null/empty)
  if (category1 === category2 || (!category1 && !category2)) {
    // Check if skills overlap significantly
    const skills1 = new Set(newSkill.skills.map(s => s.toLowerCase().trim()));
    const skills2 = new Set((existing.skills || []).map(s => s.toLowerCase().trim()));
    const intersection = new Set([...skills1].filter(x => skills2.has(x)));
    const union = new Set([...skills1, ...skills2]);
    
    if (union.size === 0) return false;
    const overlap = intersection.size / union.size;
    
    // If more than 70% of skills overlap, consider duplicate
    return overlap > 0.7;
  }
  
  return false;
}

const importSchema = z.object({
  resumeText: z
    .string()
    .max(50000, "Pasted resume text is too long.")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(2000, "Notes should be under 2000 characters.")
    .optional()
    .or(z.literal("")),
});

type ImportState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const initialState: ImportState = { status: "idle" };

export async function importResumeSource(
  _prevState: ImportState = initialState,
  formData: FormData
): Promise<ImportState> {
  void _prevState;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Sign in again to upload resumes." };
  }

  const parsed = importSchema.safeParse({
    resumeText: formData.get("resumeText"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.errors[0]?.message ??
        "Unable to import resume. Check the fields and try again.",
    };
  }

  const file = formData.get("resumeFile");
  const hasFile = file instanceof File && file.size > 0;
  const pastedText = parsed.data.resumeText?.trim();

  if (!hasFile && !pastedText) {
    return {
      status: "error",
      message: "Upload a resume file or paste the resume text.",
    };
  }

  try {
    let extractedText = pastedText ?? "";
    let originalFilename: string | undefined;
    let mimeType: string | undefined;

    if (hasFile) {
      const result = await extractTextFromFile(file);
      extractedText = result.text || extractedText;
      originalFilename = result.originalFilename;
      mimeType = result.mimeType;
    }

    if (!extractedText || extractedText.length < 50) {
      return {
        status: "error",
        message:
          "We could not extract enough text. Try a different file or paste the resume contents manually.",
      };
    }

    const { error } = await supabase.from("resume_sources").insert({
      user_id: user.id,
      original_filename: originalFilename ?? null,
      mime_type: mimeType ?? (hasFile ? file.type : "text/plain"),
      extracted_text: extractedText,
      notes: parsed.data.notes || null,
      parse_status: "pending",
      parse_error: null,
    });

    if (error) {
      console.error("Failed to store resume source:", error);
      return {
        status: "error",
        message: "Unable to store the resume data right now.",
      };
    }

    revalidatePath("/dashboard/library");

    return {
      status: "success",
      message: "Resume imported. We’ll parse it for structured entries shortly.",
    };
  } catch (error) {
    console.error("Resume import failed:", error);
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Resume import failed. Try again or use a different file.",
    };
  }
}

type ParseState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const parseInitialState: ParseState = { status: "idle" };

export async function parseResumeSource(
  _prevState: ParseState = parseInitialState,
  formData: FormData
): Promise<ParseState> {
  void _prevState;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Sign in again to parse this resume." };
  }

  const sourceId = formData.get("sourceId");
  if (typeof sourceId !== "string" || sourceId.length === 0) {
    return { status: "error", message: "Invalid resume source." };
  }

  const { data: source, error: sourceError } = await supabase
    .from("resume_sources")
    .select("*")
    .eq("id", sourceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sourceError || !source) {
    return { status: "error", message: "Resume source not found." };
  }

  if (!source.extracted_text) {
    return {
      status: "error",
      message: "No resume text available for parsing. Re-upload and try again.",
    };
  }

  await supabase
    .from("resume_sources")
    .update({
      parse_status: "processing",
      parse_error: null,
    })
    .eq("id", sourceId)
    .eq("user_id", user.id);

  try {
    const parsed = await parseResumeText(source.extracted_text);
    
    console.log(`Parsing complete: ${parsed.experiences.length} experiences, ${parsed.education.length} education, ${parsed.skills.length} skill categories`);

    // Fetch existing records to check for duplicates (exclude records from this source)
    const [existingExperiences, existingEducation, existingSkills] = await Promise.all([
      supabase
        .from("experience_records")
        .select("id, organization, role_title, start_date")
        .eq("user_id", user.id)
        .neq("resume_source_id", sourceId), // Exclude records from this source
      supabase
        .from("education_records")
        .select("id, institution, degree, field_of_study")
        .eq("user_id", user.id)
        .neq("resume_source_id", sourceId), // Exclude records from this source
      supabase
        .from("skill_records")
        .select("id, category, skills")
        .eq("user_id", user.id)
        .neq("resume_source_id", sourceId), // Exclude records from this source
    ]);

    const existingExpList = existingExperiences.data ?? [];
    const existingEduList = existingEducation.data ?? [];
    const existingSkillList = existingSkills.data ?? [];

    // Delete only records from THIS source (not all user records)
    await Promise.all([
      supabase
        .from("experience_records")
        .delete()
        .eq("resume_source_id", sourceId)
        .eq("user_id", user.id),
      supabase
        .from("education_records")
        .delete()
        .eq("resume_source_id", sourceId)
        .eq("user_id", user.id),
      supabase
        .from("skill_records")
        .delete()
        .eq("resume_source_id", sourceId)
        .eq("user_id", user.id),
    ]);

    if (parsed.experiences.length > 0) {
      // Filter out duplicates before inserting
      const newExperiences = parsed.experiences.filter((experience) => {
        const org = experience.organization || "Unknown";
        const role = experience.role_title || "Unknown Role";
        const startDate = parseDateString(experience.start_date);
        
        // Check against existing records
        const isDuplicate = existingExpList.some((existing) =>
          isExperienceDuplicate(
            { organization: org, role_title: role, start_date: startDate },
            {
              organization: existing.organization,
              role_title: existing.role_title,
              start_date: existing.start_date,
            }
          )
        );
        
        return !isDuplicate;
      });

      console.log(`Filtered ${parsed.experiences.length - newExperiences.length} duplicate experiences`);

      if (newExperiences.length > 0) {
        const experienceInserts = newExperiences.map((experience) => {
          const achievements =
            experience.achievements
              ?.map((item) => item.trim())
              .filter(Boolean) ?? [];
          const skills =
            experience.skills
              ?.map((item) => item.trim())
              .filter(Boolean) ?? [];
          const sectionLabel = experience.section_label
            ? experience.section_label.trim()
            : null;
          const summary = experience.summary
            ? experience.summary.trim()
            : null;
          const summaryValue =
            summary && sectionLabel
              ? `${sectionLabel}: ${summary}`
              : summary ?? sectionLabel ?? null;

          return {
            user_id: user.id,
            resume_source_id: sourceId,
            organization: experience.organization || "Unknown",
            role_title: experience.role_title || "Unknown Role",
            location: experience.location ?? null,
            start_date: parseDateString(experience.start_date),
            end_date: experience.is_current ? null : parseDateString(experience.end_date),
            is_current: experience.is_current ?? false,
            summary: summaryValue,
            achievements: achievements.length > 0 ? achievements : null,
            skills: skills.length > 0 ? skills : null,
          };
        });

        const { error: expError, data: expData } = await supabase
          .from("experience_records")
          .insert(experienceInserts)
          .select();

        if (expError) {
          console.error("Failed to insert experiences:", expError);
          console.error("Experience data:", JSON.stringify(experienceInserts, null, 2));
        } else {
          console.log(`✓ Inserted ${expData?.length || 0} new experience records`);
        }
      } else {
        console.log("No new experiences to insert (all were duplicates)");
      }
    }

    if (parsed.education.length > 0) {
      // Filter out duplicates before inserting
      const newEducation = parsed.education.filter((education) => {
        const institution = education.institution || "Unknown Institution";
        const degree = Array.isArray(education.degree)
          ? education.degree.join(", ")
          : education.degree ?? null;
        const fieldOfStudy = Array.isArray(education.field_of_study)
          ? education.field_of_study.join(", ")
          : education.field_of_study ?? null;
        
        // Check against existing records
        const isDuplicate = existingEduList.some((existing) =>
          isEducationDuplicate(
            { institution, degree, field_of_study: fieldOfStudy },
            {
              institution: existing.institution,
              degree: existing.degree,
              field_of_study: existing.field_of_study,
            }
          )
        );
        
        return !isDuplicate;
      });

      console.log(`Filtered ${parsed.education.length - newEducation.length} duplicate education entries`);

      if (newEducation.length > 0) {
        const educationInserts = newEducation.map((education) => {
          const achievements =
            education.achievements
              ?.map((item) => item.trim())
              .filter(Boolean) ?? [];

          const degree = Array.isArray(education.degree)
            ? education.degree.join(", ")
            : education.degree ?? null;
          const fieldOfStudy = Array.isArray(education.field_of_study)
            ? education.field_of_study.join(", ")
            : education.field_of_study ?? null;

          return {
            user_id: user.id,
            resume_source_id: sourceId,
            institution: education.institution || "Unknown Institution",
            degree,
            field_of_study: fieldOfStudy,
            start_date: parseDateString(education.start_date),
            end_date: parseDateString(education.end_date),
            achievements: achievements.length > 0 ? achievements : null,
          };
        });

        const { error: eduError, data: eduData } = await supabase
          .from("education_records")
          .insert(educationInserts)
          .select();

        if (eduError) {
          console.error("Failed to insert education:", eduError);
          console.error("Education data:", JSON.stringify(educationInserts, null, 2));
        } else {
          console.log(`✓ Inserted ${eduData?.length || 0} new education records`);
        }
      } else {
        console.log("No new education to insert (all were duplicates)");
      }
    }

    if (parsed.skills.length > 0) {
      // Filter out duplicates before inserting
      const newSkills = parsed.skills.filter((skillCategory) => {
        const rawSkills = skillCategory.skills;
        let skills: string[] = [];

        if (Array.isArray(rawSkills)) {
          skills = rawSkills.map((item) => item.trim()).filter(Boolean);
        } else if (rawSkills && typeof rawSkills === "object") {
          skills = Object.values(rawSkills)
            .flat()
            .map((item) => item.trim())
            .filter(Boolean);
        }

        const category = skillCategory.category ?? null;
        
        // Check against existing records
        const isDuplicate = existingSkillList.some((existing) =>
          isSkillCategoryDuplicate(
            { category, skills },
            {
              category: existing.category,
              skills: existing.skills,
            }
          )
        );
        
        return !isDuplicate;
      });

      console.log(`Filtered ${parsed.skills.length - newSkills.length} duplicate skill categories`);

      if (newSkills.length > 0) {
        const skillInserts = newSkills.map((skillCategory) => {
          const rawSkills = skillCategory.skills;
          let skills: string[] = [];

          if (Array.isArray(rawSkills)) {
            skills = rawSkills.map((item) => item.trim()).filter(Boolean);
          } else if (rawSkills && typeof rawSkills === "object") {
            skills = Object.values(rawSkills)
              .flat()
              .map((item) => item.trim())
              .filter(Boolean);
          }

          return {
            user_id: user.id,
            resume_source_id: sourceId,
            category: skillCategory.category ?? null,
            skills,
          };
        });

        const { error: skillError, data: skillData } = await supabase
          .from("skill_records")
          .insert(skillInserts)
          .select();

        if (skillError) {
          console.error("Failed to insert skills:", skillError);
          console.error("Skill data:", JSON.stringify(skillInserts, null, 2));
        } else {
          console.log(`✓ Inserted ${skillData?.length || 0} new skill records`);
        }
      } else {
        console.log("No new skills to insert (all were duplicates)");
      }
    }

    await supabase
      .from("resume_sources")
      .update({
        parse_status: "success",
        parsed_at: new Date().toISOString(),
        parse_error: null,
      })
      .eq("id", sourceId)
      .eq("user_id", user.id);

    revalidatePath("/dashboard/library");

    return {
      status: "success",
      message: "Resume parsed into structured entries.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Parsing failed unexpectedly.";

    await supabase
      .from("resume_sources")
      .update({
        parse_status: "failed",
        parse_error: message,
      })
      .eq("id", sourceId)
      .eq("user_id", user.id);

    revalidatePath("/dashboard/library");

    return {
      status: "error",
      message,
    };
  }
}

type UpdateState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const updateInitialState: UpdateState = { status: "idle" };

const experienceSchema = z.object({
  id: z.string().uuid(),
  organization: z.string().min(1, "Organization is required.").max(200),
  roleTitle: z.string().min(1, "Role title is required.").max(200),
  location: z.string().max(200).optional().or(z.literal("")),
  startDate: z.string().max(50).optional().or(z.literal("")),
  endDate: z.string().max(50).optional().or(z.literal("")),
  isCurrent: z.string().optional(),
  summary: z.string().max(2000).optional().or(z.literal("")),
  achievements: z.string().max(5000).optional().or(z.literal("")),
  skills: z.string().max(2000).optional().or(z.literal("")),
});

const educationSchema = z.object({
  id: z.string().uuid(),
  institution: z.string().min(1, "Institution is required.").max(200),
  degree: z.string().max(200).optional().or(z.literal("")),
  fieldOfStudy: z.string().max(200).optional().or(z.literal("")),
  startDate: z.string().max(50).optional().or(z.literal("")),
  endDate: z.string().max(50).optional().or(z.literal("")),
  achievements: z.string().max(5000).optional().or(z.literal("")),
});

const skillSchema = z.object({
  id: z.string().uuid(),
  category: z.string().max(200).optional().or(z.literal("")),
  skills: z.string().max(5000).optional().or(z.literal("")),
});

function parseList(value?: string | null, separator: "newline" | "comma" = "newline") {
  if (!value) return [];
  const items =
    separator === "newline"
      ? value.split("\n")
      : value.split(",");
  return items.map((item) => item.trim()).filter(Boolean);
}

export async function updateExperienceRecord(
  _prevState: UpdateState = updateInitialState,
  formData: FormData
): Promise<UpdateState> {
  void _prevState;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Sign in again to update this entry." };
  }

  const parsed = experienceSchema.safeParse({
    id: formData.get("id"),
    organization: formData.get("organization"),
    roleTitle: formData.get("roleTitle"),
    location: formData.get("location"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isCurrent: formData.get("isCurrent"),
    summary: formData.get("summary"),
    achievements: formData.get("achievements"),
    skills: formData.get("skills"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.errors[0]?.message ?? "Check the form fields and try again.";
    return { status: "error", message };
  }

  const {
    id,
    organization,
    roleTitle,
    location,
    startDate,
    endDate,
    isCurrent,
    summary,
    achievements,
    skills,
  } = parsed.data;

  const achievementsList = parseList(achievements, "newline");
  const skillsList = parseList(skills, "comma");

  const { error } = await supabase
    .from("experience_records")
    .update({
      organization,
      role_title: roleTitle,
      location: location || null,
      start_date: startDate || null,
      end_date: isCurrent ? null : endDate || null,
      is_current: Boolean(isCurrent),
      summary: summary || null,
      achievements: achievementsList.length ? achievementsList : null,
      skills: skillsList.length ? skillsList : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update experience record:", error);
    return {
      status: "error",
      message: "Unable to update experience right now.",
    };
  }

  revalidatePath("/dashboard/library");

  return { status: "success", message: "Experience updated." };
}

export async function deleteExperienceRecord(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in again to continue.");
  }

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Invalid experience identifier.");
  }

  const { error } = await supabase
    .from("experience_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete experience record:", error);
    throw new Error("Unable to delete experience right now.");
  }

  revalidatePath("/dashboard/library");
}

export async function updateEducationRecord(
  _prevState: UpdateState = updateInitialState,
  formData: FormData
): Promise<UpdateState> {
  void _prevState;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Sign in again to update this entry." };
  }

  const parsed = educationSchema.safeParse({
    id: formData.get("id"),
    institution: formData.get("institution"),
    degree: formData.get("degree"),
    fieldOfStudy: formData.get("fieldOfStudy"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    achievements: formData.get("achievements"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.errors[0]?.message ?? "Check the form fields and try again.";
    return { status: "error", message };
  }

  const {
    id,
    institution,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    achievements,
  } = parsed.data;

  const achievementsList = parseList(achievements, "newline");

  const { error } = await supabase
    .from("education_records")
    .update({
      institution,
      degree: degree || null,
      field_of_study: fieldOfStudy || null,
      start_date: startDate || null,
      end_date: endDate || null,
      achievements: achievementsList.length ? achievementsList : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update education record:", error);
    return {
      status: "error",
      message: "Unable to update education right now.",
    };
  }

  revalidatePath("/dashboard/library");

  return { status: "success", message: "Education updated." };
}

export async function deleteEducationRecord(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in again to continue.");
  }

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Invalid education identifier.");
  }

  const { error } = await supabase
    .from("education_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete education record:", error);
    throw new Error("Unable to delete education right now.");
  }

  revalidatePath("/dashboard/library");
}

export async function updateSkillRecord(
  _prevState: UpdateState = updateInitialState,
  formData: FormData
): Promise<UpdateState> {
  void _prevState;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Sign in again to update this entry." };
  }

  const parsed = skillSchema.safeParse({
    id: formData.get("id"),
    category: formData.get("category"),
    skills: formData.get("skills"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.errors[0]?.message ?? "Check the form fields and try again.";
    return { status: "error", message };
  }

  const { id, category, skills } = parsed.data;
  const skillsList = parseList(skills, "comma");

  const { error } = await supabase
    .from("skill_records")
    .update({
      category: category || null,
      skills: skillsList,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update skill record:", error);
    return {
      status: "error",
      message: "Unable to update skills right now.",
    };
  }

  revalidatePath("/dashboard/library");

  return { status: "success", message: "Skill group updated." };
}

export async function deleteSkillRecord(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in again to continue.");
  }

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Invalid skill identifier.");
  }

  const { error } = await supabase
    .from("skill_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete skill record:", error);
    throw new Error("Unable to delete skill group right now.");
  }

  revalidatePath("/dashboard/library");
}

