import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { toSessionCookieOptions } from "@/lib/supabase/session-cookie";

export async function middleware(request: NextRequest) {
  // 1) Refresh session cookies if needed
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Routes
  const isProtectedRoute =
    pathname.startsWith("/chat") || pathname.startsWith("/settings");

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  // If it's neither protected nor auth-related, do nothing
  if (!isProtectedRoute && !isAuthRoute) return response;

  // 2) Check if the user is logged in
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              toSessionCookieOptions(value, options) as Parameters<
                typeof response.cookies.set
              >[2],
            );
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // 3) If not logged in, redirect away from protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 4) If logged in, redirect away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/chat";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};