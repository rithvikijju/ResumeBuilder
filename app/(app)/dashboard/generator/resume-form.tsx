import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  JobDescription,
  ProjectRecord,
  ExperienceRecord,
  EducationRecord,
  SkillRecord,
} from "@/types/database";
import { GenerateFormClient } from "./resume-form.client";

function take<T>(items: T[] | null | undefined, limit: number): T[] {
  if (!items || items.length === 0) return [];
  return items.slice(0, limit);
}

export async function GenerateResumeForm() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <p className="text-sm text-red-600">
        You must be signed in to generate a resume.
      </p>
    );
  }

  const [projectsRes, jobDescriptionsRes, experiencesRes, educationRes, skillsRes] =
    await Promise.all([
      supabase
        .from("project_records")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("job_descriptions")
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

  const projects = (projectsRes.data ?? []) as ProjectRecord[];
  const jobDescriptions = (jobDescriptionsRes.data ?? []) as JobDescription[];
  const experiences = (experiencesRes.data ?? []) as ExperienceRecord[];
  const education = (educationRes.data ?? []) as EducationRecord[];
  const skills = (skillsRes.data ?? []) as SkillRecord[];

  const summary = {
    projects: projects, // Show all for count
    experiences: experiences, // Show all for count
    education: education, // Show all for count
    skills: skills, // Show all for count
  };

  return (
    <GenerateFormClient
      jobDescriptions={jobDescriptions}
      summary={summary}
    />
  );
}

