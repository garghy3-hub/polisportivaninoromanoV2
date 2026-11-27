import { createFileRoute, Link } from '@tanstack/react-router'
import { AdminNav } from '../components/AdminNav'
import { useEffect, useState } from 'react'
import { localContentService } from '../lib/content-service'
import type { EventStatus, MatchEvent } from '../lib/content-types'
import { validateEvent } from '../lib/content-validation'

export const Route = createFileRoute('/admin/calendar')({ component: CalendarWorkbench })

const calendarDraftKey = 'nino-romano-v2-calendar-draft'

function CalendarWorkbench() {
  const settings = localContentService.settings()
  const copy = settings.calendar
  const [dateTime, setDateTime] = useState('')
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [type, setType] = useState(copy.eventTypes[0] ?? '')
  const [season, setSeason] = useState('')
  const [competition, setCompetition] = useState('')
  const [round, setRound] = useState('')
  const [venue, setVenue] = useState('')
  const [status, setStatus] = useState<EventStatus>('scheduled')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [notes, setNotes] = useState('')
  const [visible, setVisible] = useState(true)
  const [draftMessage, setDraftMessage] = useState('')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(calendarDraftKey)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return
      const saved = parsed as Record<string, unknown>
      if (saved.version !== 1 || !saved.event || typeof saved.event !== 'object' || Array.isArray(saved.event)) return
      const candidate = saved.event as MatchEvent
      if (typeof candidate.id !== 'string' || typeof candidate.dateTime !== 'string' ||
        typeof candidate.homeTeam !== 'string' || typeof candidate.awayTeam !== 'string' ||
        !['scheduled', 'postponed', 'cancelled', 'completed'].includes(candidate.status)) return
      if (validateEvent(candidate).length > 0) {
        setDraftMessage('La bozza salvata contiene dati non validi e non è stata ripristinata.')
        return
      }
      setDateTime(candidate.dateTime)
      setHomeTeam(candidate.homeTeam)
      setAwayTeam(candidate.awayTeam)
      setType(candidate.type ?? '')
      setSeason(candidate.season ?? '')
      setCompetition(candidate.competition ?? '')
      setRound(candidate.round ?? '')
      setVenue(candidate.venue ?? '')
      setStatus(candidate.status)
      setHomeScore(candidate.homeScore === undefined ? '' : String(candidate.homeScore))
      setAwayScore(candidate.awayScore === undefined ? '' : String(candidate.awayScore))
      setNotes(candidate.notes ?? '')
      setVisible(candidate.visible ?? true)
      setDraftMessage('Bozza ripristinata da questo browser.')
    } catch {
      setDraftMessage('Impossibile leggere la bozza locale.')
    }
  }, [])

  const parsedHomeScore = homeScore.trim() === '' ? undefined : Number(homeScore)
  const parsedAwayScore = awayScore.trim() === '' ? undefined : Number(awayScore)
  const hasValidScores = Number.isInteger(parsedHomeScore) && Number.isInteger(parsedAwayScore) &&
    (parsedHomeScore ?? -1) >= 0 && (parsedAwayScore ?? -1) >= 0
  const outcome = status === 'completed' && hasValidScores
    ? parsedHomeScore! > parsedAwayScore! ? 'win' : parsedHomeScore! < parsedAwayScore! ? 'loss' : 'draw'
    : undefined

  const event: MatchEvent = {
    id: 'event-bozza',
    dateTime,
    homeTeam,
    awayTeam,
    status,
    ...(type.trim() ? { type: type.trim() } : {}),
    ...(season.trim() ? { season: season.trim() } : {}),
    ...(competition.trim() ? { competition: competition.trim() } : {}),
    ...(round.trim() ? { round: round.trim() } : {}),
    ...(venue.trim() ? { venue: venue.trim() } : {}),
    ...(notes.trim() ? { notes: notes.trim() } : {}),
    ...(status === 'completed' && parsedHomeScore !== undefined ? { homeScore: parsedHomeScore } : {}),
    ...(status === 'completed' && parsedAwayScore !== undefined ? { awayScore: parsedAwayScore } : {}),
    ...(outcome ? { outcome } : {}),
    visible,
    order: 0,
  }
  const issues = validateEvent(event)
  const requiredFieldsComplete = Boolean(dateTime && homeTeam.trim() && awayTeam.trim() && type.trim())
  const canSaveDraft = requiredFieldsComplete && issues.length === 0
  const saveDraft = () => {
    if (!canSaveDraft) {
      setDraftMessage('Completa i campi obbligatori e correggi gli errori prima di salvare.')
      return
    }
    try {
      window.localStorage.setItem(calendarDraftKey, JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        event,
      }))
      setDraftMessage('Bozza salvata in questo browser.')
    } catch {
      setDraftMessage('Salvataggio non riuscito: spazio locale non disponibile.')
    }
  }
  const clearDraft = () => {
    if (!window.confirm('Eliminare la bozza del calendario salvata in questo browser?')) return
    try {
      window.localStorage.removeItem(calendarDraftKey)
      setDraftMessage('Bozza locale eliminata.')
    } catch {
      setDraftMessage('Impossibile eliminare la bozza locale.')
    }
  }
  const updateStatus = (next: EventStatus) => {
    setStatus(next)
    if (next !== 'completed') {
      setHomeScore('')
      setAwayScore('')
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <AdminNav />
        <header className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Calendario e risultati · workbench UI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Editor appuntamento</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Inserisci una partita o un appuntamento, aggiorna lo stato e registra il punteggio soltanto quando l'incontro è concluso. L'anteprima non viene pubblicata.</p>
        </header>

        <section className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5" aria-labelledby="calendar-prototype-notice">
          <h2 id="calendar-prototype-notice" className="font-bold text-amber-200">Prototipo locale — bozza salvata solo su questo browser</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Puoi salvare e ripristinare una singola bozza su questo dispositivo. Non modifica il calendario pubblico e non è condivisa con altri dispositivi. Autenticazione, API, revisioni e database non sono collegati. Inserisci esclusivamente informazioni verificate.</p>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={saveDraft} disabled={!canSaveDraft} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">Salva bozza sul dispositivo</button>
          <button type="button" onClick={clearDraft} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10">Elimina bozza salvata</button>
          {draftMessage && <p role="status" aria-live="polite" className="text-sm text-slate-300">{draftMessage}</p>}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section className="space-y-6" aria-label="Campi appuntamento">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Dati dell'incontro</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label htmlFor="event-date" className="mb-2 block text-sm font-semibold">Data e ora *</label><input id="event-date" type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" /></div>
                <div><label htmlFor="event-home" className="mb-2 block text-sm font-semibold">Squadra di casa *</label><input id="event-home" value={homeTeam} onChange={(event) => setHomeTeam(event.target.value)} maxLength={120} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" /></div>
                <div><label htmlFor="event-away" className="mb-2 block text-sm font-semibold">Squadra ospite *</label><input id="event-away" value={awayTeam} onChange={(event) => setAwayTeam(event.target.value)} maxLength={120} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" /></div>
                <div><label htmlFor="event-type" className="mb-2 block text-sm font-semibold">Tipologia *</label><select id="event-type" value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400"><option value="">Seleziona tipologia</option>{copy.eventTypes.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
                <div><label htmlFor="event-status" className="mb-2 block text-sm font-semibold">Stato *</label><select id="event-status" value={status} onChange={(event) => updateStatus(event.target.value as EventStatus)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400">{(Object.keys(copy.eventStatusLabels) as EventStatus[]).map((value) => <option key={value} value={value}>{copy.eventStatusLabels[value]}</option>)}</select></div>
                <div><label htmlFor="event-season" className="mb-2 block text-sm font-semibold">{copy.seasonLabel}</label><input id="event-season" value={season} onChange={(event) => setSeason(event.target.value)} maxLength={40} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" /></div>
                <div><label htmlFor="event-competition" className="mb-2 block text-sm font-semibold">{copy.competitionLabel}</label><input id="event-competition" value={competition} onChange={(event) => setCompetition(event.target.value)} maxLength={120} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" /></div>
                <div><label htmlFor="event-round" className="mb-2 block text-sm font-semibold">{copy.roundLabel}</label><input id="event-round" value={round} onChange={(event) => setRound(event.target.value)} maxLength={80} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" /></div>
                <div><label htmlFor="event-venue" className="mb-2 block text-sm font-semibold">{copy.venueLabel}</label><input id="event-venue" value={venue} onChange={(event) => setVenue(event.target.value)} maxLength={160} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" /></div>
                {status === 'completed' && <fieldset className="grid gap-4 rounded-xl border border-red-300/20 p-4 sm:col-span-2 sm:grid-cols-2"><legend className="px-2 text-sm font-semibold text-red-200">Risultato finale *</legend><div><label htmlFor="event-home-score" className="mb-2 block text-sm text-slate-300">{homeTeam || 'Squadra di casa'}</label><input id="event-home-score" type="number" min="0" step="1" value={homeScore} onChange={(event) => setHomeScore(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" /></div><div><label htmlFor="event-away-score" className="mb-2 block text-sm text-slate-300">{awayTeam || 'Squadra ospite'}</label><input id="event-away-score" type="number" min="0" step="1" value={awayScore} onChange={(event) => setAwayScore(event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" /></div><p className="text-xs text-slate-500 sm:col-span-2">L'esito viene calcolato dal punteggio inserito. Non viene dedotto alcun risultato automaticamente da fonti esterne.</p></fieldset>}
                <div className="sm:col-span-2"><label htmlFor="event-notes" className="mb-2 block text-sm font-semibold">{copy.notesLabel}</label><textarea id="event-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none focus:border-red-400" /></div>
                <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} className="h-4 w-4 accent-red-400" /> Visibile nel calendario pubblico (quando il modulo sarà collegato)</label>
              </div>
            </div>
          </section>

          <section className="space-y-6" aria-label="Anteprima e validazione appuntamento">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Anteprima</h2>
              <article className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-red-300">{dateTime ? new Date(dateTime).toLocaleString(settings.site.locale, { dateStyle: 'full', timeStyle: 'short' }) : 'Data e ora da inserire'}</p><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{copy.eventStatusLabels[status]}</span></div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{type || 'Tipologia'}</p>
                <h3 className="mt-2 text-2xl font-black">{homeTeam || 'Squadra casa'} <span className="text-red-300">·</span> {awayTeam || 'Squadra ospite'}</h3>
                {status === 'completed' && <p className="mt-3 text-3xl font-black text-red-300">{homeScore || '–'} : {awayScore || '–'}</p>}
                <dl className="mt-5 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                  {season && <div><dt className="inline">{copy.seasonLabel}: </dt><dd className="inline text-slate-200">{season}</dd></div>}
                  {competition && <div><dt className="inline">{copy.competitionLabel}: </dt><dd className="inline text-slate-200">{competition}</dd></div>}
                  {round && <div><dt className="inline">{copy.roundLabel}: </dt><dd className="inline text-slate-200">{round}</dd></div>}
                  {venue && <div><dt className="inline">{copy.venueLabel}: </dt><dd className="inline text-slate-200">{venue}</dd></div>}
                </dl>
                {notes && <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-slate-400">{notes}</p>}
                <p className="mt-4 text-xs text-slate-500">{visible ? 'Visibile (impostazione bozza)' : 'Nascosto (impostazione bozza)'}</p>
              </article>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-live="polite">
              <h2 className="text-xl font-bold">Controllo dati</h2>
              {!requiredFieldsComplete ? <p className="mt-3 text-sm text-amber-200">Inserisci data, entrambe le squadre e tipologia per completare i dati principali.</p> : issues.length === 0 ? <p className="mt-3 text-sm text-emerald-300">Controlli locali superati. Non equivale a salvataggio o validazione server.</p> : <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-200">{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
              <p className="mt-4 text-xs leading-6 text-slate-500">Le verifiche controllano data, squadre, stato, punteggi ed esito. Il server dovrà ripetere tutte le validazioni e registrare ogni modifica in una revisione e nell'audit trail.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
