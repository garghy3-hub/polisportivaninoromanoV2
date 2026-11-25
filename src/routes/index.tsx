import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

const navigation = [
  { label: 'La società', href: '#societa' },
  { label: 'Il progetto', href: '#progetto' },
  { label: 'News & risultati', href: '#aggiornamenti' },
]

function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#090d18] text-white">
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="Polisportiva Nino Romano home">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d92738] font-black tracking-tight">NR</div>
            <div>
              <p className="text-sm font-bold tracking-wide">NINO ROMANO</p>
              <p className="text-xs text-slate-400">POLISPORTIVA · MILAZZO</p>
            </div>
          </a>
          <nav className="hidden gap-8 md:flex">
            {navigation.map((item) => <a key={item.label} href={item.href} className="text-sm text-slate-300 transition hover:text-white">{item.label}</a>)}
          </nav>
          <a href="#aggiornamenti" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#090d18] transition hover:bg-slate-200">Seguici</a>
        </div>
      </header>

      <section className="relative">
        <div className="absolute -right-36 -top-24 h-[34rem] w-[34rem] rounded-full bg-[#d92738]/20 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-32">
          <div className="relative">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d92738]/40 bg-[#d92738]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
              <span className="h-2 w-2 rounded-full bg-[#d92738]" /> Milazzo · Volley
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
              Il cuore<br />è <span className="text-[#e53949]">rossoblù.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">
              Passione, squadra e territorio. La casa digitale della Polisportiva Nino Romano, nel cuore di Milazzo.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#societa" className="rounded-full bg-[#d92738] px-6 py-3 font-semibold transition hover:bg-red-500">Scopri la società <span aria-hidden="true">↗</span></a>
              <a href="#aggiornamenti" className="rounded-full border border-white/20 px-6 py-3 font-semibold transition hover:bg-white/10">News e aggiornamenti</a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="aspect-[4/5] rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1d2940] via-[#111a2c] to-[#d92738]/30 p-6 shadow-2xl shadow-black/40">
              <div className="flex h-full flex-col justify-between rounded-[1.5rem] border border-white/10 p-7">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">Milazzo</span>
                  <span className="text-5xl font-black text-white/10">NR</span>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-300">Polisportiva</p>
                  <p className="mt-2 text-4xl font-black leading-tight sm:text-5xl">Nino<br />Romano</p>
                  <div className="mt-6 h-1.5 w-24 rounded-full bg-[#d92738]" />
                  <p className="mt-5 text-sm text-slate-300">Una squadra. Una città. Una passione.</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-[#111827] px-5 py-4 shadow-xl">
              <p className="text-xs uppercase tracking-widest text-slate-400">Identità</p>
              <p className="mt-1 font-bold">Orgoglio rossoblù</p>
            </div>
          </div>
        </div>
      </section>

      <section id="societa" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-3">
          <div><p className="text-sm font-semibold uppercase tracking-widest text-red-300">01 · Territorio</p><h2 className="mt-3 text-2xl font-bold">Milazzo, casa nostra</h2><p className="mt-3 leading-7 text-slate-400">Una realtà sportiva legata alla comunità e al territorio.</p></div>
          <div><p className="text-sm font-semibold uppercase tracking-widest text-red-300">02 · Squadra</p><h2 className="mt-3 text-2xl font-bold">Crescere insieme</h2><p className="mt-3 leading-7 text-slate-400">Lo sport come impegno condiviso, dentro e fuori dal campo.</p></div>
          <div><p className="text-sm font-semibold uppercase tracking-widest text-red-300">03 · Passione</p><h2 className="mt-3 text-2xl font-bold">Sempre rossoblù</h2><p className="mt-3 leading-7 text-slate-400">Il senso di appartenenza che accompagna ogni stagione.</p></div>
        </div>
      </section>

      <section id="progetto" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Il progetto</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Non solo pallavolo.<br />Una comunità.</h2>
          <p className="mt-6 leading-8 text-slate-300">Il sito nasce per raccontare la società, le persone, le attività e le novità con un'esperienza semplice, moderna e pensata anche per smartphone.</p>
        </div>
      </section>

      <section id="aggiornamenti" className="bg-[#d92738]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-100">News · risultati · calendario</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">La stagione, da seguire.</h2><p className="mt-3 max-w-xl text-red-100">Gli aggiornamenti sportivi saranno pubblicati qui dopo il collegamento alle fonti dati ufficiali.</p></div>
          <span className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold">Area in allestimento</span>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:justify-between">
        <p>© Polisportiva Nino Romano · Milazzo</p>
        <p>V2 · Nuovo progetto digitale</p>
      </footer>
    </main>
  )
}