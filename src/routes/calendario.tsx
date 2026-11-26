import { createFileRoute, Link } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'
import { getPageHead } from '../lib/page-seo'

export const Route = createFileRoute('/calendario')({ head: () => getPageHead(localContentService.settings().calendar), component: CalendarPage })

function CalendarPage() {
  const upcoming = localContentService.upcoming()
  const results = localContentService.results()
  const content = localContentService.settings().calendar
  const formatDate = (value: string, withTime = true) => new Date(value).toLocaleString('it-IT', withTime
    ? { dateStyle: 'full', timeStyle: 'short' }
    : { dateStyle: 'medium' })

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">{content.backLabel}</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">{content.eyebrow}</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">{content.title}<br /><span className="text-[#e53949]">{content.accent}</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">{content.description}</p>
        </header>
        {content.eventTypes.length > 0 && (
          <section className="mt-14 grid gap-4 sm:grid-cols-3" aria-label={localContentService.settings().interface.calendarTypesLabel}>
            {content.eventTypes.map((type, index) => (
              <div key={type} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-red-300">{String(index + 1).padStart(2, '0')}</p>
                <h2 className="mt-3 text-lg font-bold">{type}</h2>
              </div>
            ))}
          </section>
        )}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
          <h2 className="text-2xl font-bold">{content.upcomingTitle}</h2>
          {upcoming.length === 0 ? (
            <p className="mt-4 leading-7 text-slate-400">{content.upcomingEmpty}</p>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {upcoming.map((event) => (
                <article key={event.id} className="rounded-2xl border border-white/10 bg-[#0d1423] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-red-300">{formatDate(event.dateTime)}</p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{content.eventStatusLabels[event.status]}</span>
                  </div>
                  {event.type && <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{event.type}</p>}
                  <h3 className="mt-3 text-xl font-black">{event.homeTeam} <span className="text-red-300">·</span> {event.awayTeam}</h3>
                  <dl className="mt-4 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                    {event.season && <div><dt className="inline">{content.seasonLabel}: </dt><dd className="inline text-slate-200">{event.season}</dd></div>}
                    {event.competition && <div><dt className="inline">{content.competitionLabel}: </dt><dd className="inline text-slate-200">{event.competition}</dd></div>}
                    {event.round && <div><dt className="inline">{content.roundLabel}: </dt><dd className="inline text-slate-200">{event.round}</dd></div>}
                    {event.venue && <div><dt className="inline">{content.venueLabel}: </dt><dd className="inline text-slate-200">{event.venue}</dd></div>}
                  </dl>
                  {event.notes && <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-slate-400"><span className="font-semibold text-slate-300">{content.notesLabel}: </span>{event.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
          <h2 className="text-2xl font-bold">{content.resultsTitle}</h2>
          {results.length === 0 ? (
            <p className="mt-4 leading-7 text-slate-400">{content.resultsEmpty}</p>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {results.map((event) => (
                <article key={event.id} className="rounded-2xl border border-white/10 bg-[#0d1423] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-slate-400">{formatDate(event.dateTime, false)}</p>
                    {event.outcome && <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200">{content.outcomeLabels[event.outcome]}</span>}
                  </div>
                  {event.type && <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{event.type}</p>}
                  <h3 className="mt-3 text-lg font-bold">{event.homeTeam} <span className="text-2xl font-black text-red-300">{event.homeScore}–{event.awayScore}</span> {event.awayTeam}</h3>
                  <dl className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                    {event.season && <div><dt className="inline">{content.seasonLabel}: </dt><dd className="inline text-slate-200">{event.season}</dd></div>}
                    {event.competition && <div><dt className="inline">{content.competitionLabel}: </dt><dd className="inline text-slate-200">{event.competition}</dd></div>}
                    {event.round && <div><dt className="inline">{content.roundLabel}: </dt><dd className="inline text-slate-200">{event.round}</dd></div>}
                    {event.venue && <div><dt className="inline">{content.venueLabel}: </dt><dd className="inline text-slate-200">{event.venue}</dd></div>}
                  </dl>
                  {event.notes && <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-slate-400">{event.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
