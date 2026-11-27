import { createFileRoute, Link } from '@tanstack/react-router'
import { AdminNav } from '../components/AdminNav'
import { useEffect, useRef, useState } from 'react'

export const Route = createFileRoute('/admin/media')({ component: MediaLibraryWorkbench })

type MediaItem = { id: string; file: File; url: string; alt: string; caption: string; addedAt: string }
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

function MediaLibraryWorkbench() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [selected, setSelected] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const urlsRef = useRef<string[]>([])
  useEffect(() => () => { urlsRef.current.forEach(url => URL.revokeObjectURL(url)) }, [])

  const choose = (file: File | null) => {
    setMessage('')
    if (!file) return
    if (!ALLOWED.includes(file.type)) { setMessage('Formato non supportato. Usa JPEG, PNG, WebP o AVIF.'); return }
    if (file.size <= 0 || file.size > MAX_BYTES) { setMessage('File vuoto o troppo grande: limite 10 MiB.'); return }
    if (items.length >= 20) { setMessage('Limite temporaneo: 20 immagini per sessione.'); return }
    if (preview) URL.revokeObjectURL(preview)
    const nextUrl = URL.createObjectURL(file)
    urlsRef.current.push(nextUrl)
    setSelected(file)
    setPreview(nextUrl)
    setAlt('')
    setCaption('')
  }
  const add = () => {
    if (!selected || !alt.trim()) { setMessage('Inserisci un testo alternativo prima di aggiungere l’immagine.'); return }
    if (items.length >= 20) { setMessage('Limite temporaneo di 20 immagini raggiunto.'); return }
    const url = preview
    setItems(prev => [...prev, { id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()), file: selected, url, alt: alt.trim(), caption: caption.trim(), addedAt: new Date().toISOString() }])
    setSelected(null); setPreview(''); setAlt(''); setCaption('')
    setMessage('Immagine aggiunta alla raccolta temporanea di questa sessione.')
  }
  const remove = (id: string) => {
    setItems(prev => {
      const item = prev.find(x => x.id === id)
      if (item) { URL.revokeObjectURL(item.url); urlsRef.current = urlsRef.current.filter(url => url !== item.url) }
      return prev.filter(x => x.id !== id)
    })
  }
  const clear = () => {
    items.forEach(item => URL.revokeObjectURL(item.url))
    setItems([]); setMessage('Raccolta temporanea svuotata.')
  }
  const copyMetadata = async (item: MediaItem) => {
    try { await navigator.clipboard.writeText(item.alt); setMessage('Testo alternativo copiato.') } catch { setMessage('Copia non disponibile in questo browser.') }
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <AdminNav />
        <header className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Media library · prototipo locale</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Libreria media</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Seleziona file dal dispositivo, visualizza anteprime e prepara metadati per l’utilizzo editoriale.</p>
        </header>
        <section className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 sm:p-6">
          <h2 className="font-bold text-amber-200">Archivio temporaneo: non è un upload server</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">File e anteprime restano in memoria nel browser durante questa sessione. Ricaricando o chiudendo la pagina la raccolta si perde. Non sono ancora condivisi, salvati su server o collegati ai contenuti pubblicati.</p>
        </section>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Limiti upload prototipo">
          {[
            ['Formati', 'JPEG · PNG · WebP · AVIF'],
            ['Peso massimo', '10 MiB per file'],
            ['Limite sessione', '20 immagini'],
            ['Accessibilità', 'Alt text obbligatorio'],
          ].map(([label, value]) => <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 font-bold">{value}</p></article>)}
        </section>
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Aggiungi un’immagine</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-xl bg-red-600 px-4 py-3 font-semibold hover:bg-red-500">Seleziona file</button>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" aria-label="Seleziona immagine" onChange={e => choose(e.target.files?.[0] ?? null)} />
            {selected && <span className="self-center text-sm text-slate-300">{selected.name} · {(selected.size / 1024 / 1024).toFixed(2)} MiB</span>}
          </div>
          {preview && <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950"><img src={preview} alt={alt || 'Anteprima immagine selezionata'} className="max-h-96 w-full object-contain" /></div>
            <div className="space-y-4">
              <label className="block"><span className="mb-2 block font-semibold">Testo alternativo *</span><textarea value={alt} onChange={e => setAlt(e.target.value)} maxLength={300} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950 p-3" placeholder="Descrivi l’immagine in modo utile e conciso" /><span className="text-xs text-slate-500">{alt.length}/300</span></label>
              <label className="block"><span className="mb-2 block font-semibold">Didascalia (facoltativa)</span><textarea value={caption} onChange={e => setCaption(e.target.value)} maxLength={500} rows={2} className="w-full rounded-xl border border-white/15 bg-slate-950 p-3" placeholder="Didascalia editoriale" /></label>
              <button type="button" onClick={add} className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold hover:bg-emerald-600">Aggiungi alla raccolta temporanea</button>
            </div>
          </div>}
          {message && <p role="status" className="mt-4 text-sm text-emerald-200">{message}</p>}
        </section>
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Raccolta di sessione</h2><p className="mt-2 text-sm text-slate-400">{items.length} / 20 immagini</p></div>{items.length>0&&<button type="button" onClick={clear} className="rounded-xl border border-white/20 px-3 py-2 text-sm">Svuota raccolta</button>}</div>
          {items.length===0 ? <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400">Nessuna immagine aggiunta in questa sessione.</div> : <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><img src={item.url} alt={item.alt} className="h-52 w-full bg-slate-950 object-contain" /><div className="p-4"><h3 className="font-bold break-words">{item.file.name}</h3><p className="mt-2 text-sm text-slate-300">{item.alt}</p>{item.caption&&<p className="mt-2 text-sm italic text-slate-400">{item.caption}</p>}<p className="mt-2 text-xs text-slate-500">{(item.file.size/1024/1024).toFixed(2)} MiB · {item.file.type}</p><div className="mt-4 flex gap-2"><button type="button" onClick={()=>void copyMetadata(item)} className="rounded-lg border border-white/15 px-3 py-2 text-sm">Copia alt</button><button type="button" onClick={()=>remove(item.id)} className="rounded-lg border border-rose-300/30 px-3 py-2 text-sm text-rose-200">Rimuovi</button></div></div></article>)}</div>}
        </section>
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-bold">Per trasformarla in libreria permanente</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300"><li>Autenticazione e autorizzazioni lato server.</li><li>Verifica del contenuto reale del file e scansione/controlli di sicurezza.</li><li>Storage persistente con gestione dei riferimenti e audit.</li><li>Collegamento diretto alle News, squadre, roster e pagine.</li></ul>
        </section>
      </div>
    </main>
  )
}
