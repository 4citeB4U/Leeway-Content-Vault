/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.CONTENT_VAULT.APP
 * TAG: LEEWAY.CONTENT_VAULT.APP.STANDALONE
 * WHAT: Standalone host for the real Content Foundry Vault component.
 * WHY: Make artifact upload, inspection, download, search, staged handoffs and portability available from its own repository.
 * WHO: LeeWay Content Vault engineering under Creator authority.
 * WHERE: src/App.tsx
 * WHEN: 2026-11-04
 * HOW: Reuse Foundry ContentWallet with browser-local storage and its documented handoff contract.
 * LICENSE: Retains source provenance; verify mixed upstream license notices before external redistribution.
 */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {FolderOpen, Import, Download, ShieldAlert, Database, X, Upload, ArrowLeft} from 'lucide-react';
import {ContentVault} from './ContentVault';
import {buildHandoffPacket, createArtifactId, downloadJson, type FoundryHandoffPacket} from './foundry/contracts';
import type {ContentItem, ContentItemType, HandoffDestination, VaultSettings} from './types';
import {blobToDataUrl, dataUrlToBlob, readBlob, readRecords, removeBlob, saveRecords, writeBlob} from './vaultStorage';

const settings: VaultSettings = {leftPanelBg:'#0b1120', buttonRounding:16, accentColor:'#22d3ee'};
const DEFAULT_PROJECT = 'LEEWAY-CONTENT-VAULT';
const storageProjectKey = 'leeway.content-vault.project.v1';
const newId = () => globalThis.crypto?.randomUUID?.() || `vault-${Date.now()}-${Math.random().toString(36).slice(2)}`;
function typeFor(file: File): ContentItemType {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if(file.type.startsWith('video/')) return 'video';
  if(file.type.startsWith('audio/')) return 'audio';
  if(file.type.startsWith('image/')) return 'image';
  if(ext === 'pdf') return 'pdf';
  if(['txt','md','docx','odt','rtf','html'].includes(ext)) return 'blog';
  if(['json','csv','xlsx','ods','pptx','odp'].includes(ext)) return 'manifest';
  return 'post';
}
function saveAs(blob:Blob, name:string) {
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=name;
  anchor.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const readable = (type:string) => type.startsWith('text/') || type === 'application/json';
export default function App() {
  const [items,setItems]=useState<ContentItem[]>(readRecords);
  const [projectId,setProjectId]=useState(()=>{try{return localStorage.getItem(storageProjectKey)||DEFAULT_PROJECT;}catch{return DEFAULT_PROJECT;}});
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [inspect,setInspect]=useState<ContentItem|null>(null);
  const [showVault,setShowVault]=useState(true);
  const [previews,setPreviews]=useState<Record<string,string>>({});
  const [saving,setSaving]=useState(false);
  const importRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    try{saveRecords(items);localStorage.setItem(storageProjectKey,projectId);}catch(e){setError('Vault metadata could not be saved. Browser storage may be full or disabled.');}
  },[items,projectId]);
  useEffect(()=>{
    let alive=true;
    const urls:string[]=[];
    void Promise.all(items.map(async item=>{
      try{
        const blob=await readBlob(item.id);
        if(!blob||!alive||!blob.type.startsWith('image/')) return;
        const url=URL.createObjectURL(blob);
        urls.push(url);
        if(alive)setPreviews(prev=>({...prev,[item.id]:url}));
      }catch { /* Record remains visible even when its associated byte store is unavailable. */ }
    }));
    return()=>{alive=false;urls.forEach(url=>URL.revokeObjectURL(url));};
  },[items]);
  const displayItems=useMemo(()=>items.map(item=>({...item,previewUrl:previews[item.id]||item.previewUrl})),[items,previews]);
  const addFile=async(file:File)=>{
    setError('');setSaving(true);
    try{
      const id=newId();
      await writeBlob(id,file);
      const type=typeFor(file);
      const item:ContentItem={
        id,beastId:`LEEWAY-${type.toUpperCase().slice(0,3)}-${id.slice(0,8).toUpperCase()}`,
        artifactId:createArtifactId(file.name),version:1,projectId,sourceApp:'content-foundry',
        status:'available',type,name:file.name,mimeType:file.type||'application/octet-stream',
        category:'Uploaded',timestamp:new Date().toISOString()
      };
      setItems(prev=>[item,...prev]);
      setNotice(`Stored ${file.name} locally. The file bytes were saved in this browser.`);
    }catch(e){setError(e instanceof Error?e.message:'File upload failed');}
    finally{setSaving(false);}
  };
  const removeItem=async(item:ContentItem)=>{
    if(!window.confirm(`Remove "${item.name}" from this browser Vault? This will delete its locally stored bytes.`))return;
    try{await removeBlob(item.id);setItems(prev=>prev.filter(v=>v.id!==item.id));setInspect(current=>current?.id===item.id?null:current);setNotice(`Removed ${item.name}.`);}
    catch(e){setError(e instanceof Error?e.message:'Unable to remove item');}
  };
  const downloadItem=async(item:ContentItem)=>{
    try{
      let blob=await readBlob(item.id);
      if(!blob&&item.fileData)blob=await dataUrlToBlob(item.fileData);
      if(!blob&&item.content)blob=new Blob([item.content],{type:item.mimeType||'text/plain'});
      if(!blob)throw new Error('The Vault has a reference to this artifact, but its file bytes are not available in this browser.');
      saveAs(blob,item.name);
    }catch(e){setError(e instanceof Error?e.message:'Download failed');}
  };
  const stageHandoff=(destination:HandoffDestination,item:ContentItem)=>{
    try{
      const packet=buildHandoffPacket({destination,projectId:item.projectId||projectId,item,nodes:[],edges:[]});
      downloadJson(`leeway-${destination}-handoff-${packet.handoffId}.json`,packet);
      const receiptItem:ContentItem={id:newId(),beastId:packet.handoffId,artifactId:createArtifactId(),
        version:1,projectId,type:'manifest',name:`Handoff to ${destination} — ${item.name}.json`,
        category:'Staged Handoff',timestamp:new Date().toISOString(),status:'handoff-staged',mimeType:'application/json',
        content:JSON.stringify(packet,null,2),sourceApp:'content-foundry'};
      setItems(prev=>[receiptItem,...prev.map(existing=>existing.id===item.id?{...existing,status:'handoff-staged' as const,lastHandoffDestination:destination}:existing)]);
      setNotice('Handoff packet downloaded and staged. No remote delivery or execution has been claimed.');
    }catch(e){setError(e instanceof Error?e.message:'Handoff staging failed');}
  };
  const importWorkspace=async(file:File)=>{
    setError('');setSaving(true);
    try{
      const raw=JSON.parse(await file.text()) as Record<string,unknown>;
      const records=Array.isArray(raw.walletContent)?raw.walletContent:Array.isArray(raw.items)?raw.items:null;
      if(!records)throw new Error('Not a supported Foundry workspace or Content Vault export: walletContent or items array missing.');
      const imported:ContentItem[]=[];
      let metadataOnly=0;
      for(const original of records.slice(0,5000)){
        if(!original||typeof original!=='object')continue;
        const value=original as Record<string,unknown>;
        if(typeof value.name!=='string'||typeof value.type!=='string')continue;
        const id=typeof value.id==='string'&&value.id?value.id:newId();
        const item:ContentItem={id,beastId:String(value.beastId||value.artifactId||createArtifactId()),artifactId:typeof value.artifactId==='string'?value.artifactId:createArtifactId(),
          version:typeof value.version==='number'?value.version:1,projectId:typeof value.projectId==='string'?value.projectId:projectId,
          sourceApp:'content-foundry',status:'available',
          type:((['video','audio','pdf','blog','short','thumbnail','image','post','manifest'].includes(value.type))?value.type:'post') as ContentItemType,
          name:value.name,mimeType:typeof value.mimeType==='string'?value.mimeType:undefined,
          category:typeof value.category==='string'?value.category:'Imported',
          timestamp:typeof value.timestamp==='string'?value.timestamp:new Date().toISOString(),
          content:typeof value.content==='string'?value.content:undefined};
        if(typeof value.fileData==='string'&&value.fileData.startsWith('data:')){
          try{await writeBlob(id,await dataUrlToBlob(value.fileData));}
          catch{metadataOnly++;}
        }else if(!(await readBlob(id))&&!item.content)metadataOnly++;
        imported.push(item);
      }
      if(!imported.length)throw new Error('The supplied workspace contained no valid artifact records.');
      setItems(previous=>[...imported,...previous.filter(old=>!imported.some(next=>next.id===old.id))]);
      setNotice(`Imported ${imported.length} Foundry Vault records. ${metadataOnly} are metadata-only or have unavailable file bytes.`);
    }catch(e){setError(e instanceof Error?e.message:'Workspace import failed');}
    finally{setSaving(false);}
  };
  const exportWorkspace=async()=>{
    setSaving(true);setError('');
    try{
      const records=await Promise.all(items.map(async item=>{
        const file=await readBlob(item.id);
        return {...item,previewUrl:undefined,fileData:file?await blobToDataUrl(file):item.fileData};
      }));
      downloadJson('leeway-content-vault-workspace.json',{schemaVersion:1,projectId,walletContent:records,nodes:[],edges:[],createdItems:[],settings:{},camera:{x:0,y:0,zoom:1},handoffs:[]});
      setNotice('Portable workspace exported with available local file bytes. Keep this file secure.');
    }catch(e){setError(e instanceof Error?e.message:'Workspace export failed');}
    finally{setSaving(false);}
  };
  return <div className="h-screen min-h-0 bg-[#050a14] text-white flex flex-col">
    <header className="border-b border-cyan-500/20 bg-[#090f20] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><div className="rounded-xl border border-cyan-400/40 bg-cyan-950/40 p-2"><FolderOpen className="h-6 w-6 text-cyan-300"/></div><div><h1 className="text-xl font-black tracking-wide">LEEWAY CONTENT VAULT</h1><p className="text-xs text-slate-400">Extracted from LeeWay Agentic Content Foundry • independent workspace</p></div></div>
      <div className="flex flex-wrap gap-2 text-xs">
        <button onClick={()=>setShowVault(v=>!v)} className="rounded-lg border border-cyan-500/30 bg-slate-900 px-3 py-2">{showVault?'Overview':'Open Vault'}</button>
        <button onClick={()=>importRef.current?.click()} disabled={saving} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 flex items-center gap-1"><Import size={14}/> Import Foundry Workspace</button>
        <button onClick={()=>void exportWorkspace()} disabled={saving} className="rounded-lg bg-cyan-700 px-3 py-2 flex items-center gap-1"><Download size={14}/> Export Vault</button>
      </div>
    </header>
    <input type="file" ref={importRef} accept=".json,application/json" className="hidden" onChange={event=>{const file=event.target.files?.[0];if(file)void importWorkspace(file);event.target.value='';}} />
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-2 text-xs bg-[#070d19]">
      <label className="flex items-center gap-2 text-slate-300">Project <input value={projectId} maxLength={120} onChange={e=>setProjectId(e.target.value)} className="w-56 max-w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-cyan-200"/></label>
      <span className="flex items-center gap-2 text-slate-400"><Database size={14}/> {items.length} artifact records • browser-local IndexedDB + metadata</span>
    </div>
    {error&&<div role="alert" className="flex items-center justify-between gap-3 border-b border-rose-500/40 bg-rose-950/70 px-4 py-2 text-sm text-rose-200">{error}<button onClick={()=>setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
    {notice&&<div role="status" className="flex items-center justify-between gap-3 border-b border-cyan-500/30 bg-cyan-950/40 px-4 py-2 text-xs text-cyan-100">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notice"><X size={15}/></button></div>}
    <main className="min-h-0 flex-1 p-3 md:p-5">
      {showVault?<ContentVault settings={settings} content={displayItems} onClose={()=>setShowVault(false)}
        onDragStart={item=>setNotice(`Drag payload prepared for ${item.name}. Cross-application delivery is not automatic.`)}
        onUpload={file=>void addFile(file)} onCreateHandoff={stageHandoff} onInspect={setInspect}
        onDownload={item=>void downloadItem(item)} onRemove={item=>void removeItem(item)}/>:
        <div className="mx-auto max-w-3xl space-y-6 p-8">
          <h2 className="text-2xl font-black">Vault Operations</h2>
          <p className="text-slate-300">The canonical Foundry Vault panel is preserved in this application. Upload real artifacts, search and filter, inspect files, download them, or stage an Office Suites / IDE handoff packet.</p>
          <button onClick={()=>setShowVault(true)} className="rounded-lg bg-cyan-700 px-5 py-3 font-bold">Open Content Vault</button>
          <div className="rounded-xl border border-amber-500/30 p-5 text-sm text-amber-200 flex items-start gap-3"><ShieldAlert size={18}/><p>Continuum live synchronization is not established. Browser storage belongs to this site's origin. Existing Foundry items need a portable workspace export to move here, including their file bytes.</p></div>
        </div>}
    </main>
    {inspect&&<div role="dialog" aria-modal="true" aria-label="Artifact inspector" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/30 bg-[#0b1324] p-5 space-y-4">
        <div className="flex justify-between gap-4"><div><h2 className="text-xl font-bold">{inspect.name}</h2><p className="text-xs text-slate-400">{inspect.beastId} • {inspect.mimeType||inspect.type}</p></div><button onClick={()=>setInspect(null)} aria-label="Close artifact inspector"><X size={22}/></button></div>
        {previews[inspect.id]&&inspect.mimeType?.startsWith('image/')&&<img src={previews[inspect.id]} alt={inspect.name} className="max-h-[55vh] w-full object-contain rounded-xl"/>}
        {previews[inspect.id]&&inspect.mimeType?.startsWith('video/')&&<video src={previews[inspect.id]} controls className="w-full"/>}
        {previews[inspect.id]&&inspect.mimeType?.startsWith('audio/')&&<audio src={previews[inspect.id]} controls className="w-full"/>}
        {inspect.content&&<pre className="max-h-[45vh] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-sm">{inspect.content}</pre>}
        <p className="text-xs text-slate-400">This is a local artifact inspector. Unsupported binary types remain downloadable; no synthetic previews are generated.</p>
        <button onClick={()=>void downloadItem(inspect)} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold">Download original file</button>
      </div>
    </div>}
    <footer className="border-t border-slate-800 px-4 py-2 text-[10px] text-slate-500">SOURCE_IMPLEMENTED only until a live browser / CI test passes • local artifacts are not Continuum-synced • handoffs are staged packets, not delivered actions</footer>
  </div>;
}
