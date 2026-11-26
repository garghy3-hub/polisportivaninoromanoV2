import { createFileRoute, Link } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'

export const Route = createFileRoute('/societa')({ head: () => { const seo = localContentService.settings().society; return { meta: [{ title: seo.seoTitle }, { name: 'description', content: seo.seoDescription }] } }, component: SocietyPage })

function SocietyPage() {
  const content = localContentService.settings().society
  const pillars = content.pillars.filter((pillar) => pillar.visible).slice().sort((a, b) => a.order - b.order)
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">{content.backLabel}</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">{content.eyebrow}</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">{content.title}<br /><span className="text-[#e53949]">{content.accent}</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">{content.description}</p>
        </header>
        {pillars.length > 0 && <section className="mt-14 grid gap-5 sm:grid-cols-2" aria-label={localContentService.settings().interface.societyInformationLabel}>
          {pillars.map((pillar, index) => <article key={pillar.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"><span className="text-xs font-bold uppercase tracking-widest text-red-300">{String(index + 1).padStart(2, '0')}</span><h2 className="mt-4 text-2xl font-bold">{pillar.title}</h2><p className="mt-3 leading-7 text-slate-400">{pillar.description}</p></article>)}
        </section>}
        <aside className="mt-12 rounded-2xl border border-white/10 bg-[#111827] p-6 sm:p-8">
          <h2 className="text-xl font-bold">{content.asideTitle}</h2>
          <p className="mt-3 leading-7 text-slate-400">{content.asideDescription}</p>
        </aside>
      </div>
    </main>
  )
}
