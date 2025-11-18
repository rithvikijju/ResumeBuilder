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
  
  // Determine if we're on HTTPS
  const isHttps = origin.startsWith("https://");
  const hostname = new URL(origin).hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  
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
          return { name, value: decodeURIComponent(rest.join("=")) };
        });
      },
      setAll(cookiesToSet) {
        // Set cookies on the response with explicit options for cross-browser compatibility
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({
            name,
            value,
            ...options,
            // CRITICAL: Explicitly set these for cross-browser compatibility
            path: options?.path || "/",
            sameSite: options?.sameSite || "lax", // 'lax' works for most cases
            secure: options?.secure ?? isHttps, // Must be true for HTTPS
            httpOnly: options?.httpOnly ?? true,
            // Don't set domain - let browser handle it automatically
          });
        });
      },
    },
  });

  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Error exchanging auth code:", error);
    return NextResponse.redirect(`${origin}/sign-in?error=callback&message=${encodeURIComponent(error.message)}`);
  }

  // Verify session was actually created and cookies are set
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !sessionData?.session) {
    console.error("Session not established after code exchange:", sessionError);
    return NextResponse.redirect(`${origin}/sign-in?error=session_failed`);
  }

  console.log("Auth callback successful, session established for user:", sessionData.session.user.email);

  return response;
}

