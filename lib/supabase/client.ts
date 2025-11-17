import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseKeys } from "./env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseKeys();
  return createBrowserClient<Database>(url, anonKey);
}

