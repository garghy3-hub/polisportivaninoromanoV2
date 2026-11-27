import { createFileRoute, Link } from '@tanstack/react-router'
import { AdminNav } from '../components/AdminNav'
import { useEffect, useState } from 'react'
import { localContentService } from '../lib/content-service'
import type { Player, Team, TeamStaff } from '../lib/content-types'
import { slugifyEditorialTitle } from '../lib/editorial-slug'
import { validateTeam } from '../lib/content-validation'
import { isSafeEditorialImageUrl } from '../lib/editorial-media'

export const Route = createFileRoute('/admin/teams')({ headers: () => ({ 'Cache-Control': 'private, no-store' }), component: TeamsWorkbench })

type PlayerDraft = { name: string; jerseyNumber: string; role: string; photoUrl: string; photoAlt: string }
type StaffDraft = { name: string; role: string; photoUrl: string; photoAlt: string }

const emptyPlayer = (): PlayerDraft => ({ name: '', jerseyNumber: '', role: '', photoUrl: '', photoAlt: '' })
const emptyStaff = (): StaffDraft => ({ name: '', role: '', photoUrl: '', photoAlt: '' })

function TeamsWorkbench() {
  const categoryOptions = [...new Map(localContentService.settings().teams.categories.map((item) => [item.category, item.title])).entries()]
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [category, setCategory] = useState<Team['category'] | ''>(categoryOptions[0]?.[0] ?? '')
  const [season, setSeason] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoAlt, setLogoAlt] = useState('')
  const [players, setPlayers] = useState<PlayerDraft[]>([])
  const [staff, setStaff] = useState<StaffDraft[]>([])
  const [draftMessage, setDraftMessage] = useState('')
  const draftKey = 'nino-romano-v2-team-draft'
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return
      const draft = parsed as Record<string, unknown>
      if (draft.version !== 1 || typeof draft.name !== 'string' || typeof draft.slug !== 'string' || typeof draft.category !== 'string' || typeof draft.season !== 'string' || typeof draft.description !== 'string' || typeof draft.logoUrl !== 'string' || typeof draft.logoAlt !== 'string' || !Array.isArray(draft.players) || !Array.isArray(draft.staff)) return
      const validPlayers = draft.players.every((item) => item && typeof item === 'object' && typeof item.name === 'string' && typeof item.jerseyNumber === 'string' && typeof item.role === 'string' && typeof item.photoUrl === 'string' && typeof item.photoAlt === 'string')
      const validStaff = draft.staff.every((item) => item && typeof item === 'object' && typeof item.name === 'string' && typeof item.role === 'string' && typeof item.photoUrl === 'string' && typeof item.photoAlt === 'string')
      if (!validPlayers || !validStaff || draft.players.length > 100 || draft.staff.length > 30) return
      setName(draft.name); setSlug(draft.slug); setSlugEdited(true)
      setCategory((['senior', 'youth'].includes(draft.category) ? draft.category : '') as Team['category'] | '')
      setSeason(draft.season); setDescription(draft.description); setLogoUrl(draft.logoUrl); setLogoAlt(draft.logoAlt)
      setPlayers(draft.players as PlayerDraft[]); setStaff(draft.staff as StaffDraft[])
      setDraftMessage('Bozza locale ripristinata da questo browser.')
    } catch { setDraftMessage('Impossibile leggere la bozza locale.') }
  }, [])
  const updateName = (value: string) => {
    setName(value)
    if (!slugEdited) setSlug(slugifyEditorialTitle(value))
  }
  const team: Team = {
    id: `team-${slug || 'bozza'}`,
    name,
    slug,
    category: category || 'senior',
    ...(season.trim() ? { season: season.trim() } : {}),
    ...(description.trim() ? { description: description.trim() } : {}),
    ...(logoUrl.trim() ? { logoUrl: logoUrl.trim(), logoAlt: logoAlt.trim() } : {}),
    roster: players.map((player, index): Player => ({
      id: `player-${index + 1}`,
      name: player.name,
      ...(player.jerseyNumber.trim() ? { jerseyNumber: Number(player.jerseyNumber) } : {}),
      ...(player.role.trim() ? { role: player.role.trim() } : {}),
      ...(player.photoUrl.trim() ? { photoUrl: player.photoUrl.trim(), photoAlt: player.photoAlt.trim() } : {}),
      order: index,
      visible: true,
    })),
    staff: staff.map((member, index): TeamStaff => ({
      id: `staff-${index + 1}`,
      name: member.name,
      role: member.role,
      ...(member.photoUrl.trim() ? { photoUrl: member.photoUrl.trim(), photoAlt: member.photoAlt.trim() } : {}),
      order: index,
      visible: true,
    })),
    visible: true,
    order: 0,
  }
  const issues = validateTeam(team)
  const saveDraft = () => {
    if (!isComplete || issues.length > 0) { setDraftMessage('Completa i dati obbligatori e correggi gli errori prima di salvare.'); return }
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), name, slug, category, season, description, logoUrl, logoAlt, players, staff }))
      setDraftMessage('Bozza salvata in questo browser.')
    } catch { setDraftMessage('Salvataggio non riuscito: spazio locale non disponibile.') }
  }
  const clearDraft = () => {
    if (!window.confirm('Eliminare la bozza salvata in questo browser?')) return
    window.localStorage.removeItem(draftKey)
    setDraftMessage('Bozza locale eliminata.')
  }
  const isComplete = name.trim().length > 0 && slug.trim().length > 0 && Boolean(category)
  const updatePlayer = (index: number, patch: Partial<PlayerDraft>) => setPlayers((current) => current.map((player, i) => i === index ? { ...player, ...patch } : player))
  const updateStaff = (index: number, patch: Partial<StaffDraft>) => setStaff((current) => current.map((member, i) => i === index ? { ...member, ...patch } : member))

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <AdminNav />
        <header className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Squadre e roster · workbench UI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Editor squadra</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Prepara una scheda squadra, organizza il roster e inserisci lo staff. I contenuti vengono mostrati in anteprima ma non sono salvati.</p>
        </header>

        <section className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5" aria-labelledby="team-prototype-notice">
          <h2 id="team-prototype-notice" className="font-bold text-amber-200">Prototipo locale — bozza salvata solo su questo browser</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Puoi salvare e ripristinare una bozza su questo dispositivo. Non modifica le pagine pubbliche e non è condivisa con altri dispositivi. Non inserire dati personali sensibili. Autenticazione, API, revisioni e database non sono ancora collegati.</p>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3"><button type="button" onClick={saveDraft} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold hover:bg-emerald-600">Salva bozza sul dispositivo</button><button type="button" onClick={clearDraft} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10">Elimina bozza salvata</button>{draftMessage && <p role="status" aria-live="polite" className="text-sm text-slate-300">{draftMessage}</p>}</div>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section className="space-y-6" aria-label="Campi della scheda squadra">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Dati squadra</h2>
              <div className="mt-5 grid gap-4">
                <div><label htmlFor="team-name" className="mb-2 block text-sm font-semibold">Nome squadra *</label><input id="team-name" value={name} onChange={(event) => updateName(event.target.value)} maxLength={120} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" placeholder="Nome della squadra" /></div>
                <div><label htmlFor="team-slug" className="mb-2 block text-sm font-semibold">Slug URL *</label><input id="team-slug" value={slug} onChange={(event) => { setSlug(slugifyEditorialTitle(event.target.value)); setSlugEdited(true) }} maxLength={120} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" placeholder="nome-squadra" /><p className="mt-1 break-all text-xs text-slate-500">/squadre/{slug || 'nome-squadra'}</p><button type="button" onClick={() => { setSlug(slugifyEditorialTitle(name)); setSlugEdited(false) }} className="mt-2 text-xs font-semibold text-red-300 underline">Rigenera dal nome</button></div>
                <div><label htmlFor="team-category" className="mb-2 block text-sm font-semibold">Categoria *</label><select id="team-category" value={category} onChange={(event) => setCategory(event.target.value as Team['category'] | '')} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400"><option value="">Seleziona categoria</option>{categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p className="mt-1 text-xs text-slate-500">Le categorie derivano dalle impostazioni del sito.</p></div>
                <div><label htmlFor="team-season" className="mb-2 block text-sm font-semibold">Stagione</label><input id="team-season" value={season} onChange={(event) => setSeason(event.target.value)} maxLength={40} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" placeholder="Es. stagione sportiva" /></div>
                <div><label htmlFor="team-description" className="mb-2 block text-sm font-semibold">Descrizione</label><textarea id="team-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1200} rows={4} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" placeholder="Descrizione della squadra" /></div>
                <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="team-logo-url" className="mb-2 block text-sm font-semibold">URL logo</label><input id="team-logo-url" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" placeholder="https://..." /></div><div><label htmlFor="team-logo-alt" className="mb-2 block text-sm font-semibold">Testo alternativo logo</label><input id="team-logo-alt" value={logoAlt} onChange={(event) => setLogoAlt(event.target.value)} maxLength={200} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" placeholder="Descrizione del logo" /></div></div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Roster</h2><button type="button" onClick={() => setPlayers((current) => [...current, emptyPlayer()])} className="rounded-lg border border-red-300/40 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10">+ Aggiungi atleta</button></div>
              {players.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Nessuna atleta inserita nella bozza.</p> : <div className="mt-5 space-y-4">{players.map((player, index) => <fieldset key={index} className="rounded-xl border border-white/10 p-4"><legend className="px-2 text-sm font-semibold">Atleta {index + 1}</legend><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor={`player-name-${index}`} className="mb-1 block text-xs text-slate-400">Nome</label><input id={`player-name-${index}`} value={player.name} onChange={(event) => updatePlayer(index, { name: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2" /></div><div><label htmlFor={`player-number-${index}`} className="mb-1 block text-xs text-slate-400">Numero maglia</label><input id={`player-number-${index}`} type="number" min="0" step="1" value={player.jerseyNumber} onChange={(event) => updatePlayer(index, { jerseyNumber: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2" /></div><div><label htmlFor={`player-role-${index}`} className="mb-1 block text-xs text-slate-400">Ruolo</label><input id={`player-role-${index}`} value={player.role} onChange={(event) => updatePlayer(index, { role: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2" /></div><div><label htmlFor={`player-photo-${index}`} className="mb-1 block text-xs text-slate-400">URL foto</label><input id={`player-photo-${index}`} value={player.photoUrl} onChange={(event) => updatePlayer(index, { photoUrl: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2" /></div><div className="sm:col-span-2"><label htmlFor={`player-alt-${index}`} className="mb-1 block text-xs text-slate-400">Testo alternativo foto</label><input id={`player-alt-${index}`} value={player.photoAlt} onChange={(event) => updatePlayer(index, { photoAlt: event.target.value })} maxLength={200} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2" /></div></div><button type="button" onClick={() => setPlayers((current) => current.filter((_, i) => i !== index))} className="mt-3 text-xs font-semibold text-rose-300 underline">Rimuovi dalla bozza</button></fieldset>)}</div>}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Staff</h2><button type="button" onClick={() => setStaff((current) => [...current, emptyStaff()])} className="rounded-lg border border-red-300/40 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10">+ Aggiungi membro</button></div>
              {staff.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Nessun membro dello staff inserito nella bozza.</p> : <div className="mt-5 space-y-4">{staff.map((member, index) => <fieldset key={index} className="rounded-xl border border-white/10 p-4"><legend className="px-2 text-sm font-semibold">Staff {index + 1}</legend><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor={`staff-name-${index}`} className="mb-1 block text-xs text-slate-400">Nome</label><input id={`staff-name-${index}`} value={member.name} onChange={(event) => updateStaff(index, { name: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2" /></div><div><label htmlFor={`staff-role-${index}`} className="mb-1 block text-xs text-slate-400">Ruolo</label><input id={`staff-role-${index}`} value={member.role} onChange={(event) => updateStaff(index, { role: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2" /></div><div><label htmlFor={`staff-photo-${index}`} className="mb-1 block text-xs text-slate-400">URL foto</label><input id={`staff-photo-${index}`} value={member.photoUrl} onChange={(event) => updateStaff(index, { photoUrl: event.target.value })} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2" /></div><div><label htmlFor={`staff-alt-${index}`} className="mb-1 block text-xs text-slate-400">Testo alternativo foto</label><input id={`staff-alt-${index}`} value={member.photoAlt} onChange={(event) => updateStaff(index, { photoAlt: event.target.value })} maxLength={200} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2" /></div></div><button type="button" onClick={() => setStaff((current) => current.filter((_, i) => i !== index))} className="mt-3 text-xs font-semibold text-rose-300 underline">Rimuovi dalla bozza</button></fieldset>)}</div>}
            </div>
          </section>

          <section className="space-y-6" aria-label="Anteprima e validazione squadra">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Anteprima scheda squadra</h2>
              <article className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
                <div className="flex items-center gap-4">{logoUrl.trim() && isSafeEditorialImageUrl(logoUrl) ? <img src={logoUrl.trim()} alt={logoAlt} className="h-14 w-14 rounded-xl object-contain" /> : <div className="grid h-14 w-14 place-items-center rounded-xl border border-white/10 text-xs text-slate-500">Logo</div>}<div><p className="text-xs font-bold uppercase tracking-wider text-red-300">{category || 'Categoria'}</p><h3 className="mt-1 text-2xl font-black">{name || 'Nome squadra'}</h3>{season && <p className="mt-1 text-xs text-slate-400">{season}</p>}</div></div>
                {description && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{description}</p>}
                {players.length > 0 && <div className="mt-6"><h4 className="font-bold">Roster · {players.length}</h4><ul className="mt-3 grid gap-2 sm:grid-cols-2">{players.map((player, index) => <li key={index} className="rounded-lg border border-white/10 p-3"><span className="font-semibold">{player.name || 'Nome atleta'}</span>{player.role && <span className="ml-2 text-xs text-slate-400">{player.role}</span>}{player.jerseyNumber && <span className="float-right text-sm font-bold text-red-300">#{player.jerseyNumber}</span>}</li>)}</ul></div>}
                {staff.length > 0 && <div className="mt-6"><h4 className="font-bold">Staff</h4><ul className="mt-3 space-y-2">{staff.map((member, index) => <li key={index} className="rounded-lg border border-white/10 p-3"><span className="font-semibold">{member.name || 'Nome membro'}</span><span className="ml-2 text-xs text-red-300">{member.role}</span></li>)}</ul></div>}
              </article>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-live="polite">
              <h2 className="text-xl font-bold">Controllo dati</h2>
              {!isComplete ? <p className="mt-3 text-sm text-amber-200">Inserisci nome, slug e categoria per completare i dati principali.</p> : issues.length === 0 ? <p className="mt-3 text-sm text-emerald-300">Controlli locali superati. Non equivale a salvataggio o validazione server.</p> : <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-200">{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
              <p className="mt-4 text-xs leading-6 text-slate-500">Le verifiche coprono identificativi, slug, categoria, numeri di maglia, URL e testi alternativi. I controlli definitivi dovranno essere ripetuti dal server.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
