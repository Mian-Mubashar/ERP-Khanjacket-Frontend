import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, MapPin, CheckCircle2, AlertCircle, Plus, Warehouse, Trash2 } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import Swal from 'sweetalert2';
import { Pagination } from '../common/Pagination';

export const AddLocationModal = () => {
  const {
    isAddLocationOpen,
    setIsAddLocationOpen,
    warehouseLocations = [],
    addWarehouseLocation,
    deleteWarehouseLocation,
    articles = []
  } = useApp();

  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination (10 limit)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  if (!isAddLocationOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = locationName.trim();
    if (!trimmed) {
      showError('Required Field', 'Location name is required (e.g. Hall A - Rack 01, Godown 2).');
      setError('Location name is required (e.g. Hall A - Rack 01, Godown 2).');
      return;
    }

    if (warehouseLocations.some(loc => loc.toLowerCase() === trimmed.toLowerCase())) {
      showError('Already Exists', `Location "${trimmed}" already exists.`);
      setError(`Location "${trimmed}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    const res = await addWarehouseLocation(trimmed);
    setIsSubmitting(false);

    if (!res || !res.success) {
      showError('Cannot Add Location', res?.message || 'Error adding warehouse location');
      setError(res?.message || 'Error adding warehouse location');
      return;
    }

    showToast(`Location "${trimmed}" added successfully!`, 'success');
    setLocationName('');
    setSuccess(`Location "${trimmed}" added!`);
  };

  const handleDelete = async (loc) => {
    const articleCount = articles.filter(a => (a.warehouseLocation || '') === loc).length;
    let warningText = `Are you sure you want to delete warehouse location "${loc}"?`;
    if (articleCount > 0) {
      warningText += ` Warning: ${articleCount} article(s) are currently assigned to this location.`;
    }

    const result = await Swal.fire({
      title: 'Delete Location / Rack?',
      text: warningText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      const res = await deleteWarehouseLocation(loc);
      if (res?.success) {
        showToast(`Location "${loc}" deleted!`, 'success');
        if (paginatedLocations.length === 1 && page > 1) {
          setPage(p => p - 1);
        }
      } else {
        showError('Delete Failed', res?.message || 'Failed to delete location');
      }
    }
  };

  // Paginated locations slice
  const paginatedLocations = warehouseLocations.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <Warehouse className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Warehouse Racks & Godowns</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add and manage physical warehouse storage racks and halls
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddLocationOpen(false)}
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
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Hall A - Rack 01, Godown 2, Mezzanine B..."
              autoFocus
              className="flex-1 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Location'}</span>
            </button>
          </form>

          {/* Available Locations Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Saved Warehouse Locations ({warehouseLocations.length})
              </span>
              <span className="text-[10px] text-slate-400">
                Live Database Storage
              </span>
            </div>

            {warehouseLocations.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No warehouse locations added yet. Enter a rack or godown name above to register.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Storage Location / Rack Name</th>
                      <th className="py-2.5 px-3 text-center">Assigned Articles</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {paginatedLocations.map((loc, i) => {
                      const articleCount = articles.filter(a => (a.warehouseLocation || '') === loc).length;
                      const globalIndex = (page - 1) * pageSize + i + 1;
                      return (
                        <tr key={loc} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs">{globalIndex}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{loc}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50 text-[11px]">
                              {articleCount} Codes
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Active
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDelete(loc)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Delete Location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* 10-Item Pagination */}
                <Pagination
                  currentPage={page}
                  totalItems={warehouseLocations.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  itemLabel="locations"
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsAddLocationOpen(false)}
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
