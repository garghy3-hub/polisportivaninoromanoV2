import { createFileRoute, Link } from '@tanstack/react-router'
import { AdminNav } from '../components/AdminNav'
import { useMemo, useState } from 'react'
import { localContentService } from '../lib/content-service'
import { validateSiteSettings } from '../lib/content-validation'
import type { HomeFeature, HomePageContent, SiteSettings, StandardPageContent } from '../lib/content-types'

export const Route = createFileRoute('/admin/pages')({ component: PagesWorkbench })

type HomeTextKey = Exclude<keyof HomePageContent, 'features'>
const homeFields: { key: HomeTextKey; label: string; multiline?: boolean }[] = [
  { key: 'heroEyebrow', label: 'Soprattitolo hero' },
  { key: 'heroTitle', label: 'Titolo hero' },
  { key: 'heroAccent', label: 'Accento titolo' },
  { key: 'heroDescription', label: 'Descrizione hero', multiline: true },
  { key: 'primaryActionLabel', label: 'CTA principale' },
  { key: 'primaryActionHref', label: 'Link CTA principale' },
  { key: 'secondaryActionLabel', label: 'CTA secondaria' },
  { key: 'secondaryActionHref', label: 'Link CTA secondaria' },
  { key: 'visualEyebrow', label: 'Soprattitolo immagine' },
  { key: 'visualTitle', label: 'Titolo immagine' },
  { key: 'visualDescription', label: 'Descrizione immagine' },
  { key: 'visualImageUrl', label: 'URL immagine' },
  { key: 'visualImageAlt', label: 'Testo alternativo immagine' },
  { key: 'visualTopLabel', label: 'Etichetta superiore' },
  { key: 'visualTag', label: 'Tag visuale' },
  { key: 'visualMonogram', label: 'Monogramma visuale' },
  { key: 'visualCounter', label: 'Contatore visuale' },
  { key: 'heroSocialProof', label: 'Testo social proof' },
  { key: 'brandColorsLabel', label: 'Etichetta colori' },
  { key: 'brandColorsDescriptor', label: 'Descrizione colori' },
  { key: 'artworkTitle', label: 'Titolo accessibile illustrazione' },
  { key: 'artworkDescription', label: 'Descrizione accessibile illustrazione' },
  { key: 'projectEyebrow', label: 'Soprattitolo progetto' },
  { key: 'projectTitle', label: 'Titolo progetto' },
  { key: 'projectDescription', label: 'Descrizione progetto', multiline: true },
  { key: 'projectActionLabel', label: 'CTA progetto' },
  { key: 'projectActionHref', label: 'Link CTA progetto' },
  { key: 'closingEyebrow', label: 'Soprattitolo chiusura' },
  { key: 'closingTitle', label: 'Titolo chiusura' },
  { key: 'closingDescription', label: 'Descrizione chiusura', multiline: true },
  { key: 'closingPrimaryLabel', label: 'CTA finale principale' },
  { key: 'closingPrimaryHref', label: 'Link CTA finale principale' },
  { key: 'closingSecondaryLabel', label: 'CTA finale secondaria' },
  { key: 'closingSecondaryHref', label: 'Link CTA finale secondaria' },
]

const pageLabels = { news: 'News', teams: 'Squadre', calendar: 'Calendario', society: 'Società' } as const
type PageKey = keyof typeof pageLabels

function moveItem<T extends { order: number }>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next.map((item, order) => ({ ...item, order }))
}

function PagesWorkbench() {
  const initial = localContentService.settings()
  const [settings, setSettings] = useState<SiteSettings>(() => JSON.parse(JSON.stringify(initial)) as SiteSettings)
  const [activeTab, setActiveTab] = useState<'home' | 'pages' | 'navigation' | 'seo'>('home')
  const issues = useMemo(() => validateSiteSettings(settings), [settings])
  const patchHome = (key: HomeTextKey, value: string) => setSettings((current) => ({ ...current, home: { ...current.home, [key]: value } }))
  const patchPage = (page: PageKey, key: keyof StandardPageContent, value: string) => setSettings((current) => ({ ...current, [page]: { ...current[page], [key]: value } }))
  const patchFeature = (index: number, patch: Partial<HomeFeature>) => setSettings((current) => ({ ...current, home: { ...current.home, features: current.home.features.map((feature, i) => i === index ? { ...feature, ...patch } : feature) } }))
  const reorderFeatures = (index: number, direction: -1 | 1) => setSettings((current) => ({ ...current, home: { ...current.home, features: moveItem(current.home.features, index, direction) } }))
  const addFeature = () => setSettings((current) => {
    const id = `sezione-${current.home.features.length + 1}`
    return { ...current, home: { ...current.home, features: [...current.home.features, { id, eyebrow: 'Nuova sezione', title: 'Titolo da definire', description: 'Descrizione da inserire', visible: false, order: current.home.features.length }] } }
  })
  const patchNavigation = (index: number, patch: Partial<SiteSettings['navigation'][number]>) => setSettings((current) => ({ ...current, navigation: current.navigation.map((item, i) => i === index ? { ...item, ...patch } : item) }))
  const reorderNavigation = (index: number, direction: -1 | 1) => setSettings((current) => ({ ...current, navigation: moveItem(current.navigation, index, direction) }))

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <AdminNav />
        <header className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Pagine e homepage · workbench UI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Editor pagine</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Modifica i contenuti editoriali, l'ordine delle sezioni, la navigazione e i metadati SEO. Le modifiche sono mostrate in anteprima locale.</p>
        </header>

        <section className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5" aria-labelledby="pages-prototype-notice">
          <h2 id="pages-prototype-notice" className="font-bold text-amber-200">Prototipo locale — nessun salvataggio</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Le modifiche restano temporanee nello stato della pagina. Non sono collegate ad autenticazione, API, revisioni o database e non cambiano il sito pubblico. La validazione è un controllo preliminare lato interfaccia.</p>
        </section>

        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Sezioni editor pagine">
          {([{ id: 'home', label: 'Homepage' }, { id: 'pages', label: 'Pagine interne' }, { id: 'navigation', label: 'Menu' }, { id: 'seo', label: 'SEO sito' }] as const).map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeTab === tab.id ? 'border-red-400 bg-red-500/15 text-white' : 'border-white/15 text-slate-400 hover:border-white/30 hover:text-white'}`}>{tab.label}</button>)}
        </div>

        {activeTab === 'home' && <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Contenuti homepage</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {homeFields.map(({ key, label, multiline }) => <div key={key} className={multiline ? 'sm:col-span-2' : ''}>
                  <label htmlFor={`home-${key}`} className="mb-2 block text-sm font-semibold">{label}</label>
                  {multiline ? <textarea id={`home-${key}`} value={String(settings.home[key] ?? '')} onChange={(event) => patchHome(key, event.target.value)} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-red-400" /> : <input id={`home-${key}`} value={String(settings.home[key] ?? '')} onChange={(event) => patchHome(key, event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-red-400" />}
                </div>)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Sezioni homepage</h2><button type="button" onClick={addFeature} className="rounded-full border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10">+ Aggiungi sezione</button></div>
              <p className="mt-2 text-sm text-slate-400">Modifica testi, visibilità e ordine. Le sezioni nascoste restano in bozza.</p>
              <div className="mt-5 space-y-4">
                {settings.home.features.map((feature, index) => <fieldset key={feature.id} className="rounded-xl border border-white/10 p-4">
                  <legend className="px-2 text-sm font-bold">{feature.title || `Sezione ${index + 1}`}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([{ key: 'eyebrow', label: 'Soprattitolo' }, { key: 'title', label: 'Titolo' }] as const).map((field) => <div key={field.key}><label htmlFor={`feature-${index}-${field.key}`} className="mb-1 block text-xs text-slate-400">{field.label}</label><input id={`feature-${index}-${field.key}`} value={feature[field.key]} onChange={(event) => patchFeature(index, { [field.key]: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm" /></div>)}
                    <div className="sm:col-span-2"><label htmlFor={`feature-${index}-description`} className="mb-1 block text-xs text-slate-400">Descrizione</label><textarea id={`feature-${index}-description`} value={feature.description} onChange={(event) => patchFeature(index, { description: event.target.value })} rows={2} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm" /></div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={feature.visible} onChange={(event) => patchFeature(index, { visible: event.target.checked })} className="accent-red-400" /> Visibile</label><button type="button" disabled={index === 0} onClick={() => reorderFeatures(index, -1)} className="rounded border border-white/15 px-3 py-1 text-xs disabled:opacity-30" aria-label={`Sposta ${feature.title} in alto`}>↑</button><button type="button" disabled={index === settings.home.features.length - 1} onClick={() => reorderFeatures(index, 1)} className="rounded border border-white/15 px-3 py-1 text-xs disabled:opacity-30" aria-label={`Sposta ${feature.title} in basso`}>↓</button><button type="button" onClick={() => setSettings((current) => ({ ...current, home: { ...current.home, features: current.home.features.filter((item) => item.id !== feature.id).map((item, order) => ({ ...item, order })) } }))} className="ml-auto text-xs text-red-300 underline underline-offset-4">Rimuovi sezione</button></div>
                </fieldset>)}
              </div>
            </div>
          </section>
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Anteprima homepage</h2>
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-red-300">{settings.home.heroEyebrow}</p>
                <h3 className="mt-4 text-3xl font-black leading-tight">{settings.home.heroTitle} <span className="text-red-300">{settings.home.heroAccent}</span></h3>
                <p className="mt-4 text-sm leading-6 text-slate-300">{settings.home.heroDescription}</p>
                <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold">{settings.home.primaryActionLabel}</span><span className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold">{settings.home.secondaryActionLabel}</span></div>
                <div className="mt-6 rounded-xl border border-white/10 bg-gradient-to-br from-blue-950 to-slate-900 p-5"><p className="text-xs uppercase tracking-widest text-red-300">{settings.home.visualEyebrow}</p><p className="mt-2 text-2xl font-black">{settings.home.visualTitle}</p>{settings.home.visualImageUrl && <img src={settings.home.visualImageUrl} alt={settings.home.visualImageAlt} className="mt-4 max-h-48 w-full rounded-lg object-cover" />}<p className="mt-2 text-xs text-slate-400">{settings.home.visualDescription}</p></div>
                <div className="mt-5 space-y-3">{settings.home.features.filter((item) => item.visible).slice().sort((a, b) => a.order - b.order).map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-4"><p className="text-xs text-red-300">{item.eyebrow}</p><h4 className="mt-1 font-bold">{item.title}</h4><p className="mt-2 text-sm text-slate-400">{item.description}</p></article>)}</div>
                <div className="mt-5 border-t border-white/10 pt-5"><h4 className="font-bold">{settings.home.projectTitle}</h4><p className="mt-2 text-sm text-slate-400">{settings.home.projectDescription}</p></div>
                <div className="mt-5 rounded-xl bg-red-950/40 p-4"><p className="text-xs text-red-300">{settings.home.closingEyebrow}</p><h4 className="mt-1 font-bold">{settings.home.closingTitle}</h4><p className="mt-2 text-sm text-slate-300">{settings.home.closingDescription}</p></div>
              </div>
            </div>
          </aside>
        </div>}

        {activeTab === 'pages' && <section className="mt-6 grid gap-5 lg:grid-cols-2">
          {(Object.keys(pageLabels) as PageKey[]).map((page) => <article key={page} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-bold">{pageLabels[page]}</h2>
            <div className="mt-4 grid gap-4">
              {([{ key: 'eyebrow', label: 'Soprattitolo' }, { key: 'title', label: 'Titolo' }, { key: 'accent', label: 'Accento titolo' }, { key: 'description', label: 'Descrizione', multiline: true }, { key: 'backLabel', label: 'Link indietro' }, { key: 'seoTitle', label: 'Titolo SEO' }, { key: 'seoDescription', label: 'Descrizione SEO', multiline: true }, { key: 'canonicalUrl', label: 'URL canonico' }, { key: 'socialImageUrl', label: 'URL immagine social' }, { key: 'socialImageAlt', label: 'Testo alternativo immagine social' }] as { key: keyof StandardPageContent; label: string; multiline?: boolean }[]).map((field) => <div key={field.key}><label htmlFor={`${page}-${field.key}`} className="mb-2 block text-sm font-semibold">{field.label}</label>{field.multiline ? <textarea id={`${page}-${field.key}`} value={String(settings[page][field.key] ?? '')} onChange={(event) => patchPage(page, field.key, event.target.value)} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /> : <input id={`${page}-${field.key}`} value={String(settings[page][field.key] ?? '')} onChange={(event) => patchPage(page, field.key, event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" />}</div>)}
            </div>
          </article>)}
        </section>}

        {activeTab === 'navigation' && <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Menu principale</h2><p className="mt-2 text-sm text-slate-400">Etichette, destinazioni, visibilità e ordine dei collegamenti.</p>
          <div className="mt-5 space-y-4">{settings.navigation.map((item, index) => <fieldset key={item.id} className="rounded-xl border border-white/10 p-4"><legend className="px-2 text-sm font-bold">{item.id}</legend><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor={`nav-${index}-label`} className="mb-1 block text-xs text-slate-400">Etichetta</label><input id={`nav-${index}-label`} value={item.label} onChange={(event) => patchNavigation(index, { label: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm" /></div><div><label htmlFor={`nav-${index}-href`} className="mb-1 block text-xs text-slate-400">Destinazione</label><input id={`nav-${index}-href`} value={item.href} onChange={(event) => patchNavigation(index, { href: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm" /></div></div><div className="mt-3 flex items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.visible} onChange={(event) => patchNavigation(index, { visible: event.target.checked })} className="accent-red-400" /> Visibile</label><button type="button" disabled={index === 0} onClick={() => reorderNavigation(index, -1)} className="rounded border border-white/15 px-3 py-1 text-xs disabled:opacity-30" aria-label={`Sposta ${item.label} in alto`}>↑</button><button type="button" disabled={index === settings.navigation.length - 1} onClick={() => reorderNavigation(index, 1)} className="rounded border border-white/15 px-3 py-1 text-xs disabled:opacity-30" aria-label={`Sposta ${item.label} in basso`}>↓</button></div></fieldset>)}</div>
        </section>}

        {activeTab === 'seo' && <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Metadati del sito</h2><p className="mt-2 text-sm text-slate-400">Titolo, descrizione, Open Graph e dati social globali.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">{([{ key: 'title', label: 'Titolo sito' }, { key: 'description', label: 'Descrizione sito', multiline: true }, { key: 'ogTitle', label: 'Titolo Open Graph' }, { key: 'ogDescription', label: 'Descrizione Open Graph', multiline: true }, { key: 'canonicalUrl', label: 'URL canonico' }, { key: 'ogImageUrl', label: 'URL immagine Open Graph' }, { key: 'ogImageAlt', label: 'Testo alternativo Open Graph' }, { key: 'twitterTitle', label: 'Titolo Twitter' }, { key: 'twitterDescription', label: 'Descrizione Twitter', multiline: true }] as { key: keyof SiteSettings['site']; label: string; multiline?: boolean }[]).map((field) => <div key={field.key}><label htmlFor={`site-${field.key}`} className="mb-2 block text-sm font-semibold">{field.label}</label>{field.multiline ? <textarea id={`site-${field.key}`} value={String(settings.site[field.key] ?? '')} onChange={(event) => setSettings((current) => ({ ...current, site: { ...current.site, [field.key]: event.target.value } }))} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" /> : <input id={`site-${field.key}`} value={String(settings.site[field.key] ?? '')} onChange={(event) => setSettings((current) => ({ ...current, site: { ...current.site, [field.key]: event.target.value } }))} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm" />}</div>)}</div>
        </section>}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Validazione impostazioni</h2><span className={issues.length ? 'rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200' : 'rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200'}>{issues.length ? `${issues.length} avvisi` : 'Nessun errore'}</span></div>
          {issues.length > 0 && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-amber-200">{issues.slice(0, 20).map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
          <p className="mt-4 text-xs leading-6 text-slate-500">La validazione controlla anche link, campi obbligatori, identificativi, ordine e visibilità. Prima di ogni salvataggio il server dovrà ripetere i controlli e applicare permessi e audit trail.</p>
        </section>
      </div>
    </main>
  )
}
