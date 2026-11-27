import type { NewsDraftInput } from './news-draft-validation'

const STORAGE_KEY = 'nino-romano-v2-news-library'
const MAX_ITEMS = 50
export interface LocalNewsLibraryItem { id: string; createdAt: string; updatedAt: string; content: NewsDraftInput }
export interface NewsLibraryStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
function isContent(value: unknown): value is NewsDraftInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const c=value as Record<string,unknown>
  const fields: (keyof NewsDraftInput)[]=['title','slug','category','excerpt','body','seoTitle','seoDescription','imageUrl','imageAlt']
  return Object.keys(c).length===fields.length && fields.every(k=>typeof c[k]==='string')
}
function parse(raw: string | null): LocalNewsLibraryItem[] {
  if (!raw) return []
  try {
    const value: unknown=JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return []
    const e=value as Record<string,unknown>
    if(e.version!==1 || !Array.isArray(e.items) || e.items.length>MAX_ITEMS) return []
    return e.items.filter((item): item is LocalNewsLibraryItem => {
      if(!item||typeof item!=='object'||Array.isArray(item))return false
      const i=item as Record<string,unknown>
      return typeof i.id==='string' && i.id.length>0 && typeof i.createdAt==='string' && Number.isFinite(Date.parse(i.createdAt)) && typeof i.updatedAt==='string' && Number.isFinite(Date.parse(i.updatedAt)) && isContent(i.content)
    })
  } catch { return [] }
}
export function listLocalNewsLibrary(storage: NewsLibraryStorage): LocalNewsLibraryItem[] { try{return parse(storage.getItem(STORAGE_KEY))}catch{return []} }
export function saveLocalNewsLibraryItem(storage: NewsLibraryStorage, content: NewsDraftInput, id: string, now=new Date().toISOString()): boolean {
  if(!isContent(content)||!id.trim()||!Number.isFinite(Date.parse(now)))return false
  try {
    const items=listLocalNewsLibrary(storage)
    const existing=items.find(i=>i.id===id)
    const next:LocalNewsLibraryItem={id,createdAt:existing?.createdAt??now,updatedAt:now,content}
    const rest=items.filter(i=>i.id!==id)
    storage.setItem(STORAGE_KEY,JSON.stringify({version:1,items:[next,...rest].slice(0,MAX_ITEMS)}))
    return true
  } catch{return false}
}
export function deleteLocalNewsLibraryItem(storage: NewsLibraryStorage,id:string):boolean {
  try{const items=listLocalNewsLibrary(storage);storage.setItem(STORAGE_KEY,JSON.stringify({version:1,items:items.filter(i=>i.id!==id)}));return true}catch{return false}
}
