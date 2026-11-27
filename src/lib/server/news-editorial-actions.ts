import { createServerFn } from "@tanstack/react-start";
import { NEWS_CATEGORIES } from "../content-types";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";
import { isValidNewsDraftContent } from "../news-read-repository";
import { createNewsEditorialService, type NewsDraftContent } from "./news-editorial-service";
import { createSupabaseNewsEditorialRepository } from "./supabase-news-editorial-repository";

async function withNewsService<T>(
  operation: (service: ReturnType<typeof createNewsEditorialService>, actor: NonNullable<Awaited<ReturnType<typeof getActiveEditorialActor>>>) => Promise<T>,
): Promise<T | { ok: false; code: "unauthenticated" | "internal" }> {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false, code: "unauthenticated" };
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false, code: "internal" };

  const service = createNewsEditorialService(
    createSupabaseNewsEditorialRepository(supabase),
    NEWS_CATEGORIES,
  );
  return operation(service, actor);
}

function isDraftPayload(value: unknown): value is NewsDraftContent {
  return isValidNewsDraftContent(value);
}

function isUpdatePayload(value: unknown): value is {
  articleId: string;
  revisionId: string;
  expectedVersion: number;
  content: NewsDraftContent;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  const keys = Object.keys(input).sort();
  return keys.length === 4
    && keys[0] === "articleId"
    && keys[1] === "content"
    && keys[2] === "expectedVersion"
    && keys[3] === "revisionId"
    && typeof input.articleId === "string"
    && input.articleId.length > 0
    && typeof input.revisionId === "string"
    && input.revisionId.length > 0
    && Number.isInteger(input.expectedVersion)
    && (input.expectedVersion as number) > 0
    && isDraftPayload(input.content);
}

export const newsCreateDraftFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isDraftPayload(data)) return { ok: false as const, code: "invalid" as const };
    return withNewsService((service, actor) => service.createDraft(actor, data));
  });

export const newsUpdateDraftFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isUpdatePayload(data)) return { ok: false as const, code: "invalid" as const };
    return withNewsService((service, actor) => service.updateDraft(actor, data));
  });

export const newsSubmitForReviewFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => withNewsService((service, actor) =>
    service.submitForReview(actor, data as Parameters<typeof service.submitForReview>[1])
  ));

export const newsApproveFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => withNewsService((service, actor) =>
    service.approve(actor, data as Parameters<typeof service.approve>[1])
  ));

export const newsRejectFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => withNewsService((service, actor) =>
    service.reject(actor, data as Parameters<typeof service.reject>[1])
  ));

export const newsPublishFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => withNewsService((service, actor) =>
    service.publish(actor, data as Parameters<typeof service.publish>[1])
  ));

export const newsUnpublishFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => withNewsService((service, actor) =>
    service.unpublish(actor, data as Parameters<typeof service.unpublish>[1])
  ));

export const newsArchiveFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => withNewsService((service, actor) =>
    service.archive(actor, data as Parameters<typeof service.archive>[1])
  ));

export const newsRestoreFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => withNewsService((service, actor) =>
    service.restore(actor, data as Parameters<typeof service.restore>[1])
  ));
