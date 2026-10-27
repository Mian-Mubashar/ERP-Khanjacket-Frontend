import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, AlertCircle, CheckCircle2, Boxes, Layers, MapPin } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';

export const AddArticleModal = () => {
  const {
    isAddArticleOpen,
    setIsAddArticleOpen,
    addArticle,
    categories,
    stuffs,
    warehouseLocations,
    setIsAddStuffOpen,
    setIsAddCategoryOpen,
    setIsAddLocationOpen
  } = useApp();

  const [formData, setFormData] = useState({
    articleNo: '',
    name: '',
    category: categories[0] || 'Jacket',
    stuff: stuffs[0] || 'Parachute (Waterproof)',
    initialStock: '',
    unitCost: '',
    minAlertStock: '150',
    warehouseLocation: warehouseLocations[0] || '',
    description: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-select latest category when one is added dynamically
  const prevCatCount = useRef(categories.length);
  useEffect(() => {
    if (categories.length > prevCatCount.current) {
      const latest = categories[categories.length - 1];
      if (latest) {
        setFormData(prev => ({ ...prev, category: latest }));
      }
    }
    prevCatCount.current = categories.length;
  }, [categories]);

  // Auto-select latest warehouse location when one is added dynamically
  const prevLocCount = useRef(warehouseLocations.length);
  useEffect(() => {
    if (warehouseLocations.length > prevLocCount.current) {
      const latest = warehouseLocations[warehouseLocations.length - 1];
      if (latest) {
        setFormData(prev => ({ ...prev, warehouseLocation: latest }));
      }
    }
    prevLocCount.current = warehouseLocations.length;
  }, [warehouseLocations]);

  // Set default location if previously empty when locations load
  useEffect(() => {
    if (!formData.warehouseLocation && warehouseLocations.length > 0) {
      setFormData(prev => ({ ...prev, warehouseLocation: warehouseLocations[0] }));
    }
  }, [warehouseLocations]);

  if (!isAddArticleOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.articleNo.trim()) {
      showError('Required Field', 'Article Code / Number is required (e.g. BF411, A012).');
      setError('Article Code / Number is required (e.g. BF411, A012).');
      return;
    }

    if (!formData.name.trim()) {
      showError('Required Field', 'Article Name is required.');
      setError('Article Name is required.');
      return;
    }

    const payload = {
      ...formData,
      articleNo: formData.articleNo.trim().toUpperCase(),
      name: formData.name.trim(),
      initialStock: Number(formData.initialStock) || 0,
      unitCost: Number(formData.unitCost) || 0,
      minAlertStock: Number(formData.minAlertStock) || 100,
      warehouseLocation: formData.warehouseLocation?.trim() || ''
    };

    const res = await addArticle(payload);
    if (!res || !res.success) {
      showError('Cannot Add Article', res?.message || 'Error creating article');
      setError(res?.message || 'Error creating article');
      return;
    }

    showToast(`Article ${formData.articleNo.toUpperCase()} created successfully!`, 'success');
    setIsAddArticleOpen(false);
    setFormData({
      articleNo: '',
      name: '',
      category: categories[0] || 'Jacket',
      stuff: stuffs[0] || 'Parachute (Waterproof)',
      initialStock: '',
      unitCost: '',
      minAlertStock: '150',
      warehouseLocation: warehouseLocations[0] || '',
      description: ''
    });
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Fixed */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <Boxes className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add New Article</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Register unique Article Code with Jacket Stuff / Fabric for China imports
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddArticleOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          
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

          {/* Row 1: Article Code & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Article Code / Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BF411, A012, JK205"
                value={formData.articleNo}
                onChange={e => setFormData({ ...formData, articleNo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-hidden uppercase transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add New</span>
                </button>
              </div>
              <select
                value={formData.category}
                onChange={e => {
                  if (e.target.value === '__NEW__') {
                    setIsAddCategoryOpen(true);
                  } else {
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__NEW__">+ Add New Category...</option>
              </select>
            </div>
          </div>

          {/* Row 2: Stuff / Fabric Material & Article Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>Stuff / Fabric (Kapra)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddStuffOpen(true)}
                  className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add New</span>
                </button>
              </div>
              <select
                value={formData.stuff}
                onChange={e => setFormData({ ...formData, stuff: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-purple-200 dark:border-purple-900/60 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:border-purple-600 outline-hidden transition-all"
              >
                {stuffs.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Article Description / Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Men's Waterproof Down Puffer Jacket"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Row 3: Initial Stock & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Opening Stock (Pieces)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0 pcs (agar pehlay se pada ho)"
                value={formData.initialStock}
                onChange={e => setFormData({ ...formData, initialStock: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Cost (PKR per Piece)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 2650"
                value={formData.unitCost}
                onChange={e => setFormData({ ...formData, unitCost: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Row 4: Warehouse Location / Rack & Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Warehouse Rack / Godown</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddLocationOpen(true)}
                  className="text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add New</span>
                </button>
              </div>

              <select
                value={formData.warehouseLocation}
                onChange={e => {
                  if (e.target.value === '__NEW__') {
                    setIsAddLocationOpen(true);
                  } else {
                    setFormData({ ...formData, warehouseLocation: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:border-amber-500 outline-hidden transition-all"
              >
                <option value="">-- Select Storage Rack / Location --</option>
                {warehouseLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                <option value="__NEW__">+ Add New Location / Rack...</option>
              </select>

              {warehouseLocations.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5 overflow-x-auto text-[10px] pb-0.5">
                  {warehouseLocations.slice(0, 6).map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setFormData({ ...formData, warehouseLocation: loc })}
                      className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer border ${
                        formData.warehouseLocation === loc
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specifications & Notes (Ikhtiyari)
              </label>
              <input
                type="text"
                placeholder="e.g. Thermal lining, export quality"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Compact Wholesale Note */}
          <div className="px-3 py-1.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 text-[11px] flex items-center gap-2">
            <span className="shrink-0 font-bold">📦 Wholesale Note:</span>
            <span className="truncate">Garments master cartons me aate hain (Size / Color fields ki zaroorat nahi hoti).</span>
          </div>

          {/* Footer buttons */}
          <div className="pt-2.5 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 px-5 sm:px-6 py-3 mt-2 shadow-xs">
            <button
              type="button"
              onClick={() => setIsAddArticleOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Save Article
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
