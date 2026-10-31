import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatPKR, formatLakhCrore } from '../../utils/formatters';
import { SearchableSelect } from '../common/SearchableSelect';

export const AddPaymentModal = () => {
  const { 
    isRecordPaymentOpen, 
    setIsRecordPaymentOpen, 
    suppliers = [], 
    recordPayment,
    selectedSupplierDetail,
    selectedSupplierForPayment,
    setSelectedSupplierForPayment
  } = useApp();

  const preselected = selectedSupplierForPayment || selectedSupplierDetail;
  const [supplierId, setSupplierId] = useState(preselected?.id || suppliers[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank TT / Wire Transfer');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Keep supplierId synced whenever modal opens or suppliers change
  useEffect(() => {
    if (isRecordPaymentOpen) {
      const targetId = selectedSupplierForPayment?.id || selectedSupplierDetail?.id || suppliers[0]?.id || '';
      setSupplierId(targetId);
      setDate(new Date().toISOString().split('T')[0]);
      setRefNo(`TT-${Date.now().toString().slice(-5)}`);
      setAmount('');
      setNotes('');
      setError('');
      setSuccess('');
    }
  }, [isRecordPaymentOpen, selectedSupplierForPayment, selectedSupplierDetail, suppliers]);

  if (!isRecordPaymentOpen) return null;

  const currentSupplier = suppliers.find(s => s.id === supplierId) || suppliers[0];
  const oldBalance = Number(currentSupplier?.remainingBalance || 0);
  const payAmt = Number(amount) || 0;
  const newBalance = Math.max(0, oldBalance - payAmt);

  const setPresetAmount = (val) => {
    setAmount(val);
  };

  const handleClose = () => {
    setIsRecordPaymentOpen(false);
    if (setSelectedSupplierForPayment) setSelectedSupplierForPayment(null);
    setAmount('');
    setNotes('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!supplierId || !currentSupplier) {
      showError('Supplier Required', 'Please select a China supplier to record payment.');
      setError('Please select a China supplier.');
      return;
    }

    if (!payAmt || payAmt <= 0) {
      showError('Invalid Amount', 'Please enter a valid payment amount.');
      setError('Please enter a valid payment amount.');
      return;
    }

    const res = await recordPayment({
      supplierId: currentSupplier.id,
      amount: payAmt,
      date,
      paymentMethod,
      refNo: refNo.trim() || `TT-${Date.now().toString().slice(-5)}`,
      notes: notes.trim()
    });

    if (!res || !res.success) {
      showError('Payment Failed', res?.message || 'Error recording payment in MySQL');
      setError(res?.message || 'Error recording payment in MySQL');
      return;
    }

    showToast(`Payment of Rs. ${payAmt.toLocaleString()} successfully paid to ${currentSupplier.company}!`, 'success');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Simple & Clean */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Record Supplier Payment (TT / LC)
              </h2>
              {currentSupplier && (
                <>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {currentSupplier.company}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record bank wire transfer or LC payment to China vendor and update accounts payable
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

        {/* Form Body - Wide 2-Column Balanced Layout */}
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

          {/* Supplier Select / Details Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <SearchableSelect
                label="Select China Supplier / Vendor"
                required
                value={supplierId}
                onChange={(val) => setSupplierId(val)}
                options={suppliers}
                getOptionValue={(s) => s.id}
                getOptionLabel={(s) => s.company}
                getOptionSublabel={(s) => `${s.name || ''} ${s.phone ? `• ${s.phone}` : ''}`}
                getOptionBadge={(s) => (
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                    Baqaya: Rs. {Number(s.remainingBalance || 0).toLocaleString()}
                  </span>
                )}
                placeholder="-- Select or Search Supplier --"
                searchPlaceholder="Search vendor by company, contact, phone..."
              />
            </div>
            {currentSupplier && (
              <div className="text-right sm:pl-4 shrink-0">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Current Baqaya Due</span>
                <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                  {formatPKR(oldBalance)}
                </span>
              </div>
            )}
          </div>

          {/* 2-Column Balanced Main Layout: Left = Payment Amount & Chips | Right = Logistics & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* LEFT COLUMN: Amount, Quick Presets, and Live Math Preview */}
            <div className="space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Payment Amount (PKR) <span className="text-rose-500">*</span>
                  </label>
                  {payAmt > 0 && (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      {formatLakhCrore(payAmt)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 100000"
                    required
                    min="1"
                    className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {[50000, 100000, 500000, 1000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPresetAmount(val)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    +{val >= 100000 ? `${val / 100000} Lakh` : `${val / 1000}k`}
                  </button>
                ))}
                {oldBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setPresetAmount(oldBalance)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 transition-colors cursor-pointer ml-auto"
                  >
                    Full Clear ({formatPKR(oldBalance)})
                  </button>
                )}
              </div>

              {/* Live Khata Math preview */}
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Previous Due</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-sm">{formatPKR(oldBalance)}</strong>
                </div>
                <span className="text-slate-300 dark:text-slate-600 font-bold text-base">−</span>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Transferring</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{formatPKR(payAmt)}</strong>
                </div>
                <span className="text-slate-300 dark:text-slate-600 font-bold text-base">=</span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">New Baqaya</span>
                  <strong className="text-slate-900 dark:text-white text-sm">{formatPKR(newBalance)}</strong>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Date, Payment Method, TT / Ref # & Notes */}
            <div className="space-y-3.5 flex flex-col justify-between">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Transfer Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                  >
                    <option value="Bank TT / Wire Transfer">Bank TT / Wire Transfer</option>
                    <option value="Letter of Credit (LC)">Letter of Credit (LC)</option>
                    <option value="Online Bank Transfer">Online Bank Transfer</option>
                    <option value="Hawala / Hundi">Hawala / Hundi</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  TT Number / Bank Reference
                </label>
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  placeholder="e.g. TT-98231 or Bank Txn ID"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes / Particulars (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Advance deposit for Winter Jackets container"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
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
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Transfer {payAmt > 0 ? `(${formatPKR(payAmt)})` : ''}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
