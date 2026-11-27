/**
 * Maps the minimal, validated public News projection to the website view model.
 *
 * This is a pure boundary adapter: it does not fetch data, authorize requests,
 * or make unpublished content public. Callers must pass the validated result
 * of the server-side News read service.
 */
import type { NewsArticle } from "./content-types";
import {
  isValidNewsPublishedArticle,
  type NewsPublishedArticle,
} from "./news-read-repository";

export function toPublicNewsArticle(value: unknown): NewsArticle | null {
  if (!isValidNewsPublishedArticle(value)) return null;

  const article: NewsPublishedArticle = value;
  const { content } = article;
  const imageUrl = content.imageUrl.trim() || undefined;
  const imageAlt = imageUrl ? content.imageAlt : undefined;

  return {
    id: article.articleId,
    slug: content.slug,
    title: content.title,
    excerpt: content.excerpt,
    status: "published",
    category: content.category,
    body: content.body,
    createdAt: article.publishedAt,
    updatedAt: article.publishedAt,
    publishedAt: article.publishedAt,
    seoTitle: content.seoTitle || undefined,
    seoDescription: content.seoDescription || undefined,
    coverImageUrl: imageUrl,
    coverImageAlt: imageAlt,
    socialImageUrl: imageUrl,
    socialImageAlt: imageAlt,
  };
}
