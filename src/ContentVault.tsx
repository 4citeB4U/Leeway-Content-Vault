/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.CONTENT_VAULT.UI
 * TAG: LEEWAY.CONTENT_VAULT.UI.FOUNDRY_EXTRACTION
 * WHAT: The original Foundry ContentWallet UI adapted to a standalone full-page Content Vault.
 * WHY: Preserve the actual owner-authored vault interaction and visual design without the unrelated Foundry orchestration shell.
 * WHO: LeeWay Content Vault engineering under Creator authority.
 * WHERE: src/ContentVault.tsx
 * WHEN: 2026-11-04
 * HOW: Extract from Foundry src/App.tsx lines 581–764, with standalone layout and artifact inspection controls.
 * LICENSE: Original source contains mixed proprietary and Apache-2.0 notices; provenance preserved.
 */
import React, {useRef, useState} from 'react';
import {motion} from 'motion/react';
import {Wallet, X, CloudUpload, Search, Database} from 'lucide-react';
import type {ContentItem, ContentItemType, VaultSettings, HandoffDestination} from './types';

export const ContentVault = ({ 
  onClose, 
  onDragStart, 
  settings,
  content: walletContent,
  onUpload,
  onCreateHandoff,
  onInspect,
  onDownload,
  onRemove
}: { 
  onClose: () => void, 
  onDragStart: (item: ContentItem) => void,
  settings: VaultSettings,
  content: ContentItem[],
  onUpload: (file: File) => void,
  onCreateHandoff: (destination: HandoffDestination, item: ContentItem) => void,
  onInspect: (item: ContentItem) => void,
  onDownload: (item: ContentItem) => void,
  onRemove: (item: ContentItem) => void
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ContentItemType>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredContent = walletContent.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.beastId.toLowerCase().includes(search.toLowerCase()) ||
                          item.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="relative h-full min-h-0 w-full flex flex-col border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl"
      style={{ backgroundColor: settings.leftPanelBg, borderRadius: settings.buttonRounding }}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-brand-primary" style={{ color: settings.accentColor }} />
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-white">Content Vault</h2>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-slate-500">Project working set • inspect, download, or stage a handoff</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-24 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept="video/*,audio/*,application/pdf,image/*,.txt,.md,.json,.docx,.odt,.pptx,.xlsx"
          />
          <CloudUpload size={24} className="text-slate-500 group-hover:text-brand-primary transition-colors" />
          <div className="text-center">
          <p className="text-[9px] font-black uppercase text-white tracking-widest">Add to Content Vault</p>
            <p className="text-[7px] text-slate-500 font-bold uppercase mt-0.5">Documents, Video, Audio, Images, Data</p>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by ID, Name, Date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-[10px] text-slate-300 outline-none focus:border-brand-primary/50 transition-all font-bold"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(['all', 'video', 'audio', 'image', 'short', 'thumbnail', 'pdf', 'blog', 'post', 'manifest'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-[8px] font-bold uppercase rounded-md border transition-all ${filter === f ? 'bg-brand-primary/20 border-brand-primary/40 text-brand-primary' : 'bg-transparent border-white/5 text-slate-500'}`}
              style={{ 
                color: filter === f ? settings.accentColor : undefined,
                borderColor: filter === f ? settings.accentColor + '40' : undefined
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 content-start custom-scrollbar">
        {filteredContent.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            draggable
            onDragStart={(event) => {
              if ('dataTransfer' in event && event.dataTransfer) {
                event.dataTransfer.setData('application/leeway-content-vault', JSON.stringify(item));
                event.dataTransfer.effectAllowed = 'copy';
              }
              onDragStart(item);
            }}
            className="group bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden hover:border-brand-primary/30 transition-all cursor-grab active:cursor-grabbing"
          >
            {/* Media Preview Header */}
            {item.previewUrl ? (
              <div className="h-20 w-full relative overflow-hidden bg-black">
                <img src={item.previewUrl} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[7px] font-black text-white uppercase tracking-tighter">Live Preview</span>
                </div>
              </div>
            ) : (
              <div className="h-12 w-full bg-slate-800/40 flex items-center justify-center border-b border-white/5">
                <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">No Media Preview</div>
              </div>
            )}
            
            <div className="p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[9px] font-black text-brand-primary px-1.5 py-0.5 rounded bg-brand-primary/10" style={{ color: settings.accentColor, backgroundColor: settings.accentColor + '10' }}>
                  {item.beastId}
                </span>
                <span className="text-[8px] text-slate-500">{item.timestamp}</span>
              </div>
              <h3 className="text-[10px] font-bold text-slate-200 truncate">{item.name}</h3>
              <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1">{item.category}</p>
              
              {item.type === 'blog' && item.content && (
                <div className="mt-2 p-2 bg-black/30 rounded border border-white/5">
                  <p className="text-[8px] text-slate-400 italic line-clamp-2">"{item.content}"</p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-2">
                 <button type="button" onClick={() => onInspect(item)} className="rounded-md border border-white/10 px-2 py-1.5 text-[8px] font-black uppercase text-slate-200" title="Inspect artifact">Inspect</button>
                 <button type="button" onClick={() => onDownload(item)} className="rounded-md border border-white/10 px-2 py-1.5 text-[8px] font-black uppercase text-slate-200" title="Download artifact">Download</button>
                 <button type="button" onClick={() => onRemove(item)} className="rounded-md border border-rose-500/30 px-2 py-1.5 text-[8px] font-black uppercase text-rose-300" title="Remove artifact">Remove</button>
                <button
                  type="button"
                  onClick={() => onCreateHandoff('office-suites', item)}
                  className="flex-1 rounded-md border border-cyan-400/20 bg-cyan-400/5 px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-400/15"
                >
                  Send to Office
                </button>
                <button
                  type="button"
                  onClick={() => onCreateHandoff('leeway-ide', item)}
                  className="flex-1 rounded-md border border-violet-400/20 bg-violet-400/5 px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-violet-300 transition-colors hover:bg-violet-400/15"
                >
                  Send to IDE
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredContent.length === 0 && (
          <div className="text-center py-10">
            <Search size={24} className="mx-auto text-slate-800 mb-2" />
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No records found</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-black/40 border-t border-white/5">
        <div className="flex items-center gap-2 opacity-60">
          <Database size={10} className="text-slate-400" />
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Vault: {walletContent.length} active artifact{walletContent.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </motion.div>
  );
};
