import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatPKR, formatLakhCrore } from '../../utils/formatters';
import { SearchableSelect } from '../common/SearchableSelect';

const getTodayDate = () => new Date().toISOString().split('T')[0];
const generateReceiptNo = () => `REC-${Date.now().toString().slice(-4)}`;

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
  const [refNo, setRefNo] = useState(generateReceiptNo);
  const [date, setDate] = useState(getTodayDate);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isRecordCustomerPaymentOpen) {
      setRefNo(generateReceiptNo());
      setDate(getTodayDate());
      setError('');
      setSuccess('');

      if (selectedCustomerForPayment) {
        setCustomerId(selectedCustomerForPayment.id);
      } else if (customers.length > 0) {
        setCustomerId(prev => prev || customers[0].id);
      }
    }
  }, [isRecordCustomerPaymentOpen, selectedCustomerForPayment, customers]);

  if (!isRecordCustomerPaymentOpen) return null;

  const currentCustomer = customers.find(c => c.id === customerId) || customers[0];
  const oldBalance = Number(currentCustomer?.remainingBalance || 0);
  const payAmt = Number(amount) || 0;
  const newBalance = Math.max(0, oldBalance - payAmt);

  const setPresetAmount = (val) => {
    setAmount(val);
  };

  const handleClose = () => {
    setIsRecordCustomerPaymentOpen(false);
    setSelectedCustomerForPayment(null);
    setAmount('');
    setNotes('');
    setError('');
    setSuccess('');
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
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Receive Customer Payment
              </h2>
              {currentCustomer && (
                <span className="text-xs text-slate-400">•</span>
              )}
              {currentCustomer && (
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {currentCustomer.shopName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record payment wasooli and update khata balance
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Wide & Balanced */}
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

          {/* Customer Selection or Pre-filled Card */}
          {selectedCustomerForPayment ? (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Customer
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedCustomerForPayment.shopName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                    {selectedCustomerForPayment.shopkeeperName ? `(${selectedCustomerForPayment.shopkeeperName})` : ''} • {selectedCustomerForPayment.city} {selectedCustomerForPayment.phone ? `• ${selectedCustomerForPayment.phone}` : ''}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Baqaya Khata</span>
                <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                  {formatPKR(oldBalance)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <SearchableSelect
                  label="Select Customer / Shopkeeper"
                  required
                  value={customerId}
                  onChange={(val) => setCustomerId(val)}
                  options={[...customers].sort((a, b) => (a.shopName || '').localeCompare(b.shopName || '', undefined, { sensitivity: 'base' }))}
                  getOptionValue={(c) => c.id}
                  getOptionLabel={(c) => c.shopName}
                  getOptionSublabel={(c) => `${c.shopkeeperName ? `${c.shopkeeperName} • ` : ''}${c.city} ${c.phone ? `• ${c.phone}` : ''}`}
                  getOptionBadge={(c) => (
                    <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                      Baqaya: Rs. {Number(c.remainingBalance || 0).toLocaleString()}
                    </span>
                  )}
                  placeholder="-- Select or Search Customer --"
                  searchPlaceholder="Search shop name, shopkeeper, city, phone..."
                />
              </div>
              {currentCustomer && (
                <div className="text-right sm:pl-4 shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Current Baqaya</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {formatPKR(oldBalance)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 2-Column Balanced Main Layout: Left = Payment Amount & Chips | Right = Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* LEFT COLUMN: Amount Input, Quick Presets, and Khata Math */}
            <div className="space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Amount Received (PKR) <span className="text-rose-500">*</span>
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
                    placeholder="e.g. 50000"
                    required
                    min="1"
                    className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {[25000, 50000, 100000, 500000].map(val => (
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
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Previous</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-sm">{formatPKR(oldBalance)}</strong>
                </div>
                <span className="text-slate-300 dark:text-slate-600 font-bold text-base">−</span>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Received</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-sm">{formatPKR(payAmt)}</strong>
                </div>
                <span className="text-slate-300 dark:text-slate-600 font-bold text-base">=</span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">New Balance</span>
                  <strong className="text-slate-900 dark:text-white text-sm">{formatPKR(newBalance)}</strong>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Date, Payment Method, Receipt # & Notes */}
            <div className="space-y-3.5 flex flex-col justify-between">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
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
                    <option value="Cash Receipt">Cash Receipt (Naqd)</option>
                    <option value="Meezan Bank">Meezan Bank Transfer</option>
                    <option value="Bank Transfer / Online">Bank Transfer / Online</option>
                    <option value="HBL / Allied Bank">HBL / Allied Bank</option>
                    <option value="Cheque Deposit">Cheque Deposit</option>
                    <option value="Bilty Transport Agent">Bilty Goods Transport</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Receipt / Ref #
                  </label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Remarks / Notes <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Naqad Wasooli"
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Status Note */}
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Payment will be automatically credited to customer ledger statement.
              </div>

            </div>

          </div>

        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Received: <strong className="font-mono text-slate-900 dark:text-white">Rs. {payAmt.toLocaleString()}</strong>
            <span className="ml-2 text-slate-400">
              • New Baqaya: <strong className="font-mono text-slate-800 dark:text-slate-200">Rs. {newBalance.toLocaleString()}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Payment</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
