import { createServerFn } from "@tanstack/react-start";
import type { EditorialRole } from "../content-types";
import { getSupabaseServerClient } from "../supabase/server";

export interface AuthenticatedEditorialUser {
  id: string;
  role: EditorialRole;
}

const allowedRoles: readonly EditorialRole[] = [
  "reader",
  "editor",
  "publisher",
  "administrator",
];

async function getActiveEditorialUser(): Promise<AuthenticatedEditorialUser | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  // getClaims verifies the access token; never authorize from getSession().user.
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const userId = data.claims.sub;
  if (typeof userId !== "string" || !userId.trim()) return null;

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id, role, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (
    adminError ||
    !admin ||
    admin.user_id !== userId ||
    admin.is_active !== true ||
    !allowedRoles.includes(admin.role as EditorialRole)
  ) {
    return null;
  }

  return { id: userId, role: admin.role as EditorialRole };
}

/** Safe session projection for route guards and the admin navigation. */
export const getCurrentEditorialUserFn = createServerFn({ method: "GET" }).handler(
  async () => getActiveEditorialUser(),
);

function isLoginPayload(value: unknown): value is { email: string; password: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  return keys.length === 2
    && keys[0] === "email"
    && keys[1] === "password"
    && typeof candidate.email === "string"
    && candidate.email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)
    && typeof candidate.password === "string"
    && candidate.password.length >= 1
    && candidate.password.length <= 1024;
}

export const editorialLoginFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isLoginPayload(data)) {
      return { ok: false as const, code: "invalid-input" as const };
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) return { ok: false as const, code: "not-configured" as const };

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    if (error || !authData.user?.id) {
      return { ok: false as const, code: "invalid-credentials" as const };
    }

    // signInWithPassword returns a user authenticated by Supabase Auth.
    // Read the role from the protected allow-list, never from user metadata.
    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id, role, is_active")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (
      adminError ||
      !admin ||
      admin.user_id !== authData.user.id ||
      admin.is_active !== true ||
      !allowedRoles.includes(admin.role as EditorialRole)
    ) {
      // A valid Supabase account without an active allow-list row is not an admin.
      await supabase.auth.signOut({ scope: "local" });
      return { ok: false as const, code: "not-authorized" as const };
    }

    return {
      ok: true as const,
      user: { id: authData.user.id, role: admin.role as EditorialRole },
    };
  });

export const editorialLogoutFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const supabase = getSupabaseServerClient();
    if (supabase) await supabase.auth.signOut({ scope: "local" });
    return { ok: true as const };
  },
);
