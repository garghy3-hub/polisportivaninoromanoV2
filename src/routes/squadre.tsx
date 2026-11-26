import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/squadre')({ component: TeamsPage })

const teamSections = [
  { title: 'Prima squadra', eyebrow: 'Campionati · attività agonistica', description: 'La sezione dedicata alla formazione senior: rosa, staff tecnico, calendario e aggiornamenti della stagione.' },
  { title: 'Settore giovanile', eyebrow: 'Percorso · crescita · volley', description: 'Uno spazio per raccontare le categorie giovanili, le attività, gli allenatori e il percorso delle atlete.' },
]

function TeamsPage() {
  return (
    <main className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">← Torna alla home</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Il volley · Nino Romano</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Le nostre<br /><span className="text-[#e53949]">squadre.</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">Il volto sportivo della Polisportiva: persone, gruppi, percorsi e passione condivisa. Le schede verranno completate con informazioni ufficiali.</p>
        </header>
        <section className="mt-14 grid gap-6 lg:grid-cols-2" aria-label="Sezioni delle squadre">
          {teamSections.map((team, index) => (
            <article key={team.title} className="group rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-red-400/40 hover:bg-white/[0.05] sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-200">{team.eyebrow}</span>
                <span aria-hidden="true" className="text-4xl font-black text-white/10">0{index + 1}</span>
              </div>
              <h2 className="mt-8 text-3xl font-black">{team.title}</h2>
              <p className="mt-4 leading-7 text-slate-400">{team.description}</p>
              <div className="mt-8 border-t border-white/10 pt-5">
                <p className="text-sm text-slate-500">Rosa, staff e dettagli in aggiornamento.</p>
              </div>
            </article>
          ))}
        </section>
        <aside className="mt-12 rounded-2xl border border-white/10 bg-[#111827] p-6 sm:p-8">
          <h2 className="text-xl font-bold">Vuoi conoscere le attività?</h2>
          <p className="mt-3 leading-7 text-slate-400">Le informazioni sulle squadre e sulle attività societarie saranno pubblicate e aggiornate in questa sezione.</p>
          <Link to="/news" className="mt-5 inline-flex font-semibold text-red-300 hover:text-white">Segui gli aggiornamenti <span aria-hidden="true">↗</span></Link>
        </aside>
      </div>
    </main>
  )
}
