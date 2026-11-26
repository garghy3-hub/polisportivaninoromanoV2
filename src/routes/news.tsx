import { createFileRoute, Link } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'

export const Route = createFileRoute('/news')({ head: () => ({ meta: [{ title: 'News | Polisportiva Nino Romano' }, { name: 'description', content: 'Comunicati ufficiali, cronache, storie e aggiornamenti della Polisportiva Nino Romano di Milazzo.' }] }), component: NewsPage })


const editorialTopics = [
  { title: 'Comunicati ufficiali', label: 'Società', text: 'Comunicazioni, avvisi e informazioni condivise dalla Polisportiva.' },
  { title: 'Il racconto delle partite', label: 'Match report', text: 'Cronache, momenti chiave e approfondimenti, dopo la verifica dei risultati.' },
  { title: 'Voci rossoblù', label: 'Storie', text: 'Interviste, protagonisti, staff e vita quotidiana della squadra.' },
]

function NewsPage() {
  const published = localContentService.news()
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">← Torna alla home</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Dentro la stagione</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">News &<br /><span className="text-[#e53949]">aggiornamenti.</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">La voce della Nino Romano: comunicati, cronache, storie e contenuti per vivere la pallavolo anche fuori dal campo.</p>
        </header>
        {published.length === 0 ? (
          <section className="mt-14 rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-500/10 to-white/[0.02] p-7 sm:p-10" aria-live="polite">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Archivio editoriale</span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Nessun articolo pubblicato al momento.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-400">Le notizie ufficiali saranno pubblicate qui. I contenuti in bozza non vengono mostrati.</p>
          </section>
        ) : (
          <section className="mt-12 grid gap-5 md:grid-cols-2" aria-label="Articoli pubblicati">
            {published.map((article) => <article key={article.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-300">{article.category}</p>
              <h2 className="mt-3 text-xl font-bold">{article.title}</h2>
              {article.excerpt && <p className="mt-3 leading-7 text-slate-400">{article.excerpt}</p>}
              {article.publishedAt && <p className="mt-4 text-xs text-slate-500">{new Date(article.publishedAt).toLocaleDateString('it-IT')}</p>}
            </article>)}
          </section>
        )}
        <section className="mt-12 grid gap-5 md:grid-cols-3" aria-label="Tipologie di notizie">
          {editorialTopics.map((topic) => <article key={topic.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-red-300">{topic.label}</span>
            <h2 className="mt-4 text-xl font-bold">{topic.title}</h2>
            <p className="mt-3 leading-7 text-slate-400">{topic.text}</p>
          </article>)}
        </section>
      </div>
    </main>
  )
}
