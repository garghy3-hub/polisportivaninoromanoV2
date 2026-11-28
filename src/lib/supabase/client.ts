/// <reference types="vite/client" />

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null = null;

/** A single browser client shares the cookie-backed Supabase session. */
export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;

  browserClient ??= createBrowserClient<Database>(url, publishableKey, {
    auth: { flowType: "pkce", autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browserClient;
}
