import { createFileRoute, Link } from '@tanstack/react-router'
import { AdminNav } from '../components/AdminNav'
import { useMemo, useState } from 'react'
import { localContentService } from '../lib/content-service'
import { validateSiteSettings } from '../lib/content-validation'
import type { SiteSettings } from '../lib/content-types'

export const Route = createFileRoute('/admin/brand')({ headers: () => ({ 'Cache-Control': 'private, no-store' }), component: BrandWorkbench })

function BrandWorkbench() {
  const initial = localContentService.settings()
  const [settings, setSettings] = useState<SiteSettings>(() => JSON.parse(JSON.stringify(initial)) as SiteSettings)
  const issues = useMemo(() => validateSiteSettings(settings), [settings])
  const patchBrand = (key: keyof SiteSettings['brand'], value: string) => setSettings(current => ({
    ...current,
    brand: { ...current.brand, [key]: value },
  }))
  const patchFooter = (key: keyof SiteSettings['footer'], value: string) => setSettings(current => ({
    ...current,
    footer: { ...current.footer, [key]: value },
  }))
  const patchColorPreset = (value: SiteSettings['brand']['themePreset']) => setSettings(current => ({
    ...current,
    brand: { ...current.brand, themePreset: value },
  }))
  const safeLogo = settings.brand.logoUrl && ((settings.brand.logoUrl.startsWith('/') && !settings.brand.logoUrl.startsWith('//')) || /^https:\/\//i.test(settings.brand.logoUrl))

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <AdminNav />
        <header className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Identità visiva · workbench UI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Footer e identità visiva</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Gestisci gli elementi globali del marchio e i testi del piè di pagina, mantenendo logo, alternative testuali e preset coerenti con il sito.</p>
        </header>

        <section className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5" aria-labelledby="brand-prototype-notice">
          <h2 id="brand-prototype-notice" className="font-bold text-amber-200">Prototipo locale — nessun salvataggio</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Le modifiche sono temporanee nello stato della schermata. Non sono collegate ad autenticazione, API, revisioni o database e non cambiano il sito pubblico. Il logo viene solo visualizzato in anteprima: non viene caricato né archiviato.</p>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_.8fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Identità del marchio</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="brand-name" className="mb-2 block text-sm font-semibold">Denominazione</label><input id="brand-name" value={settings.brand.name} onChange={event => patchBrand('name', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /></div>
                <div><label htmlFor="brand-monogram" className="mb-2 block text-sm font-semibold">Monogramma</label><input id="brand-monogram" maxLength={8} value={settings.brand.monogram} onChange={event => patchBrand('monogram', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /><p className="mt-1 text-xs text-slate-500">Massimo 8 caratteri consigliati.</p></div>
                <div className="sm:col-span-2"><label htmlFor="brand-descriptor" className="mb-2 block text-sm font-semibold">Descrittore</label><input id="brand-descriptor" value={settings.brand.descriptor} onChange={event => patchBrand('descriptor', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /></div>
                <div className="sm:col-span-2"><label htmlFor="brand-aria" className="mb-2 block text-sm font-semibold">Etichetta accessibile del marchio</label><input id="brand-aria" value={settings.brand.ariaLabel} onChange={event => patchBrand('ariaLabel', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /></div>
                <div><label htmlFor="brand-logo-url" className="mb-2 block text-sm font-semibold">URL logo (HTTPS o percorso relativo)</label><input id="brand-logo-url" value={settings.brand.logoUrl ?? ''} onChange={event => patchBrand('logoUrl', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /></div>
                <div><label htmlFor="brand-logo-alt" className="mb-2 block text-sm font-semibold">Testo alternativo logo</label><input id="brand-logo-alt" value={settings.brand.logoAlt} onChange={event => patchBrand('logoAlt', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /></div>
              </div>
              <div className="mt-5"><label htmlFor="brand-preset" className="mb-2 block text-sm font-semibold">Preset cromatico</label><select id="brand-preset" value={settings.brand.themePreset} onChange={event => patchColorPreset(event.target.value as SiteSettings['brand']['themePreset'])} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm"><option value="rossoblu-classic">Rossoblù classico</option><option value="rossoblu-dark">Rossoblù scuro</option></select></div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Footer</h2>
              <p className="mt-2 text-sm text-slate-400">Testi globali già previsti dal contratto dei contenuti.</p>
              <div className="mt-5 grid gap-4">
                <div><label htmlFor="footer-copyright" className="mb-2 block text-sm font-semibold">Dicitura copyright</label><input id="footer-copyright" value={settings.footer.copyright} onChange={event => patchFooter('copyright', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /></div>
                <div><label htmlFor="footer-project" className="mb-2 block text-sm font-semibold">Etichetta progetto</label><input id="footer-project" value={settings.footer.projectLabel} onChange={event => patchFooter('projectLabel', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /></div>
              </div>
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Anteprima marchio</h2>
              <div className={`mt-5 rounded-2xl border p-6 ${settings.brand.themePreset === 'rossoblu-classic' ? 'border-red-400/30 bg-slate-950' : 'border-blue-300/20 bg-[#050914]'}`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5 text-xl font-black text-red-300">
                    {safeLogo && settings.brand.logoUrl ? <img src={settings.brand.logoUrl} alt={settings.brand.logoAlt} className="h-full w-full object-contain" /> : settings.brand.monogram}
                  </div>
                  <div className="min-w-0"><p className="text-lg font-black">{settings.brand.name}</p><p className="mt-1 text-sm text-slate-400">{settings.brand.descriptor}</p></div>
                </div>
                <p className="mt-5 text-xs text-slate-500">Etichetta accessibile: {settings.brand.ariaLabel}</p>
              </div>
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Anteprima footer</h2>
              <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-5">
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 font-black text-red-300">{settings.brand.monogram}</span><div><p className="font-bold">{settings.brand.name}</p><p className="text-xs text-slate-400">{settings.brand.descriptor}</p></div></div>
                <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-6 text-slate-400"><p>{settings.footer.copyright}</p><p>{settings.footer.projectLabel}</p></div>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Validazione impostazioni globali</h2><span className={issues.length ? 'rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200' : 'rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200'}>{issues.length ? `${issues.length} avvisi` : 'Nessun errore'}</span></div>
          {issues.length > 0 && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-amber-200">{issues.slice(0, 30).map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
          <p className="mt-4 text-xs leading-6 text-slate-500">La validazione riutilizza il controllo completo delle impostazioni del sito. Prima di un futuro salvataggio, il server dovrà ripeterla e verificare i permessi. L'URL del logo non sostituisce un flusso di upload Media Library.</p>
        </section>
      </div>
    </main>
  )
}
