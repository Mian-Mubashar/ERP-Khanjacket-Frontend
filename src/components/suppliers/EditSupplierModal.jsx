import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle, Save } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatPKR } from '../../utils/formatters';

export const EditSupplierModal = () => {
  const {
    isEditSupplierOpen,
    setIsEditSupplierOpen,
    editingSupplier,
    setEditingSupplier,
    updateSupplier,
    selectedSupplierDetail,
    setSelectedSupplierDetail
  } = useApp();

  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSupplier && isEditSupplierOpen) {
      setCompany(editingSupplier.company || '');
      setName(editingSupplier.name || '');
      setPhone(editingSupplier.phone || '');
      setAddress(editingSupplier.address || '');
      setCurrency(editingSupplier.currency || 'PKR');
      setNotes(editingSupplier.notes || '');
      setError('');
    }
  }, [editingSupplier, isEditSupplierOpen]);

  if (!isEditSupplierOpen || !editingSupplier) return null;

  const handleClose = () => {
    setIsEditSupplierOpen(false);
    setEditingSupplier(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!company.trim()) {
      showError('Required Field', 'Company / Factory name is required.');
      setError('Company / Factory name is required.');
      return;
    }

    if (!name.trim()) {
      showError('Required Field', 'Contact Person Name is required.');
      setError('Contact Person Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateSupplier(editingSupplier.id, {
        company: company.trim(),
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        currency,
        notes: notes.trim()
      });

      if (!res || !res.success) {
        showError('Update Failed', res?.message || 'Error updating supplier');
        setError(res?.message || 'Error updating supplier');
        setIsSubmitting(false);
        return;
      }

      // Sync active supplier statement modal if open
      if (selectedSupplierDetail && selectedSupplierDetail.id === editingSupplier.id) {
        setSelectedSupplierDetail(prev => ({
          ...prev,
          company: company.trim(),
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          currency,
          notes: notes.trim()
        }));
      }

      showToast(`Supplier "${company.trim()}" updated successfully!`, 'success');
      handleClose();
    } catch (err) {
      showError('Update Error', err.message || 'Server error occurred');
      setError(err.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = Number(editingSupplier.remainingBalance) || 0;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Simple & Clean */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Vendor / Factory Details
              </h2>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/70 dark:border-blue-900/60">
                {editingSupplier.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update contact info, address, and trading terms
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

          {/* Balance info strip */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Vendor
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {editingSupplier.company} ({editingSupplier.name})
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Outstanding Baqaya</span>
              <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                {formatPKR(remaining)}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            
            {/* Section 1: Company & Contact */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Company & Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Company / Factory Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone / WhatsApp / WeChat
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Factory / Office Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Location & Terms */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Location & Terms
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="RMB">RMB / CNY (Chinese Yuan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Notes / Terms (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Terms, freight agent, bank account"
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

        </form>

      </div>
    </div>
  );
};
