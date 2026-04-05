import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { toSessionCookieOptions } from "./session-cookie";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(
                name,
                value,
                toSessionCookieOptions(value, options) as Parameters<
                  typeof cookieStore.set
                >[2],
              );
            });
          } catch {
            // If called from a Server Component where cookies are read-only, ignore.
            // Middleware will handle refreshing.
          }
        },
      },
    },
  );
}