import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";
import { createNewsReadService } from "../news-read-service";
import { createSupabaseNewsReadRepository } from "./supabase-news-read-repository";

const publicRead = createServerOnlyFn(async <T>(
  operation: (service: ReturnType<typeof createNewsReadService>) => Promise<T>,
): Promise<T | { ok: false; code: "not-configured" | "internal" }> => {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false, code: "not-configured" };
  const service = createNewsReadService(createSupabaseNewsReadRepository(supabase));
  return operation(service);
});

const editorialRead = createServerOnlyFn(async <T>(
  operation: (
    service: ReturnType<typeof createNewsReadService>,
    actor: NonNullable<Awaited<ReturnType<typeof getActiveEditorialActor>>>,
  ) => Promise<T>,
): Promise<T | { ok: false; code: "unauthenticated" | "forbidden" | "internal" }> => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false, code: "unauthenticated" };
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false, code: "internal" };
  const service = createNewsReadService(createSupabaseNewsReadRepository(supabase, actor));
  return operation(service, actor);
});

function isSlugPayload(value: unknown): value is { slug: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return Object.keys(item).length === 1
    && typeof item.slug === "string"
    && item.slug.length <= 160
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug);
}

export const newsPublicListFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => publicRead(service => service.listPublished(data)));

export const newsPublicArticleFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isSlugPayload(data)) return { ok: false as const, code: "invalid" as const, message: "Slug non valido." };
    return publicRead(service => service.getPublishedBySlug(data.slug));
  });

export const newsEditorialListFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => editorialRead((service, actor) => service.listEditorial(actor.id, data)));

export const newsRevisionDetailFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false as const, code: "invalid" as const, message: "Identificativi non validi." };
    }
    const input = data as Record<string, unknown>;
    if (Object.keys(input).length !== 2 || typeof input.articleId !== "string" || typeof input.revisionId !== "string") {
      return { ok: false as const, code: "invalid" as const, message: "Identificativi non validi." };
    }
    return editorialRead(service => service.getRevision(input.articleId as string, input.revisionId as string));
  });

export const newsRevisionHistoryFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false as const, code: "invalid" as const, message: "Identificativo non valido." };
    }
    const input = data as Record<string, unknown>;
    if (Object.keys(input).some(key => !["articleId", "pageSize", "cursor"].includes(key))
      || typeof input.articleId !== "string") {
      return { ok: false as const, code: "invalid" as const, message: "Identificativo non valido." };
    }
    const { articleId, ...query } = input;
    return editorialRead(service => service.listRevisionHistory(articleId, query));
  });

export const newsAuditFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false as const, code: "invalid" as const, message: "Identificativo non valido." };
    }
    const input = data as Record<string, unknown>;
    if (Object.keys(input).some(key => !["articleId", "pageSize", "cursor"].includes(key))
      || typeof input.articleId !== "string") {
      return { ok: false as const, code: "invalid" as const, message: "Identificativo non valido." };
    }
    return editorialRead(async (service, actor) => {
      if (actor.role !== "publisher" && actor.role !== "administrator") {
        return { ok: false as const, code: "forbidden" as const, message: "Permesso insufficiente." };
      }
      const { articleId, ...query } = input;
      return service.listAudit(articleId, query);
    });
  });
