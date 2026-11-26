import { createFileRoute, Link } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'

export const Route = createFileRoute('/news/$slug')({
  loader: ({ params }) => localContentService.articleBySlug(params.slug),
  head: ({ loaderData }) => {
    const settings = localContentService.settings()
    const article = loaderData
    if (!article) {
      return {
        meta: [
          { title: settings.news.notFoundTitle },
          { name: 'description', content: settings.news.notFoundDescription },
        ],
      }
    }
    const title = article.seoTitle || `${article.title} | ${settings.site.title}`
    const description = article.seoDescription || article.excerpt || settings.news.seoDescription
    const image = article.socialImageUrl || article.coverImageUrl
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        ...(image ? [{ property: 'og:image', content: image }] : []),
        ...(article.socialImageAlt || article.coverImageAlt
          ? [{ property: 'og:image:alt', content: article.socialImageAlt || article.coverImageAlt || '' }]
          : []),
      ],
    }
  },
  component: NewsArticlePage,
})

function NewsArticlePage() {
  const article = Route.useLoaderData()
  const settings = localContentService.settings()
  const content = settings.news

  if (!article) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/news" className="text-sm font-semibold text-red-300 transition hover:text-white">{content.articleBackLabel}</Link>
          <section className="mt-16 rounded-3xl border border-white/10 bg-white/[0.03] p-8" role="status">
            <h1 className="text-3xl font-black">{content.notFoundTitle}</h1>
            <p className="mt-4 leading-7 text-slate-400">{content.notFoundDescription}</p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <article className="mx-auto max-w-4xl">
        <Link to="/news" className="text-sm font-semibold text-red-300 transition hover:text-white">{content.articleBackLabel}</Link>
        <header className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">{content.categoryLabels[article.category]}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{article.title}</h1>
          {article.excerpt && <p className="mt-6 text-lg leading-8 text-slate-300">{article.excerpt}</p>}
          {article.publishedAt && (
            <p className="mt-5 text-sm text-slate-500">
              {content.publishedLabel} <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString('it-IT')}</time>
            </p>
          )}
        </header>
        {article.coverImageUrl && (
          <img
            src={article.coverImageUrl}
            alt={article.coverImageAlt || article.title}
            className="mt-10 max-h-[34rem] w-full rounded-3xl border border-white/10 object-cover"
          />
        )}
        <div className="mt-10 whitespace-pre-line text-base leading-8 text-slate-200 sm:text-lg">
          {article.body}
        </div>
      </article>
    </main>
  )
}
