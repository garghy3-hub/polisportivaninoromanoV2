import { createFileRoute, Link } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'
import { getPageHead } from '../lib/page-seo'

export const Route = createFileRoute('/squadre')({ head: () => getPageHead(localContentService.settings().teams), component: TeamsPage })

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
              .filter((team) => team.visible !== false)
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            return (
              <article key={category.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9">
                <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-200">{category.eyebrow}</span>
                <h2 className="mt-8 text-3xl font-black">{category.title}</h2>
                {categoryTeams.length === 0 ? (
                  <p className="mt-4 leading-7 text-slate-400">{category.emptyDescription}</p>
                ) : (
                  <div className="mt-6 space-y-8">
                    {categoryTeams.map((team) => {
                      const roster = (team.roster ?? []).filter((player) => player.visible !== false)
                        .slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      const staff = (team.staff ?? []).filter((member) => member.visible !== false)
                        .slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      return (
                        <section key={team.id} className="rounded-2xl border border-white/10 bg-[#0d1423] p-5 sm:p-6">
                          <div className="flex items-center gap-4">
                            {team.logoUrl && <img src={team.logoUrl} alt={team.logoAlt ?? ''} className="h-14 w-14 rounded-xl object-contain" loading="lazy" />}
                            <div>
                              <h3 className="text-xl font-bold">{team.name}</h3>
                              {team.season && <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-red-300">{team.season}</p>}
                            </div>
                          </div>
                          {team.description && <p className="mt-4 leading-7 text-slate-400">{team.description}</p>}
                          {roster.length > 0 && (
                            <section className="mt-6">
                              <div className="flex items-baseline justify-between gap-3">
                                <h4 className="font-bold">{content.rosterTitle}</h4>
                                <span className="text-xs text-slate-500">{roster.length} {content.rosterCountLabel}</span>
                              </div>
                              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                                {roster.map((player) => (
                                  <li key={player.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 p-3">
                                    {player.photoUrl && <img src={player.photoUrl} alt={player.photoAlt ?? ''} className="h-12 w-12 shrink-0 rounded-full object-cover" loading="lazy" />}
                                    <span className="min-w-0">
                                      <span className="block truncate font-semibold">{player.name}</span>
                                      {player.role && <span className="block text-xs text-slate-400">{player.role}</span>}
                                    </span>
                                    {player.jerseyNumber !== undefined && <span className="ml-auto shrink-0 text-sm font-bold text-red-300">{content.jerseyNumberLabel} {player.jerseyNumber}</span>}
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}
                          {staff.length > 0 && (
                            <section className="mt-6">
                              <h4 className="font-bold">{content.staffTitle}</h4>
                              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                                {staff.map((member) => (
                                  <li key={member.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 p-3">
                                    {member.photoUrl && <img src={member.photoUrl} alt={member.photoAlt ?? ''} className="h-12 w-12 shrink-0 rounded-full object-cover" loading="lazy" />}
                                    <span className="min-w-0">
                                      <span className="block truncate font-semibold">{member.name}</span>
                                      <span className="block text-xs text-red-300">{member.role}</span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}
                        </section>
                      )
                    })}
                  </div>
                )}
              </article>
            )
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
