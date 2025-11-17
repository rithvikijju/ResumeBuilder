"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const jobDescriptionSchema = z.object({
  roleTitle: z
    .string()
    .max(200, "Keep the role title under 200 characters.")
    .optional()
    .or(z.literal("")),
  company: z
    .string()
    .max(200, "Company name should be under 200 characters.")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(150, "Location should be under 150 characters.")
    .optional()
    .or(z.literal("")),
  seniority: z
    .string()
    .max(120, "Seniority should be under 120 characters.")
    .optional()
    .or(z.literal("")),
  sourceUrl: z
    .string()
    .url("Provide a valid URL.")
    .optional()
    .or(z.literal("")),
  jobText: z
    .string({ required_error: "Paste the job description text." })
    .min(100, "Paste more of the job description so we can tailor effectively.")
    .max(20000, "Job description is too long."),
  keywords: z
    .string()
    .max(500, "Keywords string should stay under 500 characters.")
    .optional()
    .or(z.literal("")),
});

type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function createJobDescription(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Sign in again to save job data." };
  }

  const parsed = jobDescriptionSchema.safeParse({
    roleTitle: formData.get("roleTitle"),
    company: formData.get("company"),
    location: formData.get("location"),
    seniority: formData.get("seniority"),
    sourceUrl: formData.get("sourceUrl"),
    jobText: formData.get("jobText"),
    keywords: formData.get("keywords"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.errors[0]?.message ??
      "Unable to save job description. Check the fields and try again.";
    return { status: "error", message };
  }

  const { roleTitle, company, location, seniority, sourceUrl, jobText, keywords } =
    parsed.data;

  const { error } = await supabase.from("job_descriptions").insert({
    user_id: user.id,
    role_title: roleTitle || null,
    company: company || null,
    location: location || null,
    seniority: seniority || null,
    source_url: sourceUrl || null,
    job_text: jobText,
    keywords: keywords
      ? keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : null,
  });

  if (error) {
    console.error("Failed to insert job description:", error);
    return {
      status: "error",
      message: "Something went wrong while saving. Try again in a moment.",
    };
  }

  revalidatePath("/dashboard/job-descriptions");

  return {
    status: "success",
    message: "Job description saved.",
  };
}

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteJobDescription(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in again to continue.");
  }

  const parsed = deleteSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    throw new Error("Invalid description identifier.");
  }

  const { error } = await supabase
    .from("job_descriptions")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete job description:", error);
    throw new Error("Unable to delete job description right now.");
  }

  revalidatePath("/dashboard/job-descriptions");
}

