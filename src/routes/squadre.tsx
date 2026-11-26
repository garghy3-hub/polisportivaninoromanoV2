import { createFileRoute, Link } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'

export const Route = createFileRoute('/squadre')({ head: () => { const seo = localContentService.settings().teams; return { meta: [{ title: seo.seoTitle }, { name: 'description', content: seo.seoDescription }] } }, component: TeamsPage })

function TeamsPage() {
  const content = localContentService.settings().teams
  const categories = content.categories.filter((item) => item.visible).slice().sort((a, b) => a.order - b.order)
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">{content.backLabel}</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">{content.eyebrow}</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">{content.title}<br /><span className="text-[#e53949]">{content.accent}</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">{content.description}</p>
        </header>
        <section className="mt-14 grid gap-6 lg:grid-cols-2" aria-label={localContentService.settings().interface.teamSectionsLabel}>
          {categories.map((category) => {
            const categoryTeams = localContentService.teamsByCategory(category.category)
            return <article key={category.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9">
              <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-200">{category.eyebrow}</span>
              <h2 className="mt-8 text-3xl font-black">{category.title}</h2>
              {categoryTeams.length === 0 ? <p className="mt-4 leading-7 text-slate-400">{category.emptyDescription}</p> : <div className="mt-5 space-y-4">{categoryTeams.map((team) => <div key={team.id} className="rounded-xl border border-white/10 p-4"><h3 className="font-bold">{team.name}</h3>{team.description && <p className="mt-2 text-slate-400">{team.description}</p>}{team.roster && team.roster.length > 0 && <p className="mt-2 text-sm text-slate-500">Atlete: {team.roster.length}</p>}</div>)}</div>}
            </article>
          })}
        </section>
        <aside className="mt-12 rounded-2xl border border-white/10 bg-[#111827] p-6 sm:p-8">
          <h2 className="text-xl font-bold">{content.asideTitle}</h2>
          <p className="mt-3 leading-7 text-slate-400">{content.asideDescription}</p>
          <a href={content.asideActionHref} className="mt-5 inline-flex font-semibold text-red-300 hover:text-white">{content.asideActionLabel}</a>
        </aside>
      </div>
    </main>
  )
}
