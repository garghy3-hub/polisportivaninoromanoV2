import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { AdminNav } from '../components/AdminNav'
import { useEffect, useState } from 'react'
import { saveLocalNewsDraft, loadLocalNewsDraft, clearLocalNewsDraft } from '../lib/news-local-drafts'
import { listLocalNewsLibrary, saveLocalNewsLibraryItem } from '../lib/news-local-library'
import { localContentService } from '../lib/content-service'
import { slugifyEditorialTitle } from '../lib/editorial-slug'
import { isSafeEditorialImageUrl } from '../lib/editorial-media'
import { addImageAsset, readImageLibrary } from '../lib/news-image-library'
import { listStoredMedia } from '../lib/media-indexeddb'
import { validateNewsDraft, type NewsDraftField } from '../lib/news-draft-validation'
import { newsCreateDraftFn, newsUpdateDraftFn, newsSubmitForReviewFn } from '../lib/server/news-editorial-actions'
import { newsRevisionDetailFn } from '../lib/server/news-read-actions'

export const Route = createFileRoute('/admin/news')({ headers: () => ({ 'Cache-Control': 'private, no-store' }), component: NewsDraftWorkbench })

const fieldTargetIds: Record<NewsDraftField, string> = {
  title: 'news-title',
  slug: 'news-slug',
  category: 'news-category',
  excerpt: 'news-excerpt',
  body: 'news-body',
  seoTitle: 'seo-title',
  seoDescription: 'seo-description',
  imageUrl: 'news-image-url',
  imageAlt: 'news-image-alt',
}

const fieldLabels: Record<NewsDraftField, string> = {
  title: 'Titolo',
  slug: 'Slug',
  category: 'Categoria',
  excerpt: 'Sommario',
  body: 'Testo',
  seoTitle: 'Titolo SEO',
  seoDescription: 'Meta description',
  imageUrl: 'URL immagine',
  imageAlt: 'Testo alternativo',
}

function NewsDraftWorkbench() {
  const categoryOptions = Object.entries(localContentService.settings().news.categoryLabels)
  const createServerDraft = useServerFn(newsCreateDraftFn)
  const updateServerDraft = useServerFn(newsUpdateDraftFn)
  const submitServerDraft = useServerFn(newsSubmitForReviewFn)
  const getServerRevision = useServerFn(newsRevisionDetailFn)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [draftMessage, setDraftMessage] = useState('')
  const [libraryId, setLibraryId] = useState('')
  const [serverDraft, setServerDraft] = useState<{articleId:string;revisionId:string;version:number;status:string}|null>(null)
  const [serverMessage, setServerMessage] = useState('')
  const [serverBusy, setServerBusy] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState('')
  const [imageAssets,setImageAssets] = useState<{id:string;url:string;alt:string;addedAt:string}[]>([])
  const [imageLibraryMessage,setImageLibraryMessage] = useState('')
  const [storedMedia,setStoredMedia] = useState<{id:string;name:string;alt:string;caption:string;url:string}[]>([])
  const draftContent = { title, slug, category, excerpt, body, seoTitle, seoDescription, imageUrl, imageAlt }
  useEffect(() => { let urls:string[]=[]; let cancelled=false; void listStoredMedia().then(items=>{if(cancelled)return; urls=items.map(x=>URL.createObjectURL(x.blob));setStoredMedia(items.map((x,i)=>({id:x.id,name:x.name,alt:x.alt,caption:x.caption,url:urls[i]})))}).catch(()=>setImageLibraryMessage('Media library locale non disponibile.')); return ()=>{cancelled=true;urls.forEach(URL.revokeObjectURL)} }, [])
  useEffect(() => {
    let cancelled = false
    const applyContent = (d: typeof draftContent) => {
      setTitle(d.title); setSlug(d.slug); setSlugEdited(true); setCategory(d.category)
      setExcerpt(d.excerpt); setBody(d.body); setSeoTitle(d.seoTitle); setSeoDescription(d.seoDescription)
      setImageUrl(d.imageUrl); setImageAlt(d.imageAlt)
    }
    const initialize = async () => {
      try {
        const localEditId = window.localStorage.getItem('nino-romano-v2-news-edit-id')
        if (localEditId) {
          const item = listLocalNewsLibrary(window.localStorage).find(i => i.id === localEditId)
          if (item) { setLibraryId(localEditId); applyContent(item.content) }
          window.localStorage.removeItem('nino-romano-v2-news-edit-id')
          window.localStorage.removeItem('nino-romano-v2-news-server-ref')
          setServerDraft(null)
        } else {
          const rawRef = window.localStorage.getItem('nino-romano-v2-news-server-ref')
          let restoredRemote = false
          if (rawRef) {
            const ref = JSON.parse(rawRef) as Record<string, unknown>
            if (typeof ref.articleId === 'string' && typeof ref.revisionId === 'string'
              && Number.isInteger(ref.version) && (ref.version as number) > 0
              && typeof ref.status === 'string') {
              const serverRef = { articleId: ref.articleId, revisionId: ref.revisionId, version: ref.version as number, status: ref.status }
              setServerDraft(serverRef)
              const result = await getServerRevision({ data: { articleId: serverRef.articleId, revisionId: serverRef.revisionId } })
              if (!cancelled && result.ok && result.value) {
                applyContent(result.value.revision.content)
                setServerDraft({ ...serverRef, status: result.value.revision.status })
                setAutosaveStatus('Bozza condivisa ripristinata dal database.')
                restoredRemote = true
              } else if (!cancelled) {
                setServerMessage('Riferimento alla bozza server non più disponibile. Ricarica la coda editoriale.')
              }
            }
          }
          if (!restoredRemote && !rawRef) {
            const saved = loadLocalNewsDraft(window.localStorage)
            if (saved) { applyContent(saved.content); setAutosaveStatus('Bozza precedente ripristinata automaticamente.') }
          }
        }
      } catch {
        if (!cancelled) setServerMessage('Impossibile ripristinare la bozza precedente.')
      } finally {
        try {
          const assets = readImageLibrary(window.localStorage)
          if (assets.ok) setImageAssets(assets.items)
          else setImageLibraryMessage('Raccolta immagini non leggibile.')
        } catch { setImageLibraryMessage('Raccolta immagini non disponibile.') }
        if (!cancelled) setEditorReady(true)
      }
    }
    void initialize()
    return () => { cancelled = true }
  }, [])
  useEffect(() => { if(!editorReady)return; setAutosaveStatus('Salvataggio…'); const timer=window.setTimeout(()=>{try{const ok=saveLocalNewsDraft(window.localStorage,draftContent);setAutosaveStatus(ok?'Salvato automaticamente sul dispositivo.':'Autosalvataggio non disponibile.')}catch{setAutosaveStatus('Autosalvataggio non disponibile.')}},800); return ()=>window.clearTimeout(timer) }, [editorReady,title,slug,category,excerpt,body,seoTitle,seoDescription,imageUrl,imageAlt])
  const saveImageToLibrary=()=>{try{const ok=addImageAsset(window.localStorage,imageUrl,imageAlt);const r=readImageLibrary(window.localStorage);if(r.ok)setImageAssets(r.items);setImageLibraryMessage(ok?'Immagine aggiunta alla raccolta locale.':'Impossibile aggiungere l’immagine. Controlla URL e testo alt.')}catch{setImageLibraryMessage('Raccolta immagini non disponibile.')}}
  const selectImage=(id:string)=>{const asset=imageAssets.find(a=>a.id===id);if(asset){setImageUrl(asset.url);setImageAlt(asset.alt)} else {const file=storedMedia.find(a=>a.id===id);if(file){setImageUrl('indexeddb-media:'+file.id);setImageAlt(file.alt);setImageLibraryMessage('Immagine locale selezionata tramite riferimento persistente IndexedDB.')}}}
  const saveToLibrary = () => { const id=libraryId || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now())); const ok=saveLocalNewsLibraryItem(window.localStorage,draftContent,id); if(ok){setLibraryId(id);setDraftMessage('Bozza salvata nell’archivio locale.')}else setDraftMessage('Salvataggio archivio non disponibile.') }
  const restoreDraft = () => { try { const saved = loadLocalNewsDraft(window.localStorage); if (!saved) { setDraftMessage('Nessuna bozza locale valida trovata.'); return } const c=saved.content; setTitle(c.title);setSlug(c.slug);setSlugEdited(true);setCategory(c.category);setExcerpt(c.excerpt);setBody(c.body);setSeoTitle(c.seoTitle);setSeoDescription(c.seoDescription);setImageUrl(c.imageUrl);setImageAlt(c.imageAlt);setDraftMessage('Bozza ripristinata dal dispositivo ('+new Date(saved.savedAt).toLocaleString()+').') } catch {setDraftMessage('Ripristino locale non disponibile.')} }
  const saveDraft = () => { try {const ok=saveLocalNewsDraft(window.localStorage,draftContent);setDraftMessage(ok?'Bozza salvata solo su questo dispositivo.':'Salvataggio locale non disponibile.')}catch{setDraftMessage('Salvataggio locale non disponibile.')} }
  const clearDraft = () => {try{const ok=clearLocalNewsDraft(window.localStorage);setDraftMessage(ok?'Bozza locale eliminata.':'Impossibile eliminare la bozza.')}catch{setDraftMessage('Eliminazione locale non disponibile.')}}

  const draftIssues = validateNewsDraft({ title, slug, category, excerpt, body, seoTitle, seoDescription, imageUrl, imageAlt }, categoryOptions.map(([value]) => value))
  const saveServerDraft = async () => {
    if (serverBusy) return
    if (serverDraft && !['draft', 'rejected'].includes(serverDraft.status)) { setServerMessage('Questa revisione non è modificabile nello stato attuale.'); return }
    if (draftIssues.length) { setServerMessage('Correggi i campi evidenziati prima di salvare sul server.'); return }
    setServerBusy(true)
    setServerMessage('')
    try {
      const result = serverDraft
        ? await updateServerDraft({ data: { articleId: serverDraft.articleId, revisionId: serverDraft.revisionId, expectedVersion: serverDraft.version, content: draftContent } })
        : await createServerDraft({ data: draftContent })
      if (!result.ok) {
        const messages: Record<string,string> = {
          unauthenticated: 'Sessione non valida. Effettua nuovamente l’accesso.',
          forbidden: 'Il tuo ruolo non consente di creare o modificare questa bozza.',
          invalid: 'Il contenuto non supera i controlli di validazione.',
          conflict: 'La bozza è stata modificata da un altro utente. Ricarica la revisione prima di continuare.',
          'slug-taken': 'Questo slug è già utilizzato da un’altra notizia pubblicata.',
          'not-found': 'La revisione non è più disponibile.',
          'invalid-transition': 'La revisione non è nello stato previsto per questa operazione.',
          internal: 'Salvataggio server non disponibile. Riprova più tardi.',
        }
        setServerMessage(messages[result.code] ?? 'Salvataggio non riuscito.')
        return
      }
      const revision = result.value.revision
      const nextRef = { articleId: revision.entityId, revisionId: revision.id, version: result.value.version, status: revision.status }
      setServerDraft(nextRef)
      let refSaved = true
      try { window.localStorage.setItem('nino-romano-v2-news-server-ref', JSON.stringify(nextRef)) } catch { refSaved = false }
      setServerMessage(refSaved ? 'Bozza salvata sul database condiviso. Non è ancora pubblica.' : 'Bozza salvata sul database, ma il riferimento locale non è stato conservato.')
    } catch {
      setServerMessage('Connessione al servizio editoriale non disponibile.')
    } finally {
      setServerBusy(false)
    }
  }
  const submitServerDraftForReview = async () => {
    if (!serverDraft || serverBusy || serverDraft.status !== 'draft') return
    setServerBusy(true)
    setServerMessage('')
    try {
      const result = await submitServerDraft({ data: { articleId: serverDraft.articleId, revisionId: serverDraft.revisionId, expectedVersion: serverDraft.version } })
      if (!result.ok) {
        setServerMessage(result.code === 'unauthenticated' ? 'Sessione non valida.' : result.code === 'forbidden' ? 'Il tuo ruolo non può inviare la bozza in revisione.' : 'Invio in revisione non riuscito.')
        return
      }
      const revision = result.value.revision
      const nextRef = { articleId: revision.entityId, revisionId: revision.id, version: result.value.version, status: revision.status }
      setServerDraft(nextRef)
      let refSaved = true
      try { window.localStorage.setItem('nino-romano-v2-news-server-ref', JSON.stringify(nextRef)) } catch { refSaved = false }
      setServerMessage(refSaved ? 'Bozza inviata in revisione. La pubblicazione richiede l’approvazione di un Publisher.' : 'Revisione inviata, ma il riferimento locale non è stato conservato.')
    } catch {
      setServerMessage('Invio in revisione non disponibile.')
    } finally {
      setServerBusy(false)
    }
  }
  const clearServerDraftLink = () => { try { window.localStorage.removeItem('nino-romano-v2-news-server-ref') } catch {} setServerDraft(null); setServerMessage('Collegamento alla bozza server rimosso da questo dispositivo.') }
  const fieldMessage = (field: NewsDraftField) => draftIssues.find((issue) => issue.field === field)?.message
  const updateTitle = (value: string) => { setTitle(value); if (!slugEdited) setSlug(slugifyEditorialTitle(value)) }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <AdminNav />
        <header className="mt-10"><p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">News · workbench UI</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Editor articolo</h1><p className="mt-4 max-w-3xl leading-7 text-slate-300">Anteprima in tempo reale e autosalvataggio locale. Con Supabase configurato puoi anche salvare una revisione condivisa e inviarla al flusso di approvazione.</p></header>
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={saveToLibrary} className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold hover:bg-emerald-600">Salva nell’archivio News</button><Link to="/admin/news-library" className="rounded-xl border border-white/20 px-4 py-2 font-semibold hover:bg-white/10">Apri archivio</Link><button type="button" onClick={saveDraft} className="rounded-xl bg-red-600 px-4 py-2 font-semibold hover:bg-red-500">Salva bozza sul dispositivo</button><button type="button" onClick={restoreDraft} className="rounded-xl border border-white/20 px-4 py-2 font-semibold hover:bg-white/10">Ripristina bozza</button><button type="button" onClick={clearDraft} className="rounded-xl border border-white/20 px-4 py-2 font-semibold hover:bg-white/10">Elimina bozza locale</button></div>{draftMessage && <p className="mt-3 text-sm text-emerald-300" role="status">{draftMessage}</p>}<p className="mt-2 text-sm text-slate-400" role="status" aria-live="polite">{autosaveStatus}</p>
        <div className="mt-5 rounded-2xl border border-sky-300/25 bg-sky-300/5 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-sky-100">Workflow editoriale condiviso</h2><p className="mt-1 text-sm text-slate-300">{serverDraft ? `Stato: ${serverDraft.status} · versione ${serverDraft.version}` : 'Nessuna bozza server collegata in questa sessione.'}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void saveServerDraft()} disabled={serverBusy || draftIssues.length > 0 || Boolean(serverDraft && !['draft', 'rejected'].includes(serverDraft.status))} className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold hover:bg-sky-600 disabled:opacity-50">{serverBusy ? 'Salvataggio…' : serverDraft ? 'Aggiorna bozza server' : 'Crea bozza server'}</button><button type="button" onClick={() => void submitServerDraftForReview()} disabled={serverBusy || !serverDraft || serverDraft.status !== 'draft'} className="rounded-xl border border-sky-200/30 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-300/10 disabled:opacity-40">Invia in revisione</button><button type="button" onClick={clearServerDraftLink} disabled={!serverDraft || serverBusy} className="rounded-xl border border-white/15 px-3 py-2 text-xs text-slate-300 disabled:opacity-40">Scollega bozza</button></div></div>{serverMessage && <p className="mt-3 text-sm text-sky-100" role="status" aria-live="polite">{serverMessage}</p>}<p className="mt-3 text-xs leading-5 text-slate-400">Il salvataggio server richiede un account attivo in Supabase. L’invio in revisione non pubblica la notizia; approvazione e pubblicazione restano riservate ai ruoli autorizzati. Il riferimento alla revisione viene conservato su questo dispositivo e può essere ripristinato dopo un nuovo accesso. L'archivio remoto completo è ancora da completare.</p></div>
        <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5"><h2 className="font-bold text-amber-200">Autosalvataggio locale</h2><p className="mt-2 text-sm leading-6 text-slate-300">La copia di recupero automatica resta su questo browser. È distinta dalla bozza condivisa salvata nel database.</p></div>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-labelledby="fields-heading">
            <h2 id="fields-heading" className="text-xl font-bold">Contenuto</h2><div className="mt-6 grid gap-5">
              <div><label htmlFor="news-title" className="mb-2 block text-sm font-semibold">Titolo</label><input id="news-title" aria-invalid={Boolean(fieldMessage('title'))} aria-describedby={fieldMessage('title') ? 'news-title-error' : undefined} value={title} onChange={(e) => updateTitle(e.target.value)} maxLength={140} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Titolo dell'articolo" />{fieldMessage('title') && <p id="news-title-error" className="mt-1 text-sm text-rose-300">{fieldMessage('title')}</p>}<p className="mt-1 text-right text-xs text-slate-500">{title.length}/140</p></div>
              <div><label htmlFor="news-slug" className="mb-2 block text-sm font-semibold">Slug (URL)</label><input id="news-slug" aria-invalid={Boolean(fieldMessage('slug'))} aria-describedby={fieldMessage('slug') ? 'news-slug-error' : undefined} value={slug} onChange={(e) => { setSlug(slugifyEditorialTitle(e.target.value)); setSlugEdited(true) }} maxLength={160} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="titolo-articolo" /><p className="mt-1 break-all text-xs text-slate-500">/news/{slug || 'slug-articolo'}</p><button type="button" className="mt-2 text-xs font-semibold text-red-300 underline" onClick={() => {setSlug(slugifyEditorialTitle(title));setSlugEdited(false)}}>Rigenera dallo titolo</button>{fieldMessage('slug') && <p id="news-slug-error" className="mt-1 text-sm text-rose-300">{fieldMessage('slug')}</p>}</div>
              <div><label htmlFor="news-category" className="mb-2 block text-sm font-semibold">Categoria</label><select id="news-category" aria-invalid={Boolean(fieldMessage('category'))} aria-describedby={fieldMessage('category') ? 'news-category-error' : undefined} value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400"><option value="">Seleziona una categoria</option>{categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{fieldMessage('category') && <p id="news-category-error" className="mt-1 text-sm text-rose-300">{fieldMessage('category')}</p>}<p className="mt-1 text-xs text-slate-500">Le categorie disponibili provengono dalle impostazioni editoriali del sito.</p></div>
              <div><label htmlFor="news-excerpt" className="mb-2 block text-sm font-semibold">Sommario</label><textarea id="news-excerpt" aria-invalid={Boolean(fieldMessage('excerpt'))} aria-describedby={fieldMessage('excerpt') ? 'news-excerpt-error' : undefined} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={300} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Breve introduzione" /><p className="mt-1 text-right text-xs text-slate-500">{excerpt.length}/300</p>{fieldMessage('excerpt') && <p id="news-excerpt-error" className="mt-1 text-sm text-rose-300">{fieldMessage('excerpt')}</p>}</div>
              <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">Immagine articolo</h3>{(imageAssets.length>0||storedMedia.length>0)&&<div className="mt-3"><label htmlFor="image-library-select" className="mb-2 block text-sm font-semibold">Scegli dalla raccolta locale</label><select id="image-library-select" value="" onChange={e=>selectImage(e.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white"><option value="">Seleziona un’immagine salvata…</option>{imageAssets.map(a=><option key={a.id} value={a.id}>{a.alt||a.url}</option>)}{storedMedia.length>0&&<optgroup label="File Media Library">{storedMedia.map(a=><option key={a.id} value={a.id}>{a.name} — {a.alt}</option>)}</optgroup>}</select></div>}<div className="mt-4 grid gap-4"><div><label htmlFor="news-image-url" className="mb-2 block text-sm font-semibold">URL immagine</label><input id="news-image-url" aria-invalid={Boolean(fieldMessage('imageUrl'))} aria-describedby={fieldMessage('imageUrl') ? 'news-image-url-error' : undefined} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="https://..." />{fieldMessage('imageUrl') && <p id="news-image-url-error" className="mt-1 text-sm text-rose-300">{fieldMessage('imageUrl')}</p>}</div><div><label htmlFor="news-image-alt" className="mb-2 block text-sm font-semibold">Testo alternativo (alt)</label><input id="news-image-alt" aria-invalid={Boolean(fieldMessage('imageAlt'))} aria-describedby={fieldMessage('imageAlt') ? 'news-image-alt-error' : undefined} value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} maxLength={200} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Descrizione dell'immagine" />{fieldMessage('imageAlt') && <p id="news-image-alt-error" className="mt-1 text-sm text-rose-300">{fieldMessage('imageAlt')}</p>}<p className="mt-1 text-right text-xs text-slate-500">{imageAlt.length}/200</p></div><button type="button" onClick={saveImageToLibrary} className="mt-4 rounded-lg border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-300/10">Salva immagine nella raccolta</button>{imageLibraryMessage&&<p role="status" className="mt-2 text-xs text-slate-400">{imageLibraryMessage}</p>}<p className="mt-2 text-xs text-slate-500">Raccolta locale di URL e testi alt (massimo 100). Non carica file e non sincronizza.</p></div></div>
              <div><label htmlFor="news-body" className="mb-2 block text-sm font-semibold">Testo</label><textarea id="news-body" aria-invalid={Boolean(fieldMessage('body'))} aria-describedby={fieldMessage('body') ? 'news-body-error' : undefined} value={body} onChange={(e) => setBody(e.target.value)} maxLength={20000} rows={10} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Corpo dell'articolo..." />{fieldMessage('body') && <p id="news-body-error" className="mt-1 text-sm text-rose-300">{fieldMessage('body')}</p>}<p className="mt-1 text-right text-xs text-slate-500">{body.length}/20000</p></div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-6"><h2 className="text-xl font-bold">SEO</h2><div className="mt-4 grid gap-5"><div><label htmlFor="seo-title" className="mb-2 block text-sm font-semibold">Titolo SEO</label><input id="seo-title" aria-invalid={Boolean(fieldMessage('seoTitle'))} aria-describedby={fieldMessage('seoTitle') ? 'seo-title-error' : undefined} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Titolo per i motori di ricerca" /><p className="mt-1 text-right text-xs text-slate-500">{seoTitle.length}/70</p>{fieldMessage('seoTitle') && <p id="seo-title-error" className="mt-1 text-sm text-rose-300">{fieldMessage('seoTitle')}</p>}</div><div><label htmlFor="seo-description" className="mb-2 block text-sm font-semibold">Meta description</label><textarea id="seo-description" aria-invalid={Boolean(fieldMessage('seoDescription'))} aria-describedby={fieldMessage('seoDescription') ? 'seo-description-error' : undefined} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={160} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Descrizione per i motori di ricerca" /><p className="mt-1 text-right text-xs text-slate-500">{seoDescription.length}/160</p>{fieldMessage('seoDescription') && <p id="seo-description-error" className="mt-1 text-sm text-rose-300">{fieldMessage('seoDescription')}</p>}</div></div></div>
            <div className="mt-6 rounded-xl border border-white/10 p-4" aria-live="polite"><h3 className="font-semibold">Controllo campi richiesti</h3>{draftIssues.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200">{draftIssues.map((issue, index) => <li key={`${issue.field}-${index}`}><a href={`#${fieldTargetIds[issue.field]}`} className="underline decoration-amber-200/50 underline-offset-2 hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200">{fieldLabels[issue.field]}: {issue.message}</a></li>)}</ul> : <p className="mt-2 text-sm text-emerald-300">Controlli locali superati (non equivale a validazione server o salvataggio).</p>}</div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-labelledby="preview-heading"><h2 id="preview-heading" className="text-xl font-bold">Anteprima</h2><article className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">{imageUrl.trim() && (isSafeEditorialImageUrl(imageUrl) || imageUrl.startsWith('indexeddb-media:')) && <img src={imageUrl.startsWith('indexeddb-media:') ? (storedMedia.find(a=>'indexeddb-media:'+a.id===imageUrl)?.url||'') : imageUrl.trim()} alt={imageAlt} className="max-h-96 w-full object-cover" /> }<div className="border-b border-white/10 bg-gradient-to-br from-red-500/20 to-white/[0.02] p-8"><p className="text-xs font-bold uppercase tracking-widest text-red-300">{category || 'Categoria'}</p><h3 className="mt-4 break-words text-3xl font-black">{title || 'Titolo dell’articolo'}</h3><p className="mt-4 whitespace-pre-wrap break-words leading-7 text-slate-300">{excerpt || 'Il sommario apparirà qui.'}</p></div><div className="p-8"><p className="whitespace-pre-wrap break-words leading-8 text-slate-300">{body || 'Il testo completo dell’articolo apparirà qui.'}</p></div></article><div className="mt-6 rounded-xl border border-white/10 p-4"><h3 className="font-semibold">Snippet SEO simulato</h3><p className="mt-2 text-sm text-emerald-300">{seoTitle || title || 'Titolo articolo'}</p><p className="mt-1 break-all text-xs text-slate-400">/news/{slug || 'slug-articolo'}</p><p className="mt-2 text-sm text-slate-300">{seoDescription || excerpt || 'Descrizione articolo'}</p></div></section>
        </div>
      </div>
    </main>
  )
}
