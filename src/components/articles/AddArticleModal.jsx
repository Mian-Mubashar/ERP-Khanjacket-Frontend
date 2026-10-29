import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle, CheckCircle2, Boxes, Plus } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatLakhCrore } from '../../utils/formatters';

export const AddArticleModal = () => {
  const { 
    isAddArticleOpen, 
    setIsAddArticleOpen, 
    addArticle, 
    categories = [], 
    stuffs = [], 
    warehouseLocations = [],
    setIsAddStuffOpen,
    setIsAddLocationOpen,
    setIsAddCategoryOpen
  } = useApp();

  const [formData, setFormData] = useState({
    articleNo: '',
    name: '',
    category: categories[0] || 'Jacket',
    stuff: stuffs[0] || 'Parachute (Waterproof)',
    initialStock: '',
    unitCost: '',
    minAlertStock: '150',
    warehouseLocation: warehouseLocations[0] || 'Main Godown - Hall A',
    description: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-select latest category if newly added
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

  // Auto-select latest stuff if newly added
  const prevStuffCount = useRef(stuffs.length);
  useEffect(() => {
    if (stuffs.length > prevStuffCount.current) {
      const latest = stuffs[stuffs.length - 1];
      if (latest) {
        setFormData(prev => ({ ...prev, stuff: latest }));
      }
    }
    prevStuffCount.current = stuffs.length;
  }, [stuffs]);

  // Auto-select latest location if newly added
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

  useEffect(() => {
    if (isAddArticleOpen) {
      setFormData({
        articleNo: '',
        name: '',
        category: categories[0] || 'Jacket',
        stuff: stuffs[0] || 'Parachute (Waterproof)',
        initialStock: '',
        unitCost: '',
        minAlertStock: '150',
        warehouseLocation: warehouseLocations[0] || 'Main Godown - Hall A',
        description: ''
      });
      setError('');
      setSuccess('');
    }
  }, [isAddArticleOpen, categories, stuffs, warehouseLocations]);

  if (!isAddArticleOpen) return null;

  const handleClose = () => {
    setIsAddArticleOpen(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.articleNo.trim()) {
      showError('Required Field', 'Article Code / Number is required (e.g. BF411, JK-007).');
      setError('Article Code / Number is required (e.g. BF411, JK-007).');
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
      category: formData.category || 'Jacket',
      stuff: formData.stuff || 'Parachute (Waterproof)',
      initialStock: Number(formData.initialStock) || 0,
      unitCost: Number(formData.unitCost) || 0,
      minAlertStock: Number(formData.minAlertStock) || 150,
      warehouseLocation: formData.warehouseLocation?.trim() || '',
      description: formData.description.trim()
    };

    const res = await addArticle(payload);
    if (!res || !res.success) {
      showError('Cannot Add Article', res?.message || 'Error creating article in MySQL');
      setError(res?.message || 'Error creating article in MySQL');
      return;
    }

    showToast(`Article ${formData.articleNo.toUpperCase()} created successfully!`, 'success');
    handleClose();
  };

  const costNum = Number(formData.unitCost) || 0;
  const stockNum = Number(formData.initialStock) || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Simple & Clean */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Add New Article to Catalog
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register unique Article Code with Jacket Stuff / Fabric for warehouse stock & China imports
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Balanced 2-Column Layout */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
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

          <div className="space-y-5">
            
            {/* Section 1: Article Identification */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Article Identification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Article Code / Style # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JK-007, BF411, A012"
                    value={formData.articleNo}
                    onChange={e => setFormData({ ...formData, articleNo: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all tracking-wider"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Article Name / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Winter Parachute Waterproof Jacket"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryOpen(true)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Category</span>
                    </button>
                  </div>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Stuff / Fabric */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Stuff / Fabric Material
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddStuffOpen(true)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Stuff</span>
                    </button>
                  </div>
                  <select
                    value={formData.stuff}
                    onChange={e => setFormData({ ...formData, stuff: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                  >
                    {stuffs.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Location & Inventory */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Warehouse Location & Inventory
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Warehouse Location */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Warehouse Location / Rack
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddLocationOpen(true)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Location</span>
                    </button>
                  </div>
                  <select
                    value={formData.warehouseLocation}
                    onChange={e => setFormData({ ...formData, warehouseLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                  >
                    {warehouseLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Opening Stock */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Opening Stock (pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.initialStock}
                    onChange={e => setFormData({ ...formData, initialStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>

                {/* Landing Cost */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Landing Cost (Rs)
                    </label>
                    {costNum > 0 && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-medium">
                        {formatLakhCrore(costNum)}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={formData.unitCost}
                    onChange={e => setFormData({ ...formData, unitCost: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>

                {/* Low Stock Alert */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Low Stock Alert Threshold (pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="150"
                    value={formData.minAlertStock}
                    onChange={e => setFormData({ ...formData, minAlertStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>

                {/* Description Full Width */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Description / Specifications (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy winter padding with detachable hood and waterproof zipper"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Register Article</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
