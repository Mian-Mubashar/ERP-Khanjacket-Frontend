import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Pencil, AlertCircle, Save, Building, Phone, MapPin, User, Globe } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatLakhCrore } from '../../utils/formatters';

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
      showError('Zaroori Field', 'Company / Factory name is required.');
      setError('Company / Factory name is required.');
      return;
    }

    if (!name.trim()) {
      showError('Zaroori Field', 'Contact Person Name is required.');
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <Pencil className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Edit Vendor / China Factory</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-mono border border-blue-200/50 dark:border-blue-800/50">
                  {editingSupplier.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update factory name, contact person, phone and address
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

        {/* Financial Status Banner */}
        <div className="bg-slate-50/70 dark:bg-slate-800/40 px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Payable Balance:</span>
            <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
              Rs. {remaining.toLocaleString()}
            </span>
            {remaining >= 100000 && (
              <span className="text-[10px] text-slate-400 font-mono">
                ({formatLakhCrore(remaining)})
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Purchases: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">Rs. {Number(editingSupplier.totalPurchases || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Company & Contact Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Company / Factory Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Guangzhou Silk Mill"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mr. Chen Wei, Jin"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Phone & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone / WeChat
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+86 138-0000-0000"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-medium"
              >
                <option value="PKR">Pakistani Rupee (PKR)</option>
                <option value="CNY">Chinese Yuan (RMB / ¥)</option>
                <option value="USD">US Dollar (USD / $)</option>
              </select>
            </div>
          </div>

          {/* Factory / Office Address */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Factory / Office Address (China / Local)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Block 4, Industrial Zone, Keqiao, Shaoxing"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Remarks / TT Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bank details, agent shipping terms..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
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
