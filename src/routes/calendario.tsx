import { createFileRoute, Link } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'

export const Route = createFileRoute('/calendario')({ head: () => ({ meta: [{ title: 'Calendario e risultati | Polisportiva Nino Romano' }, { name: 'description', content: 'Calendario delle partite, appuntamenti e risultati ufficiali della Polisportiva Nino Romano.' }] }), component: CalendarPage })

export const Route = createFileRoute('/calendario')({ component: CalendarPage })

const eventTypes = ['Partite', 'Attività societarie', 'Eventi']

function CalendarPage() {
  const upcoming = localContentService.upcoming()
  const results = localContentService.results()
  return (
    <main className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">← Torna alla home</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">La stagione · appuntamenti</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Calendario<br /><span className="text-[#e53949]">rossoblù.</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">Partite, appuntamenti e attività della Polisportiva Nino Romano: il calendario ufficiale sarà il riferimento per seguire la stagione.</p>
        </header>
        <section className="mt-14 grid gap-4 sm:grid-cols-3" aria-label="Tipologie di appuntamenti">
          {eventTypes.map((type, index) => <div key={type} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs font-bold uppercase tracking-widest text-red-300">0{index + 1}</p><h2 className="mt-3 text-lg font-bold">{type}</h2></div>)}
        </section>
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
          <h2 className="text-2xl font-bold">Prossimi appuntamenti</h2>
          {upcoming.length === 0 ? <p className="mt-4 leading-7 text-slate-400">Non ci sono appuntamenti confermati da mostrare al momento.</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2">{upcoming.map(event => <article key={event.id} className="rounded-xl border border-white/10 p-5"><p className="text-sm text-red-300">{new Date(event.dateTime).toLocaleString('it-IT')}</p><h3 className="mt-2 font-bold">{event.homeTeam} · {event.awayTeam}</h3>{event.venue && <p className="mt-2 text-sm text-slate-400">{event.venue}</p>}<p className="mt-2 text-xs text-slate-500">{event.status}</p></article>)}</div>}
        </section>
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
          <h2 className="text-2xl font-bold">Ultimi risultati</h2>
          {results.length === 0 ? <p className="mt-4 leading-7 text-slate-400">I risultati saranno inseriti solo dopo la verifica ufficiale. Nessun risultato disponibile.</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2">{results.map(event => <article key={event.id} className="rounded-xl border border-white/10 p-5"><p className="text-sm text-slate-400">{new Date(event.dateTime).toLocaleDateString('it-IT')}</p><h3 className="mt-2 font-bold">{event.homeTeam} <span className="text-red-300">{event.homeScore}–{event.awayScore}</span> {event.awayTeam}</h3></article>)}</div>}
        </section>
      </div>
    </main>
  )
}
