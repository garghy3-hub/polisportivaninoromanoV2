import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/calendario')({ component: CalendarPage })

function CalendarPage() {
  return (
    <main className="min-h-screen bg-[#090d18] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="text-sm font-semibold text-red-300 hover:text-white">← Torna alla home</Link>
        <p className="mt-16 text-sm font-semibold uppercase tracking-[0.2em] text-red-300">La stagione · appuntamenti</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Calendario<br /><span className="text-[#e53949]">rossoblù.</span></h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">Un punto di riferimento per partite, appuntamenti e attività della Polisportiva Nino Romano.</p>
        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.03] p-7">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-300">Calendario in preparazione</p>
          <h2 className="mt-3 text-2xl font-bold">Gli appuntamenti ufficiali saranno pubblicati qui.</h2>
          <p className="mt-3 leading-7 text-slate-400">Date, orari e sedi saranno inseriti solo dopo verifica delle comunicazioni ufficiali.</p>
        </div>
      </div>
    </main>
  )
}
