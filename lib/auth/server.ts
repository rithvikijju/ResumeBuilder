import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const sessionResult = await supabase.auth.getSession();

  if (sessionResult.error) {
    console.error("Error fetching Supabase session:", sessionResult.error);
  }

  return sessionResult.data.session;
}

export async function requireUser() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return session.user;
}

