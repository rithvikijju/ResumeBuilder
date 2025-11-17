"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function signInWithMagicLink(
  _prevState: { status: "idle" | "error" | "success"; message: string },
  formData: FormData
) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error" as const,
      message: parsed.error.flatten().formErrors.join(", ") || "Invalid email.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const headersList = await headers();
  const origin = headersList.get("origin");

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });

  if (error) {
    console.error("Supabase sign-in error:", error);
    return {
      status: "error" as const,
      message: "Unable to send magic link. Try again shortly.",
    };
  }

  return {
    status: "success" as const,
    message:
      "Check your inbox for a magic link. The email is valid for five minutes.",
  };
}

