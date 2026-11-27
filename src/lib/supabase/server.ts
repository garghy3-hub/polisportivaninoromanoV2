import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie, setResponseHeader } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Create a request-scoped SSR client. URL and publishable key are public
 * build-time Vite variables; no service-role/secret key is used here.
 */
export function getSupabaseServerClient(): SupabaseClient<Database> | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;

  return createServerClient<Database>(url, publishableKey, {
    auth: { flowType: "pkce", autoRefreshToken: true, detectSessionInUrl: false },
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies, headers) {
        for (const { name, value, options } of cookies) {
          setCookie(name, value, {
            ...options,
            path: options.path ?? "/",
            sameSite: options.sameSite ?? "lax",
            secure: import.meta.env.PROD,
          });
        }
        for (const [name, value] of Object.entries(headers)) {
          setResponseHeader(name, value);
        }
      },
    },
  });
}
