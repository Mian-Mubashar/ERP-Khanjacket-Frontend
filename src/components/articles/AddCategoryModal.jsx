import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, FolderPlus, CheckCircle2, AlertCircle, Plus, Tag, Pencil, Trash2, Check, XCircle } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import Swal from 'sweetalert2';
import { Pagination } from '../common/Pagination';

export const AddCategoryModal = () => {
  const {
    isAddCategoryOpen,
    setIsAddCategoryOpen,
    categories = [],
    addCategory,
    updateCategory,
    deleteCategory,
    articles = []
  } = useApp();

  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing state for rename
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');

  // Pagination (10 limit)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  if (!isAddCategoryOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = categoryName.trim();
    if (!trimmed) {
      showError('Required Field', 'Category name is required (e.g. Jacket, Hoodie, Tracksuit).');
      setError('Category name is required (e.g. Jacket, Hoodie, Tracksuit).');
      return;
    }

    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      showError('Already Exists', `Category "${trimmed}" already exists in the catalog.`);
      setError(`Category "${trimmed}" already exists in the catalog.`);
      return;
    }

    setIsSubmitting(true);
    const res = await addCategory(trimmed);
    setIsSubmitting(false);

    if (!res || !res.success) {
      showError('Cannot Add Category', res?.message || 'Error adding category');
      setError(res?.message || 'Error adding category');
      return;
    }

    showToast(`Category "${trimmed}" added successfully!`, 'success');
    setCategoryName('');
    setSuccess(`Category "${trimmed}" added!`);
  };

  const startEdit = (cat) => {
    setEditingCategory(cat);
    setEditName(cat);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  const handleSaveEdit = async (oldName) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      showError('Required Field', 'New category name is required');
      return;
    }
    if (trimmed.toLowerCase() !== oldName.toLowerCase() && categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      showError('Already Exists', `Category "${trimmed}" already exists`);
      return;
    }

    const res = await updateCategory(oldName, trimmed);
    if (res?.success) {
      showToast(`Category renamed to "${trimmed}"!`, 'success');
      setEditingCategory(null);
    } else {
      showError('Update Failed', res?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (cat) => {
    const articleCount = articles.filter(a => a.category === cat).length;
    let warningText = `Are you sure you want to delete category "${cat}"?`;
    if (articleCount > 0) {
      warningText += ` Warning: ${articleCount} registered article(s) are using this category.`;
    }

    const result = await Swal.fire({
      title: 'Delete Category?',
      text: warningText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      const res = await deleteCategory(cat);
      if (res?.success) {
        showToast(`Category "${cat}" deleted!`, 'success');
        if (paginatedCategories.length === 1 && page > 1) {
          setPage(p => p - 1);
        }
      } else {
        showError('Delete Failed', res?.message || 'Failed to delete category');
      }
    }
  };

  // Paginated categories slice
  const paginatedCategories = categories.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <FolderPlus className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Garment Categories</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add, rename, or manage garment apparel categories (Jacket, Hoodie, Tracksuit)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddCategoryOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-3.5">
          
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
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Jacket, Hoodie, Tracksuit, Shalwar Kameez, Kurta..."
              autoFocus
              className="flex-1 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Category'}</span>
            </button>
          </form>

          {/* Available Categories Table with Actions */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Available Categories ({categories.length})
              </span>
              <span className="text-[10px] text-slate-400">
                100% Dynamic MySQL Storage
              </span>
            </div>

            {categories.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                Abhi koi category add nahi hui. Upar form se apni pehli category (e.g. Jacket, Hoodie) add karen.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Category Name</th>
                      <th className="py-2.5 px-3 text-center">Articles</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {paginatedCategories.map((cat, i) => {
                      const articleCount = articles.filter(a => a.category === cat).length;
                      const globalIndex = (page - 1) * pageSize + i + 1;
                      const isEditing = editingCategory === cat;

                      return (
                        <tr key={cat} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs">{globalIndex}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  className="px-2 py-1 text-xs rounded-lg border border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(cat)}
                                  className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 cursor-pointer"
                                  title="Cancel"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>{cat}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 text-[11px]">
                              {articleCount} Codes
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Active
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEdit(cat)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Edit / Rename Category"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cat)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* 10-Item Pagination */}
                <Pagination
                  currentPage={page}
                  totalItems={categories.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  itemLabel="categories"
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsAddCategoryOpen(false)}
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
