import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/societa')({ component: SocietyPage })

function SocietyPage() {
  return (
    <main className="min-h-screen bg-[#090d18] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="text-sm font-semibold text-red-300 hover:text-white">← Torna alla home</Link>
        <p className="mt-16 text-sm font-semibold uppercase tracking-[0.2em] text-red-300">La società · Milazzo</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Una storia<br /><span className="text-[#e53949]">rossoblù.</span></h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">Questa sezione racconterà la Polisportiva Nino Romano: identità, percorso sportivo, persone e legame con il territorio di Milazzo.</p>
        <section className="mt-16 grid gap-5 border-t border-white/10 pt-8 sm:grid-cols-2">
          <div><h2 className="text-2xl font-bold">Identità e valori</h2><p className="mt-3 leading-7 text-slate-400">Una pagina dedicata alla missione sportiva e ai valori della società.</p></div>
          <div><h2 className="text-2xl font-bold">Organizzazione</h2><p className="mt-3 leading-7 text-slate-400">Spazio per dirigenti, staff e contatti ufficiali, da completare con dati verificati.</p></div>
        </section>
        <p className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">Contenuti in preparazione: pubblicheremo informazioni ufficiali dopo la validazione della società.</p>
      </div>
    </main>
  )
}
