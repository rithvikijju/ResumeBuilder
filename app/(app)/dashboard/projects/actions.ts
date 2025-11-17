"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const projectSchema = z.object({
  title: z
    .string({
      required_error: "Title is required.",
    })
    .min(1, "Title is required.")
    .max(200, "Keep the title under 200 characters."),
  summary: z
    .string()
    .max(1000, "Summary should be under 1000 characters.")
    .optional()
    .or(z.literal("")),
  highlights: z
    .string()
    .max(2000, "Highlights are too long.")
    .optional()
    .or(z.literal("")),
  tags: z
    .string()
    .max(500, "Tags string is too long.")
    .optional()
    .or(z.literal("")),
  rawInput: z
    .string()
    .max(4000, "Imported content should be under 4000 characters.")
    .optional()
    .or(z.literal("")),
});

type ProjectActionState = {
  status: "error" | "success";
  message: string;
};

function parseHighlights(value?: string | null) {
  if (!value) return null;
  const parts = value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

function parseTags(value?: string | null) {
  if (!value) return null;
  const parts = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

export async function createProject(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "You must be signed in to add a project.",
    };
  }

  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    highlights: formData.get("highlights"),
    tags: formData.get("tags"),
    rawInput: formData.get("rawInput"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ??
        "Unable to save project. Check the input and try again.",
    };
  }

  const { title, summary, highlights, tags, rawInput } = parsed.data;

  const { error } = await supabase.from("project_records").insert({
    user_id: user.id,
    title,
    summary: summary || null,
    highlights: parseHighlights(highlights),
    tags: parseTags(tags),
    raw_input: rawInput || null,
  });

  if (error) {
    console.error("Failed to insert project:", error);
    return {
      status: "error",
      message: "Failed to save project. Try again in a moment.",
    };
  }

  revalidatePath("/dashboard/projects");

  return {
    status: "success",
    message: "Project saved.",
  };
}

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteProject(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const parsed = deleteSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    throw new Error("Invalid project identifier.");
  }

  const { error } = await supabase
    .from("project_records")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete project:", error);
    throw new Error("Unable to delete project right now.");
  }

  revalidatePath("/dashboard/projects");
}

