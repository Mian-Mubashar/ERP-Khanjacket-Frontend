import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Anchor,
  Ship,
  Sparkles
} from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';

export const RecordClearancePaymentModal = ({ clearance, isOpen, onClose, onSuccess }) => {
  const { recordClearancePayment } = useApp();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer / Wire');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !clearance) return null;

  const grandTotal = Number(clearance.grandTotal) || 0;
  const paidAmount = Number(clearance.paidAmount) || 0;
  const currentRemaining = Math.max(0, grandTotal - paidAmount);

  const payNum = Math.max(0, Number(amount) || 0);
  const projectedRemaining = Math.max(0, currentRemaining - payNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!amount || payNum <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await recordClearancePayment(clearance.id, {
        amount: payNum,
        date,
        paymentMethod,
        refNo: refNo.trim() || null,
        notes: notes.trim() || null
      });

      if (res?.success) {
        showToast(`Paid Rs. ${payNum.toLocaleString()} to ${clearance.clearingAgent} recorded successfully!`, 'success');
        if (onSuccess) onSuccess(res.clearance);
        onClose();
        setAmount('');
        setRefNo('');
        setNotes('');
      } else {
        setErrorMsg(res?.message || 'Failed to record clearance payment');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Record Clearance Payment (Adaigi)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agent: <strong className="text-slate-800 dark:text-slate-200">{clearance.clearingAgent}</strong> • Bill #{clearance.invoiceNo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Consignment Snapshot Banner */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Bill</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                Rs. {Math.round(grandTotal).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Already Paid</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                Rs. {Math.round(paidAmount).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining Baqaya</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                Rs. {Math.round(currentRemaining).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Payment Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  required
                  autoFocus
                  className="w-full pl-3 pr-16 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 outline-hidden focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setAmount(currentRemaining.toString())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
                  title="Pay full remaining balance"
                >
                  Full Due
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Payment Method & Ref No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="Bank Transfer / Wire">Bank Transfer / Online (HBL / MCB)</option>
                <option value="Pay Order">Pay Order / Banker Cheque</option>
                <option value="Cheque">Cross Cheque</option>
                <option value="Cash">Cash at Port / Office</option>
                <option value="Direct Duty Online">WeBOC / FBR Direct E-Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Ref / Slip / Cheque #
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. TXN-902144 / CHQ-104"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Payment Remarks / Description (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. DryPort Crane & Railway charges settlement"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Live Remaining Balance Calculation Preview */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-blue-700 dark:text-blue-300 uppercase font-bold block">
                Projected Remaining Baqaya
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                After deducting Rs. {Math.round(payNum).toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-mono font-black ${
                projectedRemaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-300'
              }`}>
                {projectedRemaining === 0 ? 'Rs. 0 (Fully Cleared)' : `Rs. ${Math.round(projectedRemaining).toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || payNum <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Payment...' : 'Save Payment (Adaigi Darj Karein)'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

