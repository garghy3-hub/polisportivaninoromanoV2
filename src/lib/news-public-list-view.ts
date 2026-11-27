/**
 * Maps a bounded public News page to the website list view model.
 * Input must come from the validated server-side News read service.
 */
import type { NewsArticle } from "./content-types";
import {
  isValidNewsReadPageEnvelope,
  NEWS_READ_PAGE_SIZE_MAX,
  type NewsReadPage,
} from "./news-read-repository";
import { toPublicNewsArticle } from "./news-public-view";

export interface PublicNewsArticlePage {
  items: NewsArticle[];
  nextCursor: string | null;
}

export function toPublicNewsArticlePage(value: unknown): PublicNewsArticlePage | null {
  if (!isValidNewsReadPageEnvelope(value, NEWS_READ_PAGE_SIZE_MAX)) return null;

  const page = value as NewsReadPage<unknown>;
  const items: NewsArticle[] = [];
  const articleIds = new Set<string>();
  const slugs = new Set<string>();

  for (const projection of page.items) {
    const article = toPublicNewsArticle(projection);
    if (!article) return null;
    if (articleIds.has(article.id) || slugs.has(article.slug)) return null;
    articleIds.add(article.id);
    slugs.add(article.slug);
    items.push(article);
  }

  return { items, nextCursor: page.nextCursor };
}
