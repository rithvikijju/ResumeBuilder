import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobDescription, ResumeRecord } from "@/types/database";
import { CoverLetterFormClient } from "./cover-letter-form.client";

export async function CoverLetterForm() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <p className="text-sm text-red-600">
        You must be signed in to generate a cover letter outline.
      </p>
    );
  }

  const [jobDescriptionsRes, resumesRes] = await Promise.all([
    supabase
      .from("job_descriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  const jobDescriptions = (jobDescriptionsRes.data ?? []) as JobDescription[];
  const resumes = (resumesRes.data ?? []) as ResumeRecord[];

  return (
    <CoverLetterFormClient
      jobDescriptions={jobDescriptions}
      resumes={resumes}
    />
  );
}

