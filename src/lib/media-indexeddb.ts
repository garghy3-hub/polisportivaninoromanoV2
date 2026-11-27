const DB_NAME = 'nino-romano-media'
const DB_VERSION = 1
const STORE = 'assets'
export type StoredMedia = { id: string; blob: Blob; name: string; type: string; alt: string; caption: string; addedAt: string }
function openDb(): Promise<IDBDatabase> {
 return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
}
export async function listStoredMedia():Promise<StoredMedia[]> {const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result as StoredMedia[]);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close()})}
export async function saveStoredMedia(item:StoredMedia):Promise<void>{const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
export async function deleteStoredMedia(id:string):Promise<void>{const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
