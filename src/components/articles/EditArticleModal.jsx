import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Pencil, AlertCircle, Save, Shirt, Layers, DollarSign, Bell, Plus, MapPin } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';

export const EditArticleModal = () => {
  const {
    isEditArticleOpen,
    setIsEditArticleOpen,
    editingArticle,
    setEditingArticle,
    updateArticle,
    categories,
    stuffs,
    warehouseLocations,
    setIsAddCategoryOpen,
    setIsAddStuffOpen,
    setIsAddLocationOpen,
    selectedArticleDetail,
    setSelectedArticleDetail
  } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stuff, setStuff] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [minAlertStock, setMinAlertStock] = useState('100');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-select latest category when one is added dynamically
  const prevCatCount = useRef(categories.length);
  useEffect(() => {
    if (categories.length > prevCatCount.current) {
      const latest = categories[categories.length - 1];
      if (latest) {
        setCategory(latest);
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
        setWarehouseLocation(latest);
      }
    }
    prevLocCount.current = warehouseLocations.length;
  }, [warehouseLocations]);

  useEffect(() => {
    if (editingArticle && isEditArticleOpen) {
      setName(editingArticle.name || '');
      setCategory(editingArticle.category || 'Jacket');
      setStuff(editingArticle.stuff || (stuffs[0] || 'Parachute (Waterproof)'));
      setUnitCost(editingArticle.unitCost?.toString() || '0');
      setMinAlertStock(editingArticle.minAlertStock?.toString() || '100');
      setWarehouseLocation(editingArticle.warehouseLocation || (warehouseLocations[0] || ''));
      setDescription(editingArticle.description || '');
      setError('');
    }
  }, [editingArticle, isEditArticleOpen, stuffs, warehouseLocations]);

  if (!isEditArticleOpen || !editingArticle) return null;

  const handleClose = () => {
    setIsEditArticleOpen(false);
    setEditingArticle(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      showError('Zaroori Field', 'Article Name is required.');
      setError('Article Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateArticle(editingArticle.articleNo, {
        name: name.trim(),
        category,
        stuff,
        unitCost: Number(unitCost) || 0,
        minAlertStock: Number(minAlertStock) || 100,
        warehouseLocation: warehouseLocation.trim(),
        description: description.trim()
      });

      if (!res || !res.success) {
        showError('Update Failed', res?.message || 'Error updating article');
        setError(res?.message || 'Error updating article');
        setIsSubmitting(false);
        return;
      }

      // Sync active article details ledger if open
      if (selectedArticleDetail && (selectedArticleDetail.articleNo === editingArticle.articleNo || selectedArticleDetail.id === editingArticle.id)) {
        setSelectedArticleDetail(prev => ({
          ...prev,
          name: name.trim(),
          category,
          stuff,
          unitCost: Number(unitCost) || 0,
          minAlertStock: Number(minAlertStock) || 100,
          warehouseLocation: warehouseLocation.trim(),
          description: description.trim()
        }));
      }

      showToast(`Article "${editingArticle.articleNo}" updated successfully!`, 'success');
      handleClose();
    } catch (err) {
      showError('Update Error', err.message || 'Server error occurred');
      setError(err.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultCategories = ['Jacket', 'Hoodie', 'Zipper', 'Tracksuit', 'Trousers', 'Shirt', 'Windbreaker'];
  const activeCategories = categories && categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <Pencil className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Edit Article Details</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-mono font-bold tracking-wide border border-blue-200/50 dark:border-blue-800/50">
                  {editingArticle.articleNo}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update article name, fabric stuff, unit cost and alert stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stock info strip */}
        <div className="bg-slate-50/70 dark:bg-slate-800/40 px-6 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Current Stock: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{Number(editingArticle.currentStock || 0).toLocaleString()} pcs</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Total Import: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{Number(editingArticle.totalPurchased || 0).toLocaleString()} pcs</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5">
          
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Article Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Article Name / Garment Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Winter Down Jacket with Detachable Hood"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Garment Category
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
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsAddCategoryOpen(true);
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-medium"
              >
                {activeCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__NEW__">+ Add New Category...</option>
              </select>
            </div>
          </div>

          {/* Row 2: Fabric Stuff & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fabric / Stuff (Kapra)
              </label>
              <select
                value={stuff}
                onChange={(e) => setStuff(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-medium"
              >
                {stuffs.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Cost (Purchase PKR per pc)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Row 3: Alert Stock & Warehouse Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Stock Alert Level (Pcs)
              </label>
              <input
                type="number"
                min="0"
                value={minAlertStock}
                onChange={(e) => setMinAlertStock(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-mono"
              />
            </div>

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
                value={warehouseLocation}
                onChange={e => {
                  if (e.target.value === '__NEW__') {
                    setIsAddLocationOpen(true);
                  } else {
                    setWarehouseLocation(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-900/60 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 font-medium transition-all"
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
                      onClick={() => setWarehouseLocation(loc)}
                      className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer border ${
                        warehouseLocation === loc
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
          </div>

          {/* Row 4: Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Quality Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Premium imported zipper, fleece inner lining..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
