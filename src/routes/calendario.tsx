import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/calendario')({ component: CalendarPage })

const eventTypes = ['Partite', 'Attività societarie', 'Eventi']

function CalendarPage() {
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-sm font-semibold uppercase tracking-widest text-red-300">Calendario ufficiale</p><h2 className="mt-3 text-2xl font-bold sm:text-3xl">Gli appuntamenti saranno pubblicati qui.</h2></div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">In preparazione</span>
          </div>
          <p className="mt-4 max-w-2xl leading-7 text-slate-400">La struttura è pronta per riportare date, orari, avversarie, sede e aggiornamenti. I dati verranno inseriti solo dopo conferma delle fonti ufficiali.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['Data e ora', 'Squadre', 'Impianto', 'Aggiornamenti'].map((field) => <div key={field} className="rounded-xl border border-white/10 bg-[#090d18]/60 px-4 py-3"><span className="text-sm text-slate-400">{field}</span></div>)}
          </div>
        </section>
      </div>
    </main>
  )
}
