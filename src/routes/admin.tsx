import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getCurrentEditorialUserFn } from '../lib/server/editorial-auth'
import { AdminNav } from '../components/AdminNav'

export const Route = createFileRoute('/admin')({
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  beforeLoad: async () => {
    const user = await getCurrentEditorialUserFn()
    if (!user) throw redirect({ to: '/admin/login' })
  },
  component: AdminOverview,
})

const areas = [
  { title: 'News', description: 'Editor articolo e archivio locale multi-bozza.', status: 'Prototipo disponibile', icon: '✍️', href: '/admin/news' },
  { title: 'Squadre e roster', description: 'Editor prototipo per schede squadra, atlete, staff e anteprima.', status: 'Prototipo disponibile', icon: '🏐', href: '/admin/teams' },
  { title: 'Calendario e risultati', description: 'Editor prototipo per appuntamenti, partite, stati e punteggi.', status: 'Prototipo disponibile', icon: '📅', href: '/admin/calendar' },
  { title: 'Pagine e homepage', description: 'Editor prototipo per testi, sezioni, CTA, menu e SEO.', status: 'Prototipo disponibile', icon: '🧩', href: '/admin/pages' },
  { title: 'Media library', description: 'Libreria immagini: struttura e regole upload definite.', status: 'Struttura disponibile', icon: '🖼️', href: '/admin/media' },
  { title: 'Footer e identità visiva', description: 'Workbench per marchio, logo, preset cromatico e testi footer.', status: 'Prototipo disponibile', icon: '🎨', href: '/admin/brand' },
  { title: 'Società e contatti', description: 'Editor prototipo per profilo, recapiti, social, persone, sponsor e partner.', status: 'Prototipo disponibile', icon: '🏛️', href: '/admin/society' },
  { title: 'Utenti e audit', description: 'Ruoli, autorizzazioni e registro delle modifiche.', status: 'Pianificata', icon: '🔐' },
]

function AdminOverview() {
  return (
    <main id="main-content" className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8" tabIndex={-1}>
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 hover:text-white">← Torna al sito</Link>
        <header className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Area amministrativa · V2</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Content management</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Area editoriale riservata. L'accesso viene verificato sul server tramite Supabase Auth e ruolo attivo.</p>
        </header>
        <AdminNav />

        <section className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 sm:p-7" aria-labelledby="prototype-notice">
          <h2 id="prototype-notice" className="font-bold text-amber-200">Accesso protetto · moduli ancora in modalità prototipo</h2>
          <p className="mt-2 leading-7 text-slate-300">Il flusso di autenticazione è implementato, ma richiede la configurazione delle variabili pubbliche Supabase e almeno un account attivo in admin_users. Gli editor dei contenuti non sono ancora collegati al database: le bozze esistenti restano locali al browser.</p>
        </section>

        <div className="mt-5 flex flex-wrap gap-3"><Link to="/admin/news-library" className="rounded-xl bg-red-600 px-4 py-2 font-semibold">Apri archivio bozze News</Link><Link to="/admin/news" className="rounded-xl border border-white/20 px-4 py-2 font-semibold">Scrivi una News</Link></div>\n\n        <section className="mt-10" aria-labelledby="content-areas">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h2 id="content-areas" className="text-2xl font-bold">Moduli editoriali</h2><p className="mt-2 text-slate-400">Obiettivo: rendere modificabile dal pannello ogni elemento del sito.</p></div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">8 aree previste</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {areas.map((area) => <article key={area.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-red-400/30">
              <div className="flex items-start justify-between gap-4"><span className="text-2xl" aria-hidden="true">{area.icon}</span><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">{area.status}</span></div>
              <h3 className="mt-4 text-xl font-bold">{area.title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{area.description}</p>
              {area.href && <Link to={area.href} className="mt-5 inline-flex font-semibold text-red-300 underline decoration-red-300/40 underline-offset-4 hover:text-white">Apri modulo →</Link>}
            </article>)}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-xl font-bold">Flusso editoriale previsto</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['Bozza: editor crea e modifica', 'Revisione: invio al publisher', 'Approvazione: controllo e preview', 'Pubblicazione: contenuto live'].map((step, index) => <li key={step} className="rounded-xl border border-white/10 p-4"><span className="text-sm font-bold text-red-300">0{index + 1}</span><p className="mt-2 font-semibold">{step}</p></li>)}
          </ol>
          <p className="mt-5 text-sm leading-6 text-slate-500">Le autorizzazioni dovranno essere verificate lato server, non affidate a controlli dell'interfaccia.</p>
        </section>
      </div>
    </main>
  )
}
