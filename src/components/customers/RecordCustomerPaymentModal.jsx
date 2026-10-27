import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Wallet, CheckCircle2, AlertCircle, DollarSign, Calendar, Building, Sparkles } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatPKR, formatLakhCrore } from '../../utils/formatters';

export const RecordCustomerPaymentModal = () => {
  const { 
    isRecordCustomerPaymentOpen, 
    setIsRecordCustomerPaymentOpen, 
    customers, 
    selectedCustomerForPayment,
    setSelectedCustomerForPayment,
    recordCustomerPayment 
  } = useApp();

  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash Receipt');
  const [refNo, setRefNo] = useState(`REC-${Date.now().toString().slice(-4)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (selectedCustomerForPayment) {
      setCustomerId(selectedCustomerForPayment.id);
    } else if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [selectedCustomerForPayment, customers, customerId]);

  if (!isRecordCustomerPaymentOpen) return null;

  const currentCustomer = customers.find(c => c.id === customerId) || customers[0];
  const oldBalance = Number(currentCustomer?.remainingBalance || 0);
  const payAmt = Number(amount) || 0;
  const newBalance = Math.max(0, oldBalance - payAmt);

  const setPresetAmount = (val) => {
    setAmount(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentCustomer) {
      showError('Customer Required', 'Please select a customer.');
      setError('Please select a customer.');
      return;
    }

    if (!payAmt || payAmt <= 0) {
      showError('Invalid Amount', 'Payment amount must be greater than zero.');
      setError('Payment amount must be greater than zero.');
      return;
    }

    const res = await recordCustomerPayment({
      customerId: currentCustomer.id,
      amount: payAmt,
      paymentMethod,
      refNo: refNo.trim(),
      notes: notes.trim(),
      date
    });

    if (!res || !res.success) {
      showError('Payment Failed', res?.message || 'Error recording customer payment in MySQL');
      setError(res?.message || 'Error recording customer payment in MySQL');
      return;
    }

    showToast(`Received Rs. ${payAmt.toLocaleString()} from ${currentCustomer.shopName}!`, 'success');
    setIsRecordCustomerPaymentOpen(false);
    setSelectedCustomerForPayment(null);
    setAmount('');
    setNotes('');
    setRefNo(`REC-${Date.now().toString().slice(-4)}`);
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Fixed */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Receive Customer Payment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dukaan wasooli & customer khata update
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRecordCustomerPaymentOpen(false);
              setSelectedCustomerForPayment(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          
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

          {/* Customer Selection with Current Balance */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Shopkeeper / Customer <span className="text-rose-500">*</span>
              </label>
              {currentCustomer && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Current Khata: <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{formatPKR(oldBalance)}</span>
                </span>
              )}
            </div>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all"
            >
              {customers.length === 0 ? (
                <option value="">-- No Customers Registered Yet --</option>
              ) : (
                customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.shopName} ({c.shopkeeperName} - {c.city}) — Baqaya: Rs. {Number(c.remainingBalance || 0).toLocaleString()}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Amount with Live Lacs/Crores Conversion */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Amount Received (PKR) <span className="text-rose-500">*</span>
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                required
                className="w-full pl-10 pr-3 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>

            {/* Quick Fill Preset Chips */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {[25000, 50000, 100000, 500000].map(val => (
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

          {/* Date & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all"
              >
                <option value="Cash Receipt">Cash Receipt (Naqd)</option>
                <option value="Meezan Bank">Meezan Bank Transfer</option>
                <option value="Bank Transfer / Online">Bank Transfer / Online</option>
                <option value="HBL / Allied Bank">HBL / Allied Bank</option>
                <option value="Cheque Deposit">Cheque Deposit</option>
                <option value="Bilty Transport Agent">Bilty Goods Transport</option>
              </select>
            </div>
          </div>

          {/* Receipt No & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Receipt / Ref #
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
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
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Received</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(payAmt)}</span>
            </div>
            <div className="text-slate-300 dark:text-slate-600 font-bold">=</div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-medium">New Balance</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatPKR(newBalance)}</span>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 px-5 sm:px-6 py-3 mt-2 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setIsRecordCustomerPaymentOpen(false);
                setSelectedCustomerForPayment(null);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Wapas (Cancel)
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Wasooli Save Karein</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
