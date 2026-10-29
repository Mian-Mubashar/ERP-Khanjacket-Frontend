import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle, Save, Trash2, Plus } from 'lucide-react';
import { showToast, showError, confirmDelete } from '../../utils/sweetalert';
import { formatLakhCrore } from '../../utils/formatters';

export const EditArticleModal = () => {
  const {
    isEditArticleOpen,
    setIsEditArticleOpen,
    editingArticle,
    setEditingArticle,
    updateArticle,
    deleteArticle,
    selectedArticleDetail,
    setSelectedArticleDetail,
    categories = [],
    stuffs = [],
    warehouseLocations = [],
    setIsAddStuffOpen,
    setIsAddLocationOpen,
    setIsAddCategoryOpen
  } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stuff, setStuff] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [minAlertStock, setMinAlertStock] = useState('150');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingArticle && isEditArticleOpen) {
      setName(editingArticle.name || '');
      setCategory(editingArticle.category || (categories[0] || 'Jacket'));
      setStuff(editingArticle.stuff || (stuffs[0] || 'Parachute (Waterproof)'));
      setUnitCost(editingArticle.unitCost !== undefined ? String(editingArticle.unitCost) : '');
      setMinAlertStock(editingArticle.minAlertStock !== undefined ? String(editingArticle.minAlertStock) : '150');
      setWarehouseLocation(editingArticle.warehouseLocation || (warehouseLocations[0] || 'Main Godown - Hall A'));
      setDescription(editingArticle.description || '');
      setError('');
    }
  }, [editingArticle, isEditArticleOpen, categories, stuffs, warehouseLocations]);

  if (!isEditArticleOpen || !editingArticle) return null;

  const handleClose = () => {
    setIsEditArticleOpen(false);
    setEditingArticle(null);
    setError('');
  };

  const handleDelete = async () => {
    const isConfirmed = await confirmDelete({
      title: `Delete Article ${editingArticle.articleNo}?`,
      text: `Are you sure you want to delete "${editingArticle.name}" (${editingArticle.articleNo})? This will remove it from the warehouse catalog.`,
      confirmButtonText: 'Yes, Delete Article'
    });

    if (!isConfirmed) return;

    const res = await deleteArticle(editingArticle.articleNo);
    if (res?.success) {
      showToast(`Article "${editingArticle.articleNo}" deleted successfully!`, 'success');
      handleClose();
      if (selectedArticleDetail && selectedArticleDetail.articleNo === editingArticle.articleNo) {
        setSelectedArticleDetail(null);
      }
    } else {
      showError('Cannot Delete Article', res?.message || 'Failed to delete article');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      showError('Required Field', 'Article Name is required.');
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
        minAlertStock: Number(minAlertStock) || 150,
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
          minAlertStock: Number(minAlertStock) || 150,
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

  const costNum = Number(unitCost) || 0;
  const currentStock = Number(editingArticle.currentStock) || 0;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Simple & Clean */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Article Details
              </h2>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/70 dark:border-blue-900/60">
                {editingArticle.articleNo}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update garment style title, fabric materials, landing cost, and warehouse rack
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

          {/* Quick Info Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Catalog Code
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {editingArticle.articleNo}
              </span>
            </div>
            <div className="text-right flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Current Stock</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {currentStock.toLocaleString()} pcs
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Total Valuation</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  Rs. {(currentStock * costNum).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* LEFT COLUMN: Name & Classification */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Article Specification
              </h3>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Article Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
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
                  value={category}
                  onChange={e => setCategory(e.target.value)}
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
                  value={stuff}
                  onChange={e => setStuff(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                >
                  {stuffs.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* RIGHT COLUMN: Location, Cost & Alert */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Warehouse Location & Cost
              </h3>

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
                  value={warehouseLocation}
                  onChange={e => setWarehouseLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                >
                  {warehouseLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Unit Cost */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Landing Unit Cost (PKR)
                  </label>
                  {costNum > 0 && (
                    <span className="text-[11px] text-slate-500 font-mono font-medium">
                      {formatLakhCrore(costNum)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  value={unitCost}
                  onChange={e => setUnitCost(e.target.value)}
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
                  value={minAlertStock}
                  onChange={e => setMinAlertStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>

            </div>

          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Specifications (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Article</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
