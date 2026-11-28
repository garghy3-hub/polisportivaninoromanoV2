import {describe,it,expect} from 'vitest'
import {addImageAsset,readImageLibrary,type ImageStorage} from '../src/lib/news-image-library'
function mock():ImageStorage{const m=new Map<string,string>();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>{m.set(k,v)}}}
const KEY='nino-romano-v2-image-library'
describe('local image collection',()=>{
it('adds, validates and reads an asset',()=>{const s=mock();expect(addImageAsset(s,'https://example.com/a.jpg','Foto squadra','2026-11-27T10:00:00Z')).toBe(true);const r=readImageLibrary(s);expect(r.ok).toBe(true);if(r.ok)expect(r.items[0]).toMatchObject({url:'https://example.com/a.jpg',alt:'Foto squadra'})})
it('rejects unsafe URLs and invalid alt text without writes',()=>{const s=mock();expect(addImageAsset(s,'javascript:alert(1)','alt')).toBe(false);expect(addImageAsset(s,'https://example.com/a.jpg','a'.repeat(201))).toBe(false);expect(readImageLibrary(s)).toEqual({ok:true,items:[]})})
it('ignores duplicate URLs',()=>{const s=mock();addImageAsset(s,'https://example.com/a.jpg','Foto');addImageAsset(s,'https://example.com/a.jpg','Foto 2');const r=readImageLibrary(s);if(r.ok)expect(r.items).toHaveLength(1)})
it('caps collection at 100 assets',()=>{const s=mock();for(let i=0;i<100;i++)expect(addImageAsset(s,'https://example.com/'+i+'.jpg','Foto '+i,'2026-11-27T10:00:00Z')).toBe(true);expect(addImageAsset(s,'https://example.com/101.jpg','Foto extra')).toBe(false);const r=readImageLibrary(s);if(r.ok)expect(r.items).toHaveLength(100)})
it('fails closed on corrupted data',()=>{const s=mock();s.setItem(KEY,'broken');expect(readImageLibrary(s).ok).toBe(false);expect(addImageAsset(s,'https://example.com/a.jpg','Foto')).toBe(false);expect(s.getItem(KEY)).toBe('broken')})
it('rejects malformed entries and duplicate IDs',()=>{const s=mock();s.setItem(KEY,JSON.stringify({version:1,items:[{id:'x',url:'https://example.com/a.jpg',alt:'',addedAt:'2026-11-27T10:00:00Z'},{id:'x',url:'https://example.com/b.jpg',alt:'',addedAt:'2026-11-27T10:00:00Z'}]}));expect(readImageLibrary(s).ok).toBe(false)})
it('fails safely on storage exceptions',()=>{const s:ImageStorage={getItem(){throw Error()},setItem(){throw Error()}};expect(readImageLibrary(s).ok).toBe(false);expect(addImageAsset(s,'https://example.com/a.jpg','Foto')).toBe(false)})
})
