import '@tanstack/react-start/server-only'
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";
import type { EditorialRevision, RevisionStatus, NewsCategory } from "../content-types";
import type { EditorialActor } from "../editorial-session";
import type {
  NewsDraftContent,
  NewsEditorialRepository,
  NewsRepositoryFailureCode,
  NewsRepositoryResult,
  NewsRevisionRecord,
} from "./news-editorial-service";

type RpcError = { code?: string } | null;
type RpcClient = {
  rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: RpcError }>;
};

const statuses: readonly RevisionStatus[] = [
  "draft", "in-review", "approved", "published", "rejected", "archived",
];
const categories: readonly NewsCategory[] = [
  "official", "match-report", "interview", "youth", "club-life",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapNewsRevisionRecord(value: unknown): NewsRevisionRecord | null {
  if (!isObject(value) || !isObject(value.revision)) return null;
  const raw = value.revision;
  const articleId = raw.article_id;
  const revisionId = raw.id;
  const version = value.version;
  const status = raw.status;

  if (
    typeof articleId !== "string" || !articleId ||
    typeof revisionId !== "string" || !revisionId ||
    !Number.isInteger(version) || (version as number) < 1 ||
    typeof status !== "string" || !statuses.includes(status as RevisionStatus) ||
    typeof raw.title !== "string" ||
    typeof raw.slug !== "string" ||
    typeof raw.category !== "string" || !categories.includes(raw.category as NewsCategory) ||
    typeof raw.excerpt !== "string" ||
    typeof raw.body !== "string" ||
    typeof raw.seo_title !== "string" ||
    typeof raw.seo_description !== "string" ||
    (raw.image_url !== null && typeof raw.image_url !== "string") ||
    typeof raw.image_alt !== "string" ||
    typeof raw.created_at !== "string" ||
    typeof raw.created_by !== "string" ||
    typeof raw.updated_at !== "string" ||
    typeof raw.updated_by !== "string"
  ) return null;

  const createdAt = normalizeTimestamp(raw.created_at);
  const updatedAt = normalizeTimestamp(raw.updated_at);
  const reviewedAt = raw.reviewed_at === null ? undefined : normalizeTimestamp(raw.reviewed_at);
  const publishedAt = raw.published_at === null ? undefined : normalizeTimestamp(raw.published_at);
  if (!createdAt || !updatedAt || (raw.reviewed_at !== null && !reviewedAt) || (raw.published_at !== null && !publishedAt)) return null;

  const content: NewsDraftContent = {
    title: raw.title,
    slug: raw.slug,
    category: raw.category,
    excerpt: raw.excerpt,
    body: raw.body,
    seoTitle: raw.seo_title,
    seoDescription: raw.seo_description,
    imageUrl: typeof raw.image_url === "string" ? raw.image_url : "",
    imageAlt: raw.image_alt,
  };

  const revision: EditorialRevision<NewsDraftContent> = {
    id: revisionId,
    entityType: "article",
    entityId: articleId,
    status: status as RevisionStatus,
    content,
    createdAt,
    createdBy: raw.created_by,
    updatedAt,
    updatedBy: raw.updated_by,
    ...(typeof raw.reviewer_id === "string" ? { reviewerId: raw.reviewer_id } : {}),
    ...(reviewedAt ? { reviewedAt } : {}),
    ...(typeof raw.review_note === "string" ? { reviewNote: raw.review_note } : {}),
    ...(publishedAt ? { publishedAt } : {}),
  };

  return { revision, version: version as number };
}

function mapFailure(error: RpcError): NewsRepositoryFailureCode {
  switch (error?.code) {
    case "P0002": return "not-found";
    case "40001": return "conflict";
    case "23505": return "slug-taken";
    case "42501": return "forbidden";
    case "22023": return "invalid-transition";
    default: return "internal";
  }
}

/**
 * The repository sends only the authenticated RPC command. It never writes
 * directly to news tables; the database function derives auth.uid(), role,
 * timestamps and audit actor itself.
 */
export function createSupabaseNewsEditorialRepository(
  supabase: SupabaseClient<Database>,
): NewsEditorialRepository {
  const rpc = supabase as unknown as RpcClient;

  async function command(args: {
    action: string;
    articleId?: string;
    revisionId?: string;
    expectedVersion?: number;
    payload?: Record<string, unknown>;
  }): Promise<NewsRepositoryResult<NewsRevisionRecord>> {
    try {
      const { data, error } = await rpc.rpc("news_editorial_command", {
        p_action: args.action,
        p_article_id: args.articleId ?? null,
        p_revision_id: args.revisionId ?? null,
        p_expected_version: args.expectedVersion ?? null,
        p_payload: args.payload ?? {},
      });
      if (error) return { ok: false, code: mapFailure(error) };
      const record = mapNewsRevisionRecord(data);
      return record
        ? { ok: true, value: record }
        : { ok: false, code: "internal" };
    } catch {
      return { ok: false, code: "internal" };
    }
  }

  return {
    createDraft: ({ content, actor }) => {
      void actor;
      return command({ action: "create_draft", payload: content });
    },
    updateDraft: ({ articleId, revisionId, expectedVersion, content, actor }) => {
      void actor;
      return command({
        action: "update_draft", articleId, revisionId, expectedVersion, payload: content,
      });
    },
    submitForReview: ({ articleId, revisionId, expectedVersion, actor }) => {
      void actor;
      return command({ action: "submit_for_review", articleId, revisionId, expectedVersion });
    },
    reviewDecision: ({ articleId, revisionId, expectedVersion, decision, reviewNote, actor }) => {
      void actor;
      return command({
        action: "review_decision", articleId, revisionId, expectedVersion,
        payload: { decision, reviewNote: reviewNote ?? "" },
      });
    },
    publishApproved: ({ articleId, revisionId, expectedVersion, actor }) => {
      void actor;
      return command({ action: "publish", articleId, revisionId, expectedVersion });
    },
    unpublish: ({ articleId, revisionId, expectedVersion, actor }) => {
      void actor;
      return command({ action: "unpublish", articleId, revisionId, expectedVersion });
    },
    archivePublished: ({ articleId, revisionId, expectedVersion, actor }) => {
      void actor;
      return command({ action: "archive", articleId, revisionId, expectedVersion });
    },
    restoreArchived: ({ articleId, revisionId, expectedVersion, actor }) => {
      void actor;
      return command({ action: "restore", articleId, revisionId, expectedVersion });
    },
  };
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString() : null;
}
