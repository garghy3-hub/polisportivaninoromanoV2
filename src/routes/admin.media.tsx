import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/media')({ component: MediaLibraryWorkbench })

const acceptedFormats = ['JPEG', 'PNG', 'WebP', 'AVIF']

function MediaLibraryWorkbench() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <header className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Media library · workbench UI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Libreria media</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Un unico archivio per le immagini utilizzate in news, squadre, roster, staff, sponsor e pagine istituzionali.</p>
        </header>

        <section className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 sm:p-6" aria-labelledby="media-status">
          <h2 id="media-status" className="font-bold text-amber-200">Struttura pronta, caricamento non ancora attivo</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-300">Questa schermata non carica, conserva o pubblica file. Non è collegata a uno storage e non mostra immagini dimostrative. L'archivio resterà vuoto finché non saranno disponibili autenticazione, autorizzazioni server e servizio di archiviazione.</p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Regole tecniche per i file">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Formati ammessi</p>
            <p className="mt-2 text-xl font-bold">4 formati</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{acceptedFormats.join(' · ')}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Dimensione massima</p>
            <p className="mt-2 text-xl font-bold">10 MiB</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Il limite dovrà essere verificato anche dal server.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Accessibilità</p>
            <p className="mt-2 text-xl font-bold">Alt text</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Descrizione obbligatoria per immagini informative.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Sicurezza</p>
            <p className="mt-2 text-xl font-bold">Controllo server</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Identità, URL e chiave storage assegnati dal server.</p>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8" aria-labelledby="library-empty">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="library-empty" className="text-2xl font-bold">Archivio immagini</h2>
              <p className="mt-2 text-sm text-slate-400">Stato attuale: nessun archivio collegato</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Non operativo</span>
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-slate-950/60 px-5 py-12 text-center">
            <span className="text-4xl" aria-hidden="true">🖼️</span>
            <h3 className="mt-4 text-lg font-bold">Nessun file disponibile</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-400">Quando sarà attivato il servizio media, qui compariranno ricerca, filtri, anteprime, metadati e collegamenti agli elementi del sito che utilizzano ciascun asset.</p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-bold">Metadati modificabili</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li><span className="font-semibold text-white">Testo alternativo:</span> descrizione accessibile dell'immagine.</li>
              <li><span className="font-semibold text-white">Didascalia:</span> testo editoriale associato al file.</li>
              <li><span className="font-semibold text-white">Contesto d'uso:</span> news, squadra, atleta, staff, sponsor o impostazioni del sito.</li>
              <li><span className="font-semibold text-white">Stato:</span> attivo, archiviato o in sostituzione.</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-bold">Prossimi requisiti tecnici</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Verifica del formato reale leggendo i byte, non fidandosi del MIME dichiarato dal browser.</li>
              <li>Generazione server-side di chiavi e URL; nessun percorso di storage scelto dall'editor.</li>
              <li>Controllo dei riferimenti prima di sostituire o archiviare un file.</li>
              <li>Upload con stato, errori recuperabili e audit dell'operazione.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  )
}
