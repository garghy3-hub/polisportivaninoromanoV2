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
  const imageUrl = content.imageUrl.trim();
  const imageAlt = content.imageAlt.trim();

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
    ...(content.seoTitle ? { seoTitle: content.seoTitle } : {}),
    ...(content.seoDescription ? { seoDescription: content.seoDescription } : {}),
    ...(imageUrl
      ? {
          coverImageUrl: imageUrl,
          coverImageAlt: imageAlt,
          socialImageUrl: imageUrl,
          socialImageAlt: imageAlt,
        }
      : {}),
  };
}
