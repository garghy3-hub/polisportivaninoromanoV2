import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { AdminNav } from '../components/AdminNav'
import { useEffect, useRef, useState } from 'react'
import { readLocalNewsLibrary, deleteLocalNewsLibraryItem, type LocalNewsLibraryItem, type NewsLibraryStorage } from '../lib/news-local-library'
import { newsEditorialListFn } from '../lib/server/news-read-actions'
import type { NewsReadItem } from '../lib/news-read-repository'

export const Route=createFileRoute('/admin/news-library')({
 headers: () => ({ 'Cache-Control': 'private, no-store' }),
 loader: async () => {
  const [drafts, rejected] = await Promise.all([
   newsEditorialListFn({ data: { pageSize: 50, status: 'draft' } }),
   newsEditorialListFn({ data: { pageSize: 50, status: 'rejected' } }),
  ])
  if (!drafts.ok || !rejected.ok) return { remoteItems: [] as NewsReadItem[], remoteError: true }
  return { remoteItems: [...drafts.value.items, ...rejected.value.items], remoteError: false }
 },
 component:NewsLibrary
})
const STORAGE_KEY='nino-romano-v2-news-library'

function NewsLibrary(){
 const remote = Route.useLoaderData()
 const router = useRouter()
 const [items,setItems]=useState<LocalNewsLibraryItem[]>([])
 const [ready,setReady]=useState(false)
 const [archiveState,setArchiveState]=useState<'ok'|'malformed'|'storage'>('ok')
 const [message,setMessage]=useState('')
 const fileRef=useRef<HTMLInputElement>(null)
 const refresh=()=>{
  const result=readLocalNewsLibrary(window.localStorage)
  if(result.ok){setItems(result.items);setArchiveState('ok')}
  else {setItems([]);setArchiveState(result.reason)}
 }
 useEffect(()=>{try{refresh()}catch{setArchiveState('storage')}finally{setReady(true)}},[])
 const remove=(id:string)=>{
  if(!window.confirm('Eliminare definitivamente questa bozza dal browser?'))return
  if(deleteLocalNewsLibraryItem(window.localStorage,id)){refresh();setMessage('Bozza eliminata.')}
  else {refresh();setMessage('Impossibile eliminare la bozza.')}
 }
 const edit=(id:string)=>{try{window.localStorage.removeItem('nino-romano-v2-news-server-ref');window.localStorage.setItem('nino-romano-v2-news-edit-id',id);window.location.href='/admin/news'}catch{setMessage('Impossibile aprire questa bozza.')}}
 const openRemote=(item:NewsReadItem)=>{try{window.localStorage.removeItem('nino-romano-v2-news-edit-id');window.localStorage.setItem('nino-romano-v2-news-server-ref',JSON.stringify({articleId:item.articleId,revisionId:item.revisionId,version:item.version,status:item.status}));window.location.href='/admin/news'}catch{setMessage('Impossibile aprire la bozza condivisa.')}}
 const newDraft=()=>{try{window.localStorage.removeItem('nino-romano-v2-news-edit-id');window.localStorage.removeItem('nino-romano-v2-news-server-ref');window.location.href='/admin/news'}catch{setMessage('Impossibile aprire una nuova bozza.')}}
 const exportArchive=()=>{
  if(archiveState!=='ok'){setMessage('Archivio non valido: export non disponibile.');return}
  try{
   const payload=JSON.stringify({version:1,items},null,2)
   const blob=new Blob([payload],{type:'application/json'})
   const url=URL.createObjectURL(blob)
   const anchor=document.createElement('a');anchor.href=url;anchor.download='nino-romano-news-backup.json';anchor.click()
   URL.revokeObjectURL(url);setMessage('Backup JSON esportato.')
  }catch{setMessage('Esportazione non riuscita.')}
 }
 const importArchive=async(file:File|null)=>{
  if(!file)return
  try{
   const raw=await file.text()
   const temporary:NewsLibraryStorage={getItem:()=>raw,setItem:()=>{}}
   const validated=readLocalNewsLibrary(temporary)
   if(!validated.ok){setMessage('File non valido o danneggiato: importazione annullata.');return}
   if(!window.confirm('Importare '+validated.items.length+' bozze? L’archivio attuale verrà sostituito. Esporta prima un backup se vuoi conservarlo.'))return
   window.localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,items:validated.items}))
   refresh();setMessage('Archivio importato: '+validated.items.length+' bozze.')
  }catch{setMessage('Importazione non riuscita. Controlla il file e lo spazio disponibile.')}
  finally{if(fileRef.current)fileRef.current.value=''}
 }
 return <main className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8"><div className="mx-auto max-w-5xl"><Link to="/admin" className="text-sm font-semibold text-red-300">← Area amministrativa</Link>
        <AdminNav /><header className="mt-8"><p className="text-sm font-bold uppercase tracking-widest text-red-300">Archivio editoriale</p><h1 className="mt-2 text-4xl font-black">Bozze News</h1><p className="mt-3 text-slate-300">Qui trovi sia le bozze condivise sul server sia l'archivio locale di questo dispositivo.</p></header><div className="mt-6 flex flex-wrap gap-3"><button onClick={newDraft} className="rounded-xl bg-red-600 px-4 py-2 font-semibold">+ Nuova bozza</button><button onClick={()=>{refresh();void router.invalidate()}} className="rounded-xl border border-white/20 px-4 py-2">Aggiorna elenco</button><button disabled={archiveState!=='ok'} onClick={exportArchive} className="rounded-xl border border-emerald-300/40 px-4 py-2 font-semibold text-emerald-200 disabled:opacity-40">Esporta backup JSON</button><button onClick={()=>fileRef.current?.click()} className="rounded-xl border border-white/20 px-4 py-2 font-semibold">Importa backup JSON</button><input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" aria-label="Seleziona file di backup JSON" onChange={e=>void importArchive(e.target.files?.[0]??null)}/></div>{message&&<p role="status" className="mt-4 text-sm text-emerald-300">{message}</p>}
 <section className="mt-8 rounded-2xl border border-sky-300/25 bg-sky-300/5 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-sky-200">Database Supabase</p><h2 className="mt-1 text-xl font-bold">Bozze condivise</h2><p className="mt-1 text-sm text-slate-400">Revisioni salvate sul server, visibili in base al ruolo editoriale.</p></div><button onClick={()=>void router.invalidate()} className="rounded-lg border border-sky-200/30 px-3 py-2 text-sm">Aggiorna elenco server</button></div>{remote.remoteError ? <p className="mt-4 text-sm text-amber-200">Archivio server non disponibile. Controlla la sessione o riprova.</p> : remote.remoteItems.length===0 ? <p className="mt-4 text-sm text-slate-400">Nessuna bozza condivisa in stato draft o rejected.</p> : <div className="mt-4 space-y-3">{remote.remoteItems.map(item=><article key={item.revisionId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#090d18]/60 p-4"><div><p className="text-xs uppercase tracking-widest text-sky-200">{item.status} · versione {item.version}</p><h3 className="mt-1 font-bold">{item.content.title||'Bozza senza titolo'}</h3><p className="mt-1 text-sm text-slate-400">{item.content.category} · {item.content.slug}</p><p className="mt-1 text-xs text-slate-500">Aggiornata: {new Date(item.updatedAt).toLocaleString('it-IT')}</p></div><button onClick={()=>openRemote(item)} className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold hover:bg-sky-600">Apri bozza server</button></article>)}</div>}</section>
 {ready&&archiveState!=='ok'&&<div role="alert" className="mt-6 rounded-2xl border border-rose-300/40 bg-rose-400/10 p-5 text-rose-100"><h2 className="font-bold">Archivio non leggibile</h2><p className="mt-2 text-sm leading-6">{archiveState==='malformed'?'I dati dell’archivio risultano danneggiati o non validi. Per sicurezza non vengono modificati né sovrascritti.':'Il browser non consente di accedere allo storage locale in questo momento.'}</p><p className="mt-2 text-sm">Evita di salvare o eliminare contenuti finché il problema non è risolto.</p></div>}
 <section className="mt-8 space-y-4">{ready&&archiveState==='ok'&&items.length===0&&<div className="rounded-2xl border border-white/10 p-6 text-slate-300">Archivio vuoto. Crea una bozza dall'editor.</div>}{archiveState==='ok'&&items.map(item=><article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-red-300">{item.content.category||'Senza categoria'}</p><h2 className="mt-2 text-xl font-bold">{item.content.title||'Bozza senza titolo'}</h2><p className="mt-2 text-sm text-slate-400">{item.content.excerpt||'Sommario non presente'}</p><p className="mt-3 text-xs text-slate-500">Aggiornata: {new Date(item.updatedAt).toLocaleString()}</p></div><div className="flex gap-2"><button onClick={()=>edit(item.id)} className="rounded-lg bg-red-600 px-3 py-2 font-semibold">Apri</button><button onClick={()=>remove(item.id)} className="rounded-lg border border-white/20 px-3 py-2">Elimina</button></div></div></article>)}</section><p className="mt-8 text-xs leading-5 text-amber-200">Attenzione: l'archivio locale non è condiviso e può essere cancellato dal browser. Il backup JSON può contenere testi non pubblicati: custodiscilo con attenzione. Non contiene workflow di revisione o pubblicazione.</p></div></main>
}
