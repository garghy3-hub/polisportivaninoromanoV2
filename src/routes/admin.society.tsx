import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { localContentService } from '../lib/content-service'
import { validateClubProfile, validateSiteSettings } from '../lib/content-validation'
import type { ClubContact, ClubPartner, ClubPerson, ClubProfile, SocietyPillar, SocietyPageContent } from '../lib/content-types'

export const Route = createFileRoute('/admin/society')({ component: SocietyWorkbench })

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function SocietyWorkbench() {
  const initialProfile = localContentService.profile()
  const initialSettings = localContentService.settings()
  const [profile, setProfile] = useState<ClubProfile>(() => clone(initialProfile))
  const [page, setPage] = useState<SocietyPageContent>(() => clone(initialSettings.society))
  const issues = useMemo(() => [...validateClubProfile(profile), ...validateSiteSettings({ ...initialSettings, society: page })], [profile, page, initialSettings])
  const patchProfile = (key: keyof ClubProfile, value: string) => setProfile(current => ({ ...current, [key]: value }))
  const patchPage = (key: keyof SocietyPageContent, value: string) => setPage(current => ({ ...current, [key]: value }))
  const patchContact = (group: 'contacts' | 'socialLinks', index: number, patch: Partial<ClubContact>) => setProfile(current => ({
    ...current,
    [group]: (current[group] ?? []).map((item, i) => i === index ? { ...item, ...patch } : item),
  }))
  const addContact = (group: 'contacts' | 'socialLinks') => setProfile(current => ({
    ...current,
    [group]: [...(current[group] ?? []), { label: '', value: '', ...(group === 'socialLinks' ? { href: '' } : {}) }],
  }))
  const removeContact = (group: 'contacts' | 'socialLinks', index: number) => setProfile(current => ({
    ...current,
    [group]: (current[group] ?? []).filter((_, i) => i !== index),
  }))
  const patchPerson = (index: number, patch: Partial<ClubPerson>) => setProfile(current => ({
    ...current,
    people: (current.people ?? []).map((item, i) => i === index ? { ...item, ...patch } : item),
  }))
  const addPerson = () => setProfile(current => ({
    ...current,
    people: [...(current.people ?? []), { id: `persona-bozza-${(current.people ?? []).length + 1}`, name: '', role: '', biography: '', visible: false, order: (current.people ?? []).length }],
  }))
  const removePerson = (index: number) => setProfile(current => ({
    ...current,
    people: (current.people ?? []).filter((_, i) => i !== index).map((item, order) => ({ ...item, order })),
  }))
  const patchPartner = (index: number, patch: Partial<ClubPartner>) => setProfile(current => ({
    ...current,
    partners: (current.partners ?? []).map((item, i) => i === index ? { ...item, ...patch } : item),
  }))
  const addPartner = (relationship: ClubPartner['relationship']) => setProfile(current => ({
    ...current,
    partners: [...(current.partners ?? []), { id: `${relationship}-bozza-${(current.partners ?? []).length + 1}`, name: '', relationship, visible: false, order: (current.partners ?? []).length }],
  }))
  const removePartner = (index: number) => setProfile(current => ({
    ...current,
    partners: (current.partners ?? []).filter((_, i) => i !== index).map((item, order) => ({ ...item, order })),
  }))
  const patchPillar = (index: number, patch: Partial<SocietyPillar>) => setPage(current => ({
    ...current,
    pillars: current.pillars.map((item, i) => i === index ? { ...item, ...patch } : item),
  }))
  const movePillar = (index: number, direction: -1 | 1) => setPage(current => {
    const target = index + direction
    if (target < 0 || target >= current.pillars.length) return current
    const next = [...current.pillars]
    ;[next[index], next[target]] = [next[target], next[index]]
    return { ...current, pillars: next.map((item, order) => ({ ...item, order })) }
  })
  const tabs = [
    { id: 'profile', label: 'Profilo' },
    { id: 'contacts', label: 'Contatti e social' },
    { id: 'people', label: 'Persone' },
    { id: 'partners', label: 'Sponsor e partner' },
    { id: 'page', label: 'Pagina e sezioni' },
  ] as const
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('profile')

  const textField = (id: string, label: string, value: string | undefined, onChange: (value: string) => void, multiline = false) => (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      {multiline
        ? <textarea id={id} value={value ?? ''} onChange={event => onChange(event.target.value)} rows={4} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-red-400" />
        : <input id={id} value={value ?? ''} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-red-400" />}
    </div>
  )

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <header className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Società e contatti · workbench UI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Profilo societario</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Gestisci presentazione, storia, missione, recapiti, collegamenti social, persone, sponsor e partner. Le schede nuove sono nascoste per impostazione iniziale finché non vengono completate e verificate.</p>
        </header>
        <section className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5" aria-labelledby="society-prototype-notice">
          <h2 id="society-prototype-notice" className="font-bold text-amber-200">Prototipo locale — nessun salvataggio</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Le modifiche restano temporanee nello stato della schermata. Non sono collegate ad autenticazione, API, revisioni o database e non cambiano la pagina pubblica. I dati iniziali provengono dal profilo locale già presente nel progetto.</p>
        </section>

        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Sezioni profilo societario">
          {tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? 'border-red-400 bg-red-500/15 text-white' : 'border-white/15 text-slate-400 hover:text-white'}`}>{tab.label}</button>)}
        </div>

        {activeTab === 'profile' && <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Identità e contenuti istituzionali</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {textField('club-name', 'Denominazione ufficiale', profile.name, value => patchProfile('name', value))}
            {textField('club-short-name', 'Nome breve', profile.shortName, value => patchProfile('shortName', value))}
            <div className="md:col-span-2">{textField('club-description', 'Presentazione società', profile.description, value => patchProfile('description', value), true)}</div>
            <div className="md:col-span-2">{textField('club-history', 'Storia', profile.history, value => patchProfile('history', value), true)}</div>
            <div className="md:col-span-2">{textField('club-mission', 'Missione', profile.mission, value => patchProfile('mission', value), true)}</div>
            <div className="md:col-span-2">{textField('club-address', 'Indirizzo', profile.address, value => patchProfile('address', value), true)}</div>
          </div>
        </section>}

        {activeTab === 'contacts' && <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {(['contacts', 'socialLinks'] as const).map(group => <div key={group} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{group === 'contacts' ? 'Recapiti' : 'Collegamenti social'}</h2><button type="button" onClick={() => addContact(group)} className="rounded-full border border-red-300/40 px-3 py-2 text-xs font-semibold text-red-200">+ Aggiungi</button></div>
            <div className="mt-5 space-y-4">
              {(profile[group] ?? []).map((item, index) => <fieldset key={`${group}-${index}`} className="rounded-xl border border-white/10 p-4"><legend className="px-2 text-sm font-semibold">Voce {index + 1}</legend><div className="grid gap-3">
                {textField(`${group}-${index}-label`, 'Etichetta', item.label, value => patchContact(group, index, { label: value }))}
                {textField(`${group}-${index}-value`, group === 'contacts' ? 'Valore (telefono, email o testo)' : 'Profilo / identificativo', item.value, value => patchContact(group, index, { value }))}
                {textField(`${group}-${index}-href`, 'Link (https, mailto, tel o percorso interno)', item.href, value => patchContact(group, index, { href: value }))}
              </div><button type="button" onClick={() => removeContact(group, index)} className="mt-3 text-xs font-semibold text-rose-300 underline">Rimuovi voce</button></fieldset>)}
              {(profile[group] ?? []).length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Nessun elemento inserito.</p>}
            </div>
          </div>)}
        </section>}

        {activeTab === 'people' && <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Persone e organizzazione</h2><p className="mt-1 text-sm text-slate-400">Non inserire nominativi senza conferma della società.</p></div><button type="button" onClick={addPerson} className="rounded-full border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-200">+ Aggiungi persona</button></div>
          <div className="mt-5 space-y-4">{(profile.people ?? []).map((person, index) => <fieldset key={person.id} className="rounded-xl border border-white/10 p-4"><legend className="px-2 text-sm font-semibold">{person.name || `Persona ${index + 1}`}</legend><div className="grid gap-3 md:grid-cols-2">
            {textField(`person-${index}-name`, 'Nome e cognome', person.name, value => patchPerson(index, { name: value }))}
            {textField(`person-${index}-role`, 'Ruolo', person.role, value => patchPerson(index, { role: value }))}
            <div className="md:col-span-2">{textField(`person-${index}-bio`, 'Biografia / descrizione', person.biography, value => patchPerson(index, { biography: value }), true)}</div>
            {textField(`person-${index}-photo`, 'URL foto', person.photoUrl, value => patchPerson(index, { photoUrl: value }))}
            {textField(`person-${index}-alt`, 'Testo alternativo foto', person.photoAlt, value => patchPerson(index, { photoAlt: value }))}
          </div><div className="mt-3 flex items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={person.visible} onChange={event => patchPerson(index, { visible: event.target.checked })} className="accent-red-400" /> Pubblica</label><button type="button" onClick={() => removePerson(index)} className="text-xs font-semibold text-rose-300 underline">Rimuovi</button></div></fieldset>)}
          {(profile.people ?? []).length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Nessuna persona inserita.</p>}</div>
        </section>}

        {activeTab === 'partners' && <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Sponsor e partner</h2><p className="mt-1 text-sm text-slate-400">I nuovi soggetti vengono creati non visibili fino alla verifica.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => addPartner('sponsor')} className="rounded-full border border-red-300/40 px-3 py-2 text-xs font-semibold text-red-200">+ Sponsor</button><button type="button" onClick={() => addPartner('partner')} className="rounded-full border border-red-300/40 px-3 py-2 text-xs font-semibold text-red-200">+ Partner</button></div></div>
          <div className="mt-5 space-y-4">{(profile.partners ?? []).map((partner, index) => <fieldset key={partner.id} className="rounded-xl border border-white/10 p-4"><legend className="px-2 text-sm font-semibold">{partner.name || `Soggetto ${index + 1}`}</legend><div className="grid gap-3 md:grid-cols-2">
            {textField(`partner-${index}-name`, 'Nome', partner.name, value => patchPartner(index, { name: value }))}
            <div><label htmlFor={`partner-${index}-relationship`} className="mb-2 block text-sm font-semibold">Tipologia</label><select id={`partner-${index}-relationship`} value={partner.relationship} onChange={event => patchPartner(index, { relationship: event.target.value as ClubPartner['relationship'] })} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm"><option value="sponsor">Sponsor</option><option value="partner">Partner</option></select></div>
            <div className="md:col-span-2">{textField(`partner-${index}-description`, 'Descrizione', partner.description, value => patchPartner(index, { description: value }), true)}</div>
            {textField(`partner-${index}-logo`, 'URL logo', partner.logoUrl, value => patchPartner(index, { logoUrl: value }))}
            {textField(`partner-${index}-logo-alt`, 'Testo alternativo logo', partner.logoAlt, value => patchPartner(index, { logoAlt: value }))}
            {textField(`partner-${index}-website`, 'Sito web (HTTPS)', partner.websiteUrl, value => patchPartner(index, { websiteUrl: value }))}
          </div><div className="mt-3 flex items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={partner.visible} onChange={event => patchPartner(index, { visible: event.target.checked })} className="accent-red-400" /> Pubblica</label><button type="button" onClick={() => removePartner(index)} className="text-xs font-semibold text-rose-300 underline">Rimuovi</button></div></fieldset>)}
          {(profile.partners ?? []).length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Nessuno sponsor o partner inserito.</p>}</div>
        </section>}

        {activeTab === 'page' && <section className="mt-6 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-xl font-bold">Testi della pagina Società</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
            {(['backLabel', 'eyebrow', 'title', 'accent', 'description', 'seoTitle', 'seoDescription', 'asideTitle', 'asideDescription', 'historyTitle', 'missionTitle', 'addressTitle', 'contactsTitle', 'socialLinksTitle', 'peopleTitle', 'sponsorsLabel', 'partnersLabel'] as (keyof SocietyPageContent)[]).map(key => <div key={key} className={['description', 'seoDescription', 'asideDescription'].includes(key) ? 'md:col-span-2' : ''}>{textField(`society-page-${key}`, ({ backLabel: 'Etichetta ritorno', eyebrow: 'Sopratitolo', title: 'Titolo', accent: 'Accento titolo', description: 'Descrizione pagina', seoTitle: 'Titolo SEO', seoDescription: 'Descrizione SEO', asideTitle: 'Titolo messaggio informativo', asideDescription: 'Messaggio informativo', historyTitle: 'Titolo storia', missionTitle: 'Titolo missione', addressTitle: 'Titolo indirizzo', contactsTitle: 'Titolo contatti', socialLinksTitle: 'Titolo social', peopleTitle: 'Titolo persone', sponsorsLabel: 'Etichetta sponsor', partnersLabel: 'Etichetta partner' } as Record<string, string>)[key], String(page[key] ?? ''), value => patchPage(key, value), ['description', 'seoDescription', 'asideDescription'].includes(key))}</div>)}
          </div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Sezioni informative</h2><button type="button" onClick={() => setPage(current => ({ ...current, pillars: [...current.pillars, { id: `sezione-${current.pillars.length + 1}`, title: '', description: '', visible: false, order: current.pillars.length }] }))} className="rounded-full border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-200">+ Aggiungi sezione</button></div>
            <div className="mt-5 space-y-4">{page.pillars.map((pillar, index) => <fieldset key={pillar.id} className="rounded-xl border border-white/10 p-4"><legend className="px-2 text-sm font-semibold">{pillar.title || `Sezione ${index + 1}`}</legend><div className="grid gap-3 md:grid-cols-2">{textField(`pillar-${index}-title`, 'Titolo', pillar.title, value => patchPillar(index, { title: value }))}<div className="md:col-span-2">{textField(`pillar-${index}-description`, 'Descrizione', pillar.description, value => patchPillar(index, { description: value }), true)}</div></div><div className="mt-3 flex items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pillar.visible} onChange={event => patchPillar(index, { visible: event.target.checked })} className="accent-red-400" /> Visibile</label><button type="button" disabled={index === 0} onClick={() => movePillar(index, -1)} className="rounded border border-white/15 px-3 py-1 text-xs disabled:opacity-30" aria-label={`Sposta ${pillar.title} in alto`}>↑</button><button type="button" disabled={index === page.pillars.length - 1} onClick={() => movePillar(index, 1)} className="rounded border border-white/15 px-3 py-1 text-xs disabled:opacity-30" aria-label={`Sposta ${pillar.title} in basso`}>↓</button><button type="button" onClick={() => setPage(current => ({ ...current, pillars: current.pillars.filter(item => item.id !== pillar.id).map((item, order) => ({ ...item, order })) }))} className="ml-auto text-xs text-rose-300 underline">Rimuovi</button></div></fieldset>)}</div>
          </div>
        </section>}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Controllo dati</h2><span className={issues.length ? 'rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200' : 'rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200'}>{issues.length ? `${issues.length} avvisi` : 'Nessun errore'}</span></div>
          {issues.length > 0 && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-amber-200">{issues.slice(0, 30).map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
          <p className="mt-4 text-xs leading-6 text-slate-500">Prima di un futuro salvataggio il server dovrà ripetere la validazione, verificare permessi e proprietà dei media e registrare ogni modifica nell'audit trail.</p>
        </section>
      </div>
    </main>
  )
}
