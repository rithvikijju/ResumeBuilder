"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteResume(formData: FormData) {
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
    throw new Error("Invalid resume identifier.");
  }

  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete resume:", error);
    throw new Error("Unable to delete resume right now.");
  }

  revalidatePath("/dashboard/resumes");
}

