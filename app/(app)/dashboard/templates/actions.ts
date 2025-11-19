"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const uploadTemplateSchema = z.object({
  templateId: z.string().min(1).max(50),
  templateName: z.string().min(1).max(200),
  templateDescription: z.string().max(500).optional().nullable(),
  templateCategory: z.enum(["finance", "tech", "custom"]),
  templateConfig: z.string().min(1),
  isDefault: z.string().optional(),
});

export type TemplateUploadState =
  | { status: "error"; message: string }
  | { status: "success"; message: string };

const initialState: TemplateUploadState = { status: "success", message: "" };

export async function uploadTemplate(
  _prevState: TemplateUploadState,
  formData: FormData
): Promise<TemplateUploadState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const parsed = uploadTemplateSchema.safeParse({
    templateId: formData.get("templateId"),
    templateName: formData.get("templateName"),
    templateDescription: formData.get("templateDescription") || null,
    templateCategory: formData.get("templateCategory"),
    templateConfig: formData.get("templateConfig"),
    isDefault: formData.get("isDefault"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues?.[0]?.message || "Invalid template data.",
    };
  }

  let templateConfig;
  try {
    templateConfig = JSON.parse(parsed.data.templateConfig);
  } catch (error) {
    return {
      status: "error",
      message: "Invalid JSON format. Please check your template configuration.",
    };
  }

  // Validate template config structure
  if (!templateConfig.style || !templateConfig.layout || !templateConfig.formatting) {
    return {
      status: "error",
      message: "Template config must include style, layout, and formatting sections.",
    };
  }

  const { error } = await (supabase
    .from("resume_templates") as any)
    .upsert({
      id: parsed.data.templateId.toLowerCase().replace(/\s+/g, "-"),
      name: parsed.data.templateName,
      description: parsed.data.templateDescription,
      category: parsed.data.templateCategory,
      is_default: parsed.data.isDefault === "on",
      template_config: templateConfig,
    }, {
      onConflict: "id",
    });

  if (error) {
    console.error("Failed to upload template:", error);
    return {
      status: "error",
      message: error.message || "Failed to upload template. Please try again.",
    };
  }

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/generator");

  return {
    status: "success",
    message: `Template "${parsed.data.templateName}" uploaded successfully!`,
  };
}

