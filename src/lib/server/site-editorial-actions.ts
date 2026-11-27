import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { validateClubProfile, validateSiteSettings } from "../content-validation";
import type { ClubProfile, SiteSettings } from "../content-types";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";

export type SiteEditorialResource = "site-settings" | "club-profile";
export type SiteEditorialAction = "submit" | "approve" | "reject" | "publish" | "unpublish";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  const allowed = [...expected].sort();
  return keys.length === allowed.length && keys.every((key, index) => key === allowed[index]);
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function isResource(value: unknown): value is SiteEditorialResource {
  return value === "site-settings" || value === "club-profile";
}

function validatePayload(resource: SiteEditorialResource, payload: unknown): payload is SiteSettings | ClubProfile {
  if (!isRecord(payload)) return false;
  let serialized: string;
  try {
    serialized = JSON.stringify(payload);
  } catch {
    return false;
  }
  if (new TextEncoder().encode(serialized).byteLength > 262144) return false;
  return resource === "site-settings"
    ? validateSiteSettings(payload as unknown as SiteSettings).length === 0
    : validateClubProfile(payload as unknown as ClubProfile).length === 0;
}

const saveDraft = createServerOnlyFn(async (request: {
  resource: SiteEditorialResource;
  expectedUpdatedAt: string | null;
  payload: SiteSettings | ClubProfile;
}) => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (!["editor", "publisher", "administrator"].includes(actor.role)) {
    return { ok: false as const, code: "forbidden" as const };
  }
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };

  const rpc = supabase as unknown as {
    rpc(name: string, args: Record<string, unknown>): Promise<{
      data: unknown;
      error: { code?: string } | null;
    }>;
  };
  const { data, error } = await rpc.rpc("site_editorial_command", {
    p_resource: request.resource,
    p_action: "save_draft",
    p_expected_updated_at: request.expectedUpdatedAt,
    p_payload: request.payload,
    p_note: "",
  });
  if (error || !isRecord(data)) return { ok: false as const, code: "internal" as const };
  if (data.ok === true && typeof data.updatedAt === "string" && data.resource === request.resource) {
    return { ok: true as const, resource: request.resource, updatedAt: data.updatedAt };
  }
  const allowed = ["forbidden", "invalid_resource", "invalid_payload", "not_editable", "conflict"];
  return {
    ok: false as const,
    code: typeof data.code === "string" && allowed.includes(data.code)
      ? data.code as typeof allowed[number]
      : "internal" as const,
  };
});

export const saveSiteEditorialDraftFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isRecord(data) || !hasExactKeys(data, ["resource", "expectedUpdatedAt", "payload"])
      || !isResource(data.resource)
      || !(data.expectedUpdatedAt === null || isTimestamp(data.expectedUpdatedAt))
      || !validatePayload(data.resource, data.payload)) {
      return { ok: false as const, code: "invalid" as const };
    }
    return saveDraft({
      resource: data.resource,
      expectedUpdatedAt: data.expectedUpdatedAt,
      payload: data.payload,
    });
  });

const runWorkflow = createServerOnlyFn(async (request: {
  resource: SiteEditorialResource;
  action: SiteEditorialAction;
  expectedUpdatedAt: string;
  note: string;
}) => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (!["editor", "publisher", "administrator"].includes(actor.role)) {
    return { ok: false as const, code: "forbidden" as const };
  }
  if (["approve", "reject", "publish", "unpublish"].includes(request.action)
    && !["publisher", "administrator"].includes(actor.role)) {
    return { ok: false as const, code: "forbidden" as const };
  }
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };

  const rpc = supabase as unknown as {
    rpc(name: string, args: Record<string, unknown>): Promise<{
      data: unknown;
      error: { code?: string } | null;
    }>;
  };
  const { data, error } = await rpc.rpc("site_editorial_command", {
    p_resource: request.resource,
    p_action: request.action,
    p_expected_updated_at: request.expectedUpdatedAt,
    p_payload: null,
    p_note: request.note,
  });
  if (error || !isRecord(data)) return { ok: false as const, code: "internal" as const };
  if (data.ok === true && typeof data.updatedAt === "string"
    && data.resource === request.resource && typeof data.editorialStatus === "string") {
    return {
      ok: true as const,
      resource: request.resource,
      updatedAt: data.updatedAt,
      editorialStatus: data.editorialStatus,
    };
  }
  const allowed = ["forbidden", "invalid_resource", "invalid_request", "invalid_note",
    "not_found", "conflict", "invalid_transition", "separation_of_duties"];
  return {
    ok: false as const,
    code: typeof data.code === "string" && allowed.includes(data.code)
      ? data.code as typeof allowed[number]
      : "internal" as const,
  };
});

export const siteEditorialWorkflowFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isRecord(data) || !hasExactKeys(data, ["resource", "action", "expectedUpdatedAt", "note"])
      || !isResource(data.resource)
      || !["submit", "approve", "reject", "publish", "unpublish"].includes(data.action as string)
      || !isTimestamp(data.expectedUpdatedAt)
      || typeof data.note !== "string" || data.note.length > 1000
      || (data.action === "reject" ? data.note.trim().length === 0 : data.note !== "")) {
      return { ok: false as const, code: "invalid" as const };
    }
    return runWorkflow({
      resource: data.resource,
      action: data.action as SiteEditorialAction,
      expectedUpdatedAt: data.expectedUpdatedAt,
      note: data.note,
    });
  });

const readDraft = createServerOnlyFn(async (resource: SiteEditorialResource) => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (!["editor", "publisher", "administrator"].includes(actor.role)) {
    return { ok: false as const, code: "forbidden" as const };
  }
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };

  const table = resource === "site-settings" ? "site_settings" : "club_profile";
  const { data, error } = await supabase.from(table)
    .select("draft_content, updated_at, editorial_status, is_published")
    .eq("id", "main")
    .maybeSingle();
  if (error) return { ok: false as const, code: "internal" as const };
  if (!data) return { ok: true as const, resource, exists: false as const };
  return {
    ok: true as const,
    resource,
    exists: true as const,
    payload: data.draft_content,
    updatedAt: data.updated_at,
    editorialStatus: data.editorial_status,
    isPublished: data.is_published,
  };
});

export const getSiteEditorialDraftFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isRecord(data) || !hasExactKeys(data, ["resource"]) || !isResource(data.resource)) {
      return { ok: false as const, code: "invalid" as const };
    }
    return readDraft(data.resource);
  });
