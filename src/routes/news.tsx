import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/news')({ component: NewsPage })

const editorialTopics = [
  { title: 'Comunicati ufficiali', label: 'Società', text: 'Comunicazioni, avvisi e informazioni condivise dalla Polisportiva.' },
  { title: 'Il racconto delle partite', label: 'Match report', text: 'Cronache, momenti chiave e approfondimenti, dopo la verifica dei risultati.' },
  { title: 'Voci rossoblù', label: 'Storie', text: 'Interviste, protagonisti, staff e vita quotidiana della squadra.' },
]

function NewsPage() {
  return (
    <main className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">← Torna alla home</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Dentro la stagione</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">News &<br /><span className="text-[#e53949]">aggiornamenti.</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">La voce della Nino Romano: comunicati, cronache, storie e contenuti per vivere la pallavolo anche fuori dal campo.</p>
        </header>
        <section className="mt-14 rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-500/10 to-white/[0.02] p-7 sm:p-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Archivio editoriale</span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Le pubblicazioni ufficiali troveranno spazio qui.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-400">Stiamo preparando la struttura per articoli, immagini, date, categorie e collegamenti alle partite. Nessun contenuto sportivo viene inventato.</p>
        </section>
        <section className="mt-12 grid gap-5 md:grid-cols-3" aria-label="Tipologie di notizie">
          {editorialTopics.map((topic) => (
            <article key={topic.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-red-300">{topic.label}</span>
              <h2 className="mt-4 text-xl font-bold">{topic.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{topic.text}</p>
            </article>
          ))}
        </section>
        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold">Seguici e condividi la passione</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-400">Le novità saranno raccolte nel sito per rendere più semplice ritrovare comunicati e contenuti della società.</p>
        </section>
      </div>
    </main>
  )
}
