import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Search, ScanBarcode, ChevronRight, MapPin } from 'lucide-react';

export const QuickArticleSearchModal = () => {
  const { 
    isQuickSearchOpen, 
    setIsQuickSearchOpen, 
    articles, 
    setSelectedArticleDetail 
  } = useApp();

  const [term, setTerm] = useState('');

  // Keyboard shortcut listener: '/' opens barcode & quick article search modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsQuickSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsQuickSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsQuickSearchOpen]);

  if (!isQuickSearchOpen) return null;

  const filtered = articles.filter(a =>
    a.articleNo.toLowerCase().includes(term.toLowerCase()) ||
    a.name.toLowerCase().includes(term.toLowerCase()) ||
    a.category.toLowerCase().includes(term.toLowerCase()) ||
    (a.warehouseLocation && a.warehouseLocation.toLowerCase().includes(term.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Search Input Bar with ScanBarcode Squircle */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <ScanBarcode className="w-5 h-5" />
          </div>
          <input
            type="text"
            autoFocus
            placeholder="Type Article Code (e.g. BF411, A012, JK205) or Description..."
            value={term}
            onChange={e => setTerm(e.target.value)}
            className="w-full text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-hidden bg-transparent"
          />
          <button
            onClick={() => setIsQuickSearchOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Results List */}
        <div className="p-3 max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching article found for "{term}".
            </div>
          ) : (
            filtered.map((art) => (
              <div
                key={art.articleNo}
                onClick={() => {
                  setSelectedArticleDetail(art);
                  setIsQuickSearchOpen(false);
                }}
                className="py-3 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {art.articleNo}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {art.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                      <span>{art.category}</span>
                      <span>•</span>
                      <span>Cost: Rs. {art.unitCost?.toLocaleString()}</span>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 font-mono">
                        <MapPin className="w-2.5 h-2.5 text-amber-500" />
                        <span>{art.warehouseLocation || 'Main Godown - Hall A'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {art.currentStock?.toLocaleString()} pcs
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Inward: {art.totalPurchased} | Out: {art.totalOut}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Shortcut hint footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono shadow-2xs text-[10px]">ESC</kbd> to exit</span>
          <span>Click any article to open full purchase & outward ledger</span>
        </div>

      </div>
    </div>
  );
};
