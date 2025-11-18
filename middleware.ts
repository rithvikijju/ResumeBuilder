import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types/database";
import { getSupabaseKeys } from "./lib/supabase/env";

export async function middleware(request: NextRequest) {
  // Skip middleware for auth routes to avoid interference
  const pathname = request.nextUrl.pathname;
  if (pathname === "/auth/callback" || pathname === "/sign-in" || pathname === "/sign-up") {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { url, anonKey } = getSupabaseKeys();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name, options) {
        response.cookies.set({
          name,
          value: "",
          ...options,
          maxAge: 0,
        });
      },
    },
    headers: () => request.headers,
  });

  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

