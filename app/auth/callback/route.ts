import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseKeys } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const { url, anonKey } = getSupabaseKeys();
  
  // Create response to set cookies on
  const response = NextResponse.redirect(`${origin}${next}`);

  // Create Supabase client with cookie handling on the response
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        // Get cookies from the request
        const cookieHeader = request.headers.get("cookie") || "";
        if (!cookieHeader) return [];
        
        return cookieHeader.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          return { name, value: rest.join("=") };
        });
      },
      setAll(cookiesToSet) {
        // Set cookies on the response
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Error exchanging auth code:", error);
    return NextResponse.redirect(`${origin}/sign-in?error=callback`);
  }

  // Get session to ensure it's set in cookies
  await supabase.auth.getSession();

  return response;
}

