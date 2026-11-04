/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.CONTENT_VAULT.STORAGE
 * TAG: LEEWAY.CONTENT_VAULT.STORAGE.LOCAL
 * WHAT: Persist native artifact blobs and portable working-set metadata in browser storage.
 * WHY: Preserve actual uploaded bytes instead of only simulated artifact cards or base64-limited localStorage.
 * WHO: LeeWay Content Vault engineering under Creator authority.
 * WHERE: src/vaultStorage.ts
 * WHEN: 2026-11-04
 * HOW: IndexedDB byte store and schema-validated, browser-local metadata projection.
 * LICENSE: Original Foundry source identity and license notices retained separately.
 */
import type {ContentItem} from './types';
const DB = 'leeway-content-vault-v1';
const STORE = 'artifacts';
const KEY = 'leeway.content-vault.records.v1';

export function readRecords(): ContentItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is ContentItem => Boolean(entry) && typeof entry === 'object' && typeof entry.id === 'string' && typeof entry.name === 'string' && typeof entry.beastId === 'string' && typeof entry.type === 'string');
  } catch {
    return [];
  }
}
export function saveRecords(items: ContentItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items.map(({previewUrl, fileData, ...rest}) => rest)));
}
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB is unavailable in this browser')); return; }
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open Vault storage'));
  });
}
async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, resolve: (v:T)=>void, reject:(e:Error)=>void)=>void): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve,reject) => {
    const tx = db.transaction(STORE, mode);
    let complete = false;
    const finish = (value:T) => {complete = true; resolve(value);};
    const fail = (err:Error) => {if(!complete) reject(err);};
    tx.oncomplete = () => db.close();
    tx.onabort = () => { db.close(); fail(tx.error || new Error('Vault operation aborted')); };
    tx.onerror = () => fail(tx.error || new Error('Vault transaction failed'));
    run(tx.objectStore(STORE),finish,fail);
  });
}
export async function writeBlob(id:string, blob:Blob):Promise<void> {
  await transaction<void>('readwrite',(store,resolve,reject)=>{
    const request=store.put(blob,id);
    request.onsuccess=()=>resolve();
    request.onerror=()=>reject(request.error || new Error('Unable to save file'));
  });
}
export async function readBlob(id:string):Promise<Blob|null> {
  return transaction<Blob|null>('readonly',(store,resolve,reject)=>{
    const request=store.get(id);
    request.onsuccess=()=>resolve(request.result instanceof Blob ? request.result : null);
    request.onerror=()=>reject(request.error || new Error('Unable to read file'));
  });
}
export async function removeBlob(id:string):Promise<void> {
  await transaction<void>('readwrite',(store,resolve,reject)=>{
    const request=store.delete(id);
    request.onsuccess=()=>resolve();
    request.onerror=()=>reject(request.error || new Error('Unable to remove file'));
  });
}
export async function dataUrlToBlob(data:string):Promise<Blob> {
  if (!/^data:[^,]*;base64,/.test(data)) throw new Error('Unsupported embedded file format');
  const response=await fetch(data);
  return response.blob();
}
export async function blobToDataUrl(blob:Blob):Promise<string> {
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result));
    reader.onerror=()=>reject(reader.error || new Error('Unable to export artifact'));
    reader.readAsDataURL(blob);
  });
}
