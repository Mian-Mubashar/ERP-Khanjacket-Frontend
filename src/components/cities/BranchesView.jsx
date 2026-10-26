import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GitFork,
  Plus,
  Pencil,
  Trash2,
  Building,
  Truck,
  Check,
  X,
  MapPin
} from 'lucide-react';
import { confirmDelete, showToast, showError, showSuccess } from '../../utils/sweetalert';
import { Pagination } from '../common/Pagination';

export const BranchesView = () => {
  const { cities, addCity, updateCity, deleteCity, setIsAddCityOpen } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handleStartEdit = (city) => {
    setEditingId(city.id);
    setEditingName(city.name);
    setError('');
  };

  const handleSaveEdit = async (id) => {
    if (!editingName.trim()) {
      setError('Branch name cannot be empty');
      return;
    }
    const res = await updateCity(id, { name: editingName.trim() });
    if (!res || !res.success) {
      showError('Update Failed', res?.message || 'Error updating branch');
      return;
    }
    showToast(`Branch renamed to "${editingName.trim()}"!`, 'success');
    setEditingId(null);
    setEditingName('');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setError('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCityName.trim()) {
      showError('Required Field', 'Please enter branch / city name');
      return;
    }
    const res = await addCity({ name: newCityName.trim() });
    if (!res || !res.success) {
      showError('Cannot Add Branch', res?.message || 'Error creating branch');
      return;
    }
    showToast(`Branch "${newCityName.trim()}" created successfully!`, 'success');
    setNewCityName('');
    setShowAddForm(false);
    setError('');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header (Matches user's reference screenshot: clean, spacious, BRANCHES title) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
            BRANCHES
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Destination cities & distribution hubs for wholesale garments dispatches
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Branch</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inline Quick Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="Enter branch / city name (e.g. Gujranwala, Sialkot, Quetta)..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors"
            >
              Save Branch
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setError(''); }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Table Card (Exact design replicated from user's uploaded reference screenshot: ID, Name, Action with amber & red buttons) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                <th className="py-4 px-6 w-20">ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6 hidden sm:table-cell text-slate-400">Total Shops</th>
                <th className="py-4 px-6 hidden md:table-cell text-slate-400">Total Mal Sent</th>
                <th className="py-4 px-6 text-right w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
              {cities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No branches added yet. Click "+ Add Branch" above to create one.
                  </td>
                </tr>
              ) : (
                cities.slice((page - 1) * pageSize, page * pageSize).map((city, idx) => (
                  <tr key={city.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    
                    {/* ID */}
                    <td className="py-4 px-6 font-mono text-slate-500 dark:text-slate-400">
                      {city.id || (page - 1) * pageSize + idx + 1}
                    </td>

                    {/* Name */}
                    <td className="py-4 px-6">
                      {editingId === city.id ? (
                        <div className="flex items-center gap-2 max-w-xs">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-blue-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(city.id)}
                            className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-900/50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {city.name}
                        </span>
                      )}
                    </td>

                    {/* Total Shops */}
                    <td className="py-4 px-6 hidden sm:table-cell text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-mono border border-slate-200/60 dark:border-slate-700/60">
                        <Building className="w-3 h-3 text-slate-400" />
                        {city.totalShops || 0} Shops
                      </span>
                    </td>

                    {/* Total Mal Sent */}
                    <td className="py-4 px-6 hidden md:table-cell text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-mono border border-slate-200/60 dark:border-slate-700/60">
                        <Truck className="w-3 h-3 text-slate-400" />
                        {(city.totalMalSent || 0).toLocaleString()} pcs
                      </span>
                    </td>

                    {/* Action: Refined SaaS Action Buttons (Soft light pastel tints, no loud shokh solids) */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Soft Amber Edit Button */}
                        <button
                          onClick={() => handleStartEdit(city)}
                          className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center justify-center shadow-2xs cursor-pointer"
                          title="Edit Branch"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Soft Rose Delete Button */}
                        <button
                          onClick={async () => {
                            const isConfirmed = await confirmDelete({
                              title: `Delete Branch "${city.name}"?`,
                              text: `Are you sure you want to delete branch "${city.name}"? All wholesale dispatch records linked to this destination will be affected.`,
                              confirmButtonText: 'Yes, Delete Branch'
                            });
                            if (isConfirmed) {
                              const res = await deleteCity(city.id);
                              if (res && res.success) {
                                showToast(`Branch "${city.name}" deleted successfully!`, 'success');
                              } else {
                                showError('Cannot Delete', res?.message || 'Error deleting branch');
                              }
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center shadow-2xs cursor-pointer"
                          title="Delete Branch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 10-Item Pagination */}
        <Pagination
          currentPage={page}
          totalItems={cities.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="branches"
        />
      </div>

    </div>
  );
};
