import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Layers, CheckCircle2, AlertCircle, Plus, Tag } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';

export const AddStuffModal = () => {
  const { isAddStuffOpen, setIsAddStuffOpen, stuffs, addStuff } = useApp();

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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Jacket Stuffs & Fabrics</h2>
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
        <div className="p-5 sm:p-6 space-y-3.5">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Add form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={stuffName}
              onChange={(e) => setStuffName(e.target.value)}
              placeholder="e.g. Parachute (Waterproof), Fleece, Leather..."
              autoFocus
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Available Stuffs List */}
          <div className="pt-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
              Current Available Fabrics / Stuffs ({stuffs.length})
            </span>

            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
              {stuffs.map((st, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs border border-purple-200 dark:border-purple-800/50"
                >
                  <Tag className="w-3 h-3 text-purple-400" />
                  {st}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsAddStuffOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
