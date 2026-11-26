import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/societa')({ head: () => ({ meta: [{ title: 'La società | Polisportiva Nino Romano' }, { name: 'description', content: 'Identità, valori, organizzazione e legame con Milazzo della Polisportiva Nino Romano.' }] }), component: SocietyPage })

const pillars = [
  { title: 'Identità e valori', text: 'Una sezione per raccontare i principi, la visione e il progetto sportivo della Polisportiva.' },
  { title: 'Persone e organizzazione', text: 'Dirigenti, staff, collaboratori e ruoli societari, con nomi e informazioni da validare.' },
  { title: 'Il legame con Milazzo', text: 'Il territorio, la comunità e il contesto in cui la società vive e svolge le proprie attività.' },
  { title: 'Contatti ufficiali', text: 'Un punto di riferimento per richieste, informazioni e comunicazioni verso la società.' },
]

function SocietyPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">← Torna alla home</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">La società · Milazzo</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Una storia<br /><span className="text-[#e53949]">rossoblù.</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">La pagina dedicata alla Polisportiva Nino Romano: identità, progetto sportivo, persone e legame con il territorio. I contenuti saranno completati con informazioni verificate.</p>
        </header>
        <section className="mt-14 grid gap-5 sm:grid-cols-2" aria-label="Informazioni societarie">
          {pillars.map((pillar, index) => <article key={pillar.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"><span className="text-xs font-bold uppercase tracking-widest text-red-300">0{index + 1}</span><h2 className="mt-4 text-2xl font-bold">{pillar.title}</h2><p className="mt-3 leading-7 text-slate-400">{pillar.text}</p></article>)}
        </section>
        <aside className="mt-12 rounded-2xl border border-white/10 bg-[#111827] p-6 sm:p-8">
          <h2 className="text-xl font-bold">La pagina è in fase di completamento</h2>
          <p className="mt-3 leading-7 text-slate-400">La struttura è pronta per accogliere storia, organigramma, recapiti e informazioni istituzionali. I dettagli saranno pubblicati solo dopo conferma.</p>
        </aside>
      </div>
    </main>
  )
}
