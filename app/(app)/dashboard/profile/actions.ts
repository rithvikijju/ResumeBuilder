"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(200),
  headline: z.string().max(200).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  links: z.array(
    z.object({
      label: z.string().min(1),
      url: z.string().url("Must be a valid URL"),
    })
  ).optional().default([]),
});

export type ProfileActionState =
  | { status: "error"; message: string }
  | { status: "success"; message: string };

const initialState: ProfileActionState = { status: "success", message: "" };

export async function updateProfile(
  _prevState: ProfileActionState = initialState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  // Parse links from form data
  const links: Array<{ label: string; url: string }> = [];
  let linkIndex = 0;
  while (formData.get(`link_label_${linkIndex}`)) {
    const label = formData.get(`link_label_${linkIndex}`) as string;
    const url = formData.get(`link_url_${linkIndex}`) as string;
    if (label && url) {
      links.push({ label, url });
    }
    linkIndex++;
  }

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    headline: formData.get("headline"),
    location: formData.get("location"),
    phone: formData.get("phone"),
    links,
  });

  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? "Invalid profile data.";
    return { status: "error", message };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: parsed.data.full_name,
        headline: parsed.data.headline || null,
        location: parsed.data.location || null,
        phone: parsed.data.phone || null,
        links: parsed.data.links || [],
      },
      {
        onConflict: "id",
      }
    );

  if (error) {
    console.error("Failed to update profile:", error);
    return { status: "error", message: "Unable to save profile right now." };
  }

  revalidatePath("/dashboard/profile");
  return { status: "success", message: "Profile updated successfully." };
}

