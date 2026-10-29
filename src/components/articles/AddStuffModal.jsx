import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Layers, CheckCircle2, AlertCircle, Plus, Tag } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';

export const AddStuffModal = () => {
  const { isAddStuffOpen, setIsAddStuffOpen, stuffs = [], addStuff } = useApp();

  const [stuffName, setStuffName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAddStuffOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!stuffName.trim()) {
      showError('Required Field', 'Stuff / fabric name is required (e.g. Parachute, Fleece, Leather).');
      setError('Stuff / fabric name is required (e.g. Parachute, Fleece, Leather).');
      return;
    }

    const res = await addStuff(stuffName.trim());
    if (!res || !res.success) {
      showError('Cannot Add Stuff', res?.message || 'Error adding fabric');
      setError(res?.message || 'Error adding fabric');
      return;
    }

    showToast(`Fabric / Stuff "${stuffName.trim()}" added to catalog!`, 'success');
    setStuffName('');
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Jacket Stuffs & Fabrics</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage garment fabric types (Parachute, Fleece, Leather, Puffer)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddStuffOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Add form */}
          <form onSubmit={handleSubmit} className="flex gap-2.5">
            <input
              type="text"
              value={stuffName}
              onChange={(e) => setStuffName(e.target.value)}
              placeholder="e.g. Parachute (Waterproof), Fleece, Leather, Puffer..."
              autoFocus
              className="flex-1 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stuff</span>
            </button>
          </form>

          {/* Available Stuffs List */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Current Available Fabrics / Stuffs ({stuffs.length})
            </span>

            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
              {stuffs.map((st, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  {st}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsAddStuffOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
