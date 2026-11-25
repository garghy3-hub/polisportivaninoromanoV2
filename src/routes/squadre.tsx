import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/squadre')({ component: TeamsPage })

function TeamsPage() {
  return (
    <main className="min-h-screen bg-[#090d18] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="text-sm font-semibold text-red-300 hover:text-white">← Torna alla home</Link>
        <p className="mt-16 text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Il volley · Nino Romano</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Le nostre<br /><span className="text-[#e53949]">squadre.</span></h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">Qui troverai le formazioni, gli staff tecnici, le categorie e le informazioni sulle attività della Polisportiva.</p>
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {['Prima squadra', 'Settore giovanile'].map((name) => <article key={name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-2xl font-bold">{name}</h2><p className="mt-3 leading-7 text-slate-400">Scheda in allestimento. Rosa e dettagli saranno inseriti solo dopo conferma ufficiale.</p></article>)}
        </div>
      </div>
    </main>
  )
}
