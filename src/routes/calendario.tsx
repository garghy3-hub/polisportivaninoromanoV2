import { createFileRoute, Link } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'

export const Route = createFileRoute('/calendario')({ head: () => { const seo = localContentService.settings().calendar; return { meta: [{ title: seo.seoTitle }, { name: 'description', content: seo.seoDescription }] } }, component: CalendarPage })

function CalendarPage() {
  const upcoming = localContentService.upcoming()
  const results = localContentService.results()
  const content = localContentService.settings().calendar
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">{content.backLabel}</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">{content.eyebrow}</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">{content.title}<br /><span className="text-[#e53949]">{content.accent}</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">{content.description}</p>
        </header>
        {content.eventTypes.length > 0 && <section className="mt-14 grid gap-4 sm:grid-cols-3" aria-label={localContentService.settings().interface.calendarTypesLabel}>
          {content.eventTypes.map((type, index) => <div key={type} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs font-bold uppercase tracking-widest text-red-300">{String(index + 1).padStart(2, '0')}</p><h2 className="mt-3 text-lg font-bold">{type}</h2></div>)}
        </section>}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
          <h2 className="text-2xl font-bold">{content.upcomingTitle}</h2>
          {upcoming.length === 0 ? <p className="mt-4 leading-7 text-slate-400">{content.upcomingEmpty}</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2">{upcoming.map(event => <article key={event.id} className="rounded-xl border border-white/10 p-5"><p className="text-sm text-red-300">{new Date(event.dateTime).toLocaleString('it-IT')}</p><h3 className="mt-2 font-bold">{event.homeTeam} · {event.awayTeam}</h3>{event.venue && <p className="mt-2 text-sm text-slate-400">{event.venue}</p>}<p className="mt-2 text-xs text-slate-500">{content.eventStatusLabels[event.status]}</p></article>)}</div>}
        </section>
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
          <h2 className="text-2xl font-bold">{content.resultsTitle}</h2>
          {results.length === 0 ? <p className="mt-4 leading-7 text-slate-400">{content.resultsEmpty}</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2">{results.map(event => <article key={event.id} className="rounded-xl border border-white/10 p-5"><p className="text-sm text-slate-400">{new Date(event.dateTime).toLocaleDateString('it-IT')}</p><h3 className="mt-2 font-bold">{event.homeTeam} <span className="text-red-300">{event.homeScore}–{event.awayScore}</span> {event.awayTeam}</h3></article>)}</div>}
        </section>
      </div>
    </main>
  )
}
