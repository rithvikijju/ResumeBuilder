"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signUpSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

export async function signUp(
  _prevState: { status: "error" | "success"; message: string },
  formData: FormData
) {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error" as const,
      message: parsed.error.flatten().formErrors.join(", ") || "Invalid input.",
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

  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error("Supabase sign-up error:", error);
    let errorMessage = "Unable to create account. Please try again.";
    if (error.message.includes("User already registered")) {
      errorMessage = "An account with this email already exists. Please sign in instead.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return {
      status: "error" as const,
      message: errorMessage,
    };
  }

  // Successful sign-up - show confirmation message
  return {
    status: "success" as const,
    message: "Account created! Please check your email to confirm your account before signing in.",
  };
}

