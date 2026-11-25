import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/news')({ component: NewsPage })

function NewsPage() {
  return (
    <main className="min-h-screen bg-[#090d18] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="text-sm font-semibold text-red-300 hover:text-white">← Torna alla home</Link>
        <p className="mt-16 text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Dentro la stagione</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">News &<br /><span className="text-[#e53949]">aggiornamenti.</span></h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">Comunicati, notizie, risultati e appuntamenti della Polisportiva Nino Romano, in un unico spazio.</p>
        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.03] p-7">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-300">Archivio in preparazione</p>
          <h2 className="mt-3 text-2xl font-bold">Le notizie ufficiali arriveranno qui.</h2>
          <p className="mt-3 leading-7 text-slate-400">Nessun risultato o comunicato viene mostrato finché non è disponibile una fonte verificata.</p>
        </div>
      </div>
    </main>
  )
}
