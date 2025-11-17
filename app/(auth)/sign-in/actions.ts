"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function signInWithMagicLink(
  _prevState: { status: "error" | "success"; message: string },
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
  const origin = headersList.get("origin") || headersList.get("host");
  
  // Construct redirect URL - handle both localhost and production
  let redirectUrl: string | undefined;
  if (origin) {
    const protocol = origin.includes("localhost") || origin.includes("127.0.0.1") 
      ? "http" 
      : "https";
    const host = origin.startsWith("http") ? origin : `${protocol}://${origin}`;
    redirectUrl = `${host}/auth/callback`;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error("Supabase sign-in error:", error);
    // Provide more helpful error messages
    let errorMessage = "Unable to send magic link. Try again shortly.";
    if (error.message.includes("redirect_to")) {
      errorMessage = "Redirect URL not configured. Please contact support.";
    } else if (error.message.includes("rate limit")) {
      errorMessage = "Too many requests. Please wait a few minutes and try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return {
      status: "error" as const,
      message: errorMessage,
    };
  }

  return {
    status: "success" as const,
    message:
      "Check your inbox for a magic link. The email is valid for five minutes.",
  };
}

