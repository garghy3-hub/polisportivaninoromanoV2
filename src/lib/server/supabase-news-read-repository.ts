import "@tanstack/react-start/server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";
import type { EditorialRole, NewsCategory } from "../content-types";
import type {
  NewsReadItem,
  NewsReadPage,
  NewsReadRepository,
  NewsRevisionDetail,
  NewsPublishedArticle,
  ValidNewsReadQuery,
  ValidNewsPublicListQuery,
} from "../news-read-repository";
import { mapNewsRevisionRecord } from "./supabase-news-editorial-repository";

type Cursor = { timestamp: string; id: string };

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString() : null;
}

function encodeCursor(timestamp: string, id: string): string {
  return encodeURIComponent(`${timestamp}|${id}`);
}

function decodeCursor(value?: string, idPattern: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i): Cursor | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    const separator = decoded.indexOf("|");
    if (separator < 0) return null;
    const timestamp = normalizeTimestamp(decoded.slice(0, separator));
    const id = decoded.slice(separator + 1);
    if (!timestamp || !id || id.length > 128 || !idPattern.test(id)) return null;
    return { timestamp, id };
  } catch {
    return null;
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, character => `\\${character}`);
}

function mapRevisionDetail(row: unknown): NewsRevisionDetail | null {
  const mapped = mapNewsRevisionRecord({ revision: row, version: (row as { version?: unknown } | null)?.version });
  if (!mapped) return null;
  return { articleId: mapped.revision.entityId, revision: mapped.revision };
}

function mapReadItem(row: unknown): NewsReadItem | null {
  const detail = mapRevisionDetail(row);
  if (!detail) return null;
  return {
    articleId: detail.articleId,
    revisionId: detail.revision.id,
    content: detail.revision.content,
    status: detail.revision.status,
    createdAt: detail.revision.createdAt,
    updatedAt: detail.revision.updatedAt,
    creatorId: detail.revision.createdBy,
  };
}

function mapPublishedRow(row: unknown): NewsPublishedArticle | null {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const item = row as Record<string, unknown>;
  const publishedAt = normalizeTimestamp(item.published_at);
  if (
    typeof item.article_id !== "string" || !item.article_id ||
    typeof item.revision_id !== "string" || !item.revision_id ||
    !publishedAt ||
    typeof item.slug !== "string" ||
    typeof item.title !== "string" ||
    typeof item.category !== "string" ||
    typeof item.excerpt !== "string" ||
    typeof item.body !== "string" ||
    typeof item.seo_title !== "string" ||
    typeof item.seo_description !== "string" ||
    (item.image_url !== null && typeof item.image_url !== "string") ||
    typeof item.image_alt !== "string"
  ) return null;

  return {
    articleId: item.article_id,
    revisionId: item.revision_id,
    publishedAt,
    content: {
      title: item.title,
      slug: item.slug,
      category: item.category as NewsCategory,
      excerpt: item.excerpt,
      body: item.body,
      seoTitle: item.seo_title,
      seoDescription: item.seo_description,
      imageUrl: typeof item.image_url === "string" ? item.image_url : "",
      imageAlt: item.image_alt,
    },
  };
}

function pageFromRows<T extends { id: string; created_at: string }>(
  rows: T[],
  pageSize: number,
  map: (row: T) => unknown,
): NewsReadPage<unknown> {
  const visible = rows.slice(0, pageSize);
  const items = visible.map(map);
  const last = visible[visible.length - 1];
  return {
    items,
    nextCursor: rows.length > pageSize && last
      ? encodeCursor(normalizeTimestamp(last.created_at) ?? last.created_at, last.id)
      : null,
  };
}

export function createSupabaseNewsReadRepository(
  supabase: SupabaseClient<Database>,
  actor: { id: string; role: EditorialRole },
): NewsReadRepository {
  const canReadAllEditorial = actor.role === "publisher" || actor.role === "administrator";

  async function canReadArticle(articleId: string): Promise<boolean> {
    if (canReadAllEditorial) return true;
    const { data, error } = await supabase
      .from("news_articles")
      .select("created_by")
      .eq("id", articleId)
      .maybeSingle();
    return !error && data?.created_by === actor.id;
  }

  return {
    async listEditorial(actorId: string, query: ValidNewsReadQuery) {
      if (actorId !== actor.id) return { items: [], nextCursor: null };
      if (!canReadAllEditorial && query.creatorId && query.creatorId !== actor.id) {
        return { items: [], nextCursor: null };
      }
      let request = supabase
        .from("news_revisions")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .limit(query.pageSize + 1);

      if (!canReadAllEditorial) request = request.eq("created_by", actor.id);
      else if (query.creatorId) request = request.eq("created_by", query.creatorId);
      if (query.status) request = request.eq("status", query.status);
      if (query.category) request = request.eq("category", query.category);
      if (query.search) request = request.ilike("title", `%${escapeLike(query.search)}%`);
      if (query.createdAfter) request = request.gte("created_at", query.createdAfter);
      if (query.createdBefore) request = request.lte("created_at", query.createdBefore);

      const cursor = decodeCursor(query.cursor);
      if (query.cursor && !cursor) return { items: [], nextCursor: null };
      if (cursor) request = request.or(`created_at.lt.${cursor.timestamp},and(created_at.eq.${cursor.timestamp},id.gt.${cursor.id})`);

      const { data, error } = await request;
      if (error || !data) throw new Error("news_read_failed");
      const page = pageFromRows(data, query.pageSize, row => mapReadItem(row));
      return page as NewsReadPage<NewsReadItem>;
    },

    async getRevision(articleId: string, revisionId: string) {
      if (!(await canReadArticle(articleId))) return null;
      const { data, error } = await supabase
        .from("news_revisions")
        .select("*")
        .eq("article_id", articleId)
        .eq("id", revisionId)
        .maybeSingle();
      if (error) throw new Error("news_read_failed");
      if (!data) return null;
      return mapRevisionDetail(data);
    },

    async listRevisionHistory(articleId: string, query: Pick<ValidNewsReadQuery, "pageSize" | "cursor">) {
      if (!(await canReadArticle(articleId))) return { items: [], nextCursor: null };
      let request = supabase
        .from("news_revisions")
        .select("*")
        .eq("article_id", articleId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .limit(query.pageSize + 1);
      const cursor = decodeCursor(query.cursor);
      if (query.cursor && !cursor) return { items: [], nextCursor: null };
      if (cursor) request = request.or(`created_at.lt.${cursor.timestamp},and(created_at.eq.${cursor.timestamp},id.gt.${cursor.id})`);
      const { data, error } = await request;
      if (error || !data) throw new Error("news_read_failed");
      const page = pageFromRows(data, query.pageSize, row => mapRevisionDetail(row));
      return page as NewsReadPage<NewsRevisionDetail>;
    },

    async listAudit(articleId: string, query: Pick<ValidNewsReadQuery, "pageSize" | "cursor">) {
      if (!canReadAllEditorial) return { items: [], nextCursor: null };
      let request = supabase
        .from("editorial_audit_log")
        .select("*")
        .eq("entity_type", "news-article")
        .eq("entity_id", articleId)
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(query.pageSize + 1);
      const cursor = decodeCursor(query.cursor, /^\\d{1,20}$/);
      if (query.cursor && !cursor) return { items: [], nextCursor: null };
      if (cursor) request = request.or(`occurred_at.lt.${cursor.timestamp},and(occurred_at.eq.${cursor.timestamp},id.lt.${cursor.id})`);
      const { data, error } = await request;
      if (error || !data) throw new Error("news_read_failed");
      const visible = data.slice(0, query.pageSize);
      const last = visible[visible.length - 1];
      return {
        items: visible,
        nextCursor: data.length > query.pageSize && last
          ? encodeCursor(normalizeTimestamp(last.occurred_at) ?? last.occurred_at, String(last.id))
          : null,
      };
    },

    async listPublished(query: ValidNewsPublicListQuery) {
      let request = supabase
        .from("news_public_articles")
        .select("*")
        .order("published_at", { ascending: false })
        .order("article_id", { ascending: true })
        .limit(query.pageSize + 1);
      if (query.category) request = request.eq("category", query.category);
      if (query.search) request = request.ilike("title", `%${escapeLike(query.search)}%`);
      const cursor = decodeCursor(query.cursor);
      if (query.cursor && !cursor) return { items: [], nextCursor: null };
      if (cursor) request = request.or(`published_at.lt.${cursor.timestamp},and(published_at.eq.${cursor.timestamp},article_id.gt.${cursor.id})`);
      const { data, error } = await request;
      if (error || !data) throw new Error("news_read_failed");
      const visible = data.slice(0, query.pageSize);
      const items = visible.map(mapPublishedRow);
      if (items.some(item => item === null)) throw new Error("news_projection_invalid");
      const last = visible[visible.length - 1];
      return {
        items: items.filter((item): item is NewsPublishedArticle => item !== null),
        nextCursor: data.length > query.pageSize && last
          ? encodeCursor(normalizeTimestamp(last.published_at) ?? last.published_at ?? "", last.article_id ?? "")
          : null,
      };
    },

    async getPublishedBySlug(slug: string) {
      const { data, error } = await supabase
        .from("news_public_articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error("news_read_failed");
      if (!data) return null;
      return mapPublishedRow(data);
    },
  };
}
