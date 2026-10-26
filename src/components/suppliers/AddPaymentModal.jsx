import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle, CheckCircle2, CreditCard, Sparkles, ArrowRight, DollarSign, Wallet } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatPKR, formatLakhCrore } from '../../utils/formatters';

export const AddPaymentModal = () => {
  const { 
    isRecordPaymentOpen, 
    setIsRecordPaymentOpen, 
    suppliers, 
    recordPayment,
    selectedSupplierDetail 
  } = useApp();

  const initialSupplierId = selectedSupplierDetail?.id || suppliers[0]?.id || '';

  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank TT / Wire Transfer');
  const [refNo, setRefNo] = useState(`TT-${Date.now().toString().slice(-5)}`);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Keep supplierId synced if suppliers load late
  React.useEffect(() => {
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers, supplierId]);

  if (!isRecordPaymentOpen) return null;

  const currentSupplier = suppliers.find(s => s.id === supplierId) || suppliers[0];
  const oldBalance = Number(currentSupplier?.remainingBalance || 0);
  const payAmt = Number(amount) || 0;
  const newBalance = Math.max(0, oldBalance - payAmt);

  const setPresetAmount = (val) => {
    setAmount(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!supplierId) {
      showError('Supplier Required', 'Please select a China supplier to record payment.');
      setError('Please select a China supplier.');
      return;
    }

    if (!payAmt || payAmt <= 0) {
      showError('Invalid Amount', 'Please enter a valid payment amount (Raqam likhein).');
      setError('Please enter a valid payment amount.');
      return;
    }

    const res = await recordPayment({
      supplierId,
      amount: payAmt,
      date,
      paymentMethod,
      refNo: refNo.trim(),
      notes: notes.trim()
    });

    if (!res || !res.success) {
      showError('Payment Failed', res?.message || 'Error recording payment in MySQL');
      setError(res?.message || 'Error recording payment in MySQL');
      return;
    }

    showToast(`Payment of Rs. ${payAmt.toLocaleString()} successfully paid to ${currentSupplier?.company}!`, 'success');
    setIsRecordPaymentOpen(false);
    setAmount('');
    setNotes('');
    setRefNo(`TT-${Date.now().toString().slice(-5)}`);
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Supplier Payment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                China vendor adaigi & khata update
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRecordPaymentOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5">
          
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

          {/* Supplier Select with current balance badge */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                China Supplier (Factory) <span className="text-rose-500">*</span>
              </label>
              {currentSupplier && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Current Baqaya: <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{formatPKR(oldBalance)}</span>
                </span>
              )}
            </div>

            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all"
            >
              {suppliers.length === 0 ? (
                <option value="">-- No Suppliers Registered Yet --</option>
              ) : (
                suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.company} — {s.name} (Baqaya: Rs. {Number(s.remainingBalance || 0).toLocaleString()})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Amount with Lacs/Crores Live Conversion */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Payment Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              {payAmt > 0 && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatLakhCrore(payAmt)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                Rs.
              </span>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 500000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>

            {/* Quick Fill Preset Chips */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {[50000, 100000, 500000, 1000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPresetAmount(val)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-mono transition-colors cursor-pointer"
                >
                  +{val >= 100000 ? `${val / 100000} Lakh` : `${val / 1000}k`}
                </button>
              ))}
              {oldBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setPresetAmount(oldBalance)}
                  className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200/60 dark:border-blue-800/60 transition-colors cursor-pointer ml-auto"
                >
                  Full Clear ({formatPKR(oldBalance)})
                </button>
              )}
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all"
              >
                <option value="Bank TT / Wire Transfer">Bank TT / Wire Transfer (China Port)</option>
                <option value="Online Bank Transfer">Online Bank Transfer (Meezan/HBL)</option>
                <option value="Cash / Hawala">Cash / Hawala (Naqd)</option>
                <option value="Foreign Exchange LC">Letter of Credit (LC)</option>
              </select>
            </div>
          </div>

          {/* Reference No & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Swift / TT / Ref #
              </label>
              <input
                type="text"
                value={refNo}
                onChange={e => setRefNo(e.target.value)}
                placeholder="e.g. TT-GZ-9901"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Notes
              </label>
              <input
                type="text"
                placeholder="Optional notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Compact Balance Math Strip */}
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Previous</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatPKR(oldBalance)}</span>
            </div>
            <div className="text-slate-300 dark:text-slate-600 font-bold">−</div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Paid</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(payAmt)}</span>
            </div>
            <div className="text-slate-300 dark:text-slate-600 font-bold">=</div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-medium">New Balance</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatPKR(newBalance)}</span>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRecordPaymentOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Wapas (Cancel)
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Adaigi Save Karein</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

