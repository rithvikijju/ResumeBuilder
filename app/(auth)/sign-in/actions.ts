"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function signInWithPassword(
  _prevState: { status: "error" | "success"; message: string },
  formData: FormData
) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error" as const,
      message: parsed.error.flatten().formErrors.join(", ") || "Invalid credentials.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.error("Supabase sign-in error:", error);
    let errorMessage = "Invalid email or password.";
    if (error.message.includes("Email not confirmed")) {
      errorMessage = "Please confirm your email address before signing in. Check your inbox for a confirmation link.";
    } else if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return {
      status: "error" as const,
      message: errorMessage,
    };
  }

  // Successful sign-in - redirect to dashboard
  redirect("/dashboard");
}

