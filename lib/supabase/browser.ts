import { createBrowserClient } from "@supabase/ssr";
import { toSessionCookieOptions } from "./session-cookie";

function getAllCookies() {
  if (typeof document === "undefined") return [];

  return document.cookie
    .split("; ")
    .filter(Boolean)
    .map((cookie) => {
      const index = cookie.indexOf("=");
      const rawName = index === -1 ? cookie : cookie.slice(0, index);
      const rawValue = index === -1 ? "" : cookie.slice(index + 1);

      return {
        name: decodeURIComponent(rawName),
        value: decodeURIComponent(rawValue),
      };
    });
}

function setBrowserCookie(
  name: string,
  value: string,
  options: Record<string, unknown> = {},
) {
  if (typeof document === "undefined") return;

  const safeOptions = toSessionCookieOptions(value, options);

  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
  ];

  const path =
    typeof safeOptions.path === "string" ? safeOptions.path : "/";
  parts.push(`Path=${path}`);

  if (typeof safeOptions.domain === "string") {
    parts.push(`Domain=${safeOptions.domain}`);
  }

  if (typeof safeOptions.sameSite === "string") {
    parts.push(`SameSite=${safeOptions.sameSite}`);
  }

  if (safeOptions.secure === true) {
    parts.push("Secure");
  }

  if (typeof safeOptions.maxAge === "number") {
    parts.push(`Max-Age=${safeOptions.maxAge}`);
  }

  if (safeOptions.expires instanceof Date) {
    parts.push(`Expires=${safeOptions.expires.toUTCString()}`);
  }

  document.cookie = parts.join("; ");
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return getAllCookies();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setBrowserCookie(name, value, options);
          });
        },
      },
    },
  );
}