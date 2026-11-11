import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Printer, 
  CreditCard, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ReceiptText,
  Anchor,
  Ship,
  ChevronDown,
  ChevronUp,
  FileText,
  Download
} from 'lucide-react';
import { showToast, showError, confirmDelete } from '../../utils/sweetalert';
import { RecordClearancePaymentModal } from './RecordClearancePaymentModal';
import { downloadClearancePDF } from '../../utils/pdfGenerator';
import logoImg from '../../images/khan jacket logo.png';

export const ClearanceKhataModal = ({ clearance, isOpen, onClose }) => {
  const { deleteClearancePayment, clearances = [] } = useApp();

  const [activeClearance, setActiveClearance] = useState(clearance);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [showBillBreakdown, setShowBillBreakdown] = useState(false);

  // Sync activeClearance with global clearances state when updated
  useEffect(() => {
    if (clearance) {
      const fresh = clearances.find(c => c.id === clearance.id);
      setActiveClearance(fresh || clearance);
    }
  }, [clearance, clearances]);

  if (!isOpen || !activeClearance) return null;

  const c = activeClearance;
  const grandTotal = Number(c.grandTotal) || 0;
  const paidAmount = Number(c.paidAmount) || 0;
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  const isCleared = remainingAmount <= 0 && grandTotal > 0;
  const isPartial = paidAmount > 0 && remainingAmount > 0;

  const payments = Array.isArray(c.payments) ? [...c.payments].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];

  const handlePrint = () => {
    window.print();
  };

  const handleDeletePayment = async (payment) => {
    const isConfirmed = await confirmDelete({
      title: `Delete Payment of Rs. ${Number(payment.amount).toLocaleString()}?`,
      text: `Are you sure you want to revert this payment made on ${payment.date}? Remaining balance will be adjusted back.`,
      confirmButtonText: 'Yes, Delete Payment'
    });

    if (isConfirmed) {
      const res = await deleteClearancePayment(payment.id, c.id);
      if (res?.success) {
        showToast('Payment deleted successfully!', 'success');
        if (res.clearance) setActiveClearance(res.clearance);
      } else {
        showError('Delete Failed', res?.message || 'Could not delete payment');
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150 transition-colors">
          
          {/* Top Header */}
          <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700/80">
                <ReceiptText className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Clearing Account & Payment Ledger
                  </h2>
                  {isCleared ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Cleared
                    </span>
                  ) : isPartial ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Partial Due
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Unpaid
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>Agent: <strong className="text-slate-900 dark:text-white font-semibold">{c.clearingAgent || 'BARCA TRADERS'}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>Cont: <strong className="font-mono text-slate-800 dark:text-slate-200">{c.containerNumber || 'N/A'}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-slate-200 dark:border-slate-700">
                    Inv #{c.invoiceNo}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden shrink-0">
              <button
                type="button"
                onClick={() => setIsRecordPaymentOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Payment</span>
              </button>

              <button
                type="button"
                onClick={() => downloadClearancePDF(activeClearance)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Ledger</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body / Khata Ledger Sheet */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
            
            {/* 1. Khata Financial Summary KPI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Clearance Bill
                </span>
                <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-white mt-1">
                  Rs. {Math.round(grandTotal).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Total consignment duty & port charges</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Total Paid
                </span>
                <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  Rs. {Math.round(paidAmount).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {payments.length} installment{payments.length === 1 ? '' : 's'} recorded
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${remainingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                  Remaining Balance Due
                </span>
                <div className={`text-xl font-mono font-extrabold mt-1 ${remainingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                  Rs. {Math.round(remainingAmount).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {remainingAmount > 0 ? 'Net balance remaining to be cleared' : 'Fully settled (Account cleared)'}
                </span>
              </div>
            </div>

            {/* 2. Payment History / Ledger Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Payment Installments History (Ledger)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {payments.length} {payments.length === 1 ? 'Payment' : 'Payments'} Recorded
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3.5 w-10 text-center">#</th>
                      <th className="py-2.5 px-3.5">Payment Date</th>
                      <th className="py-2.5 px-3.5">Payment Mode</th>
                      <th className="py-2.5 px-3.5">Slip / Ref #</th>
                      <th className="py-2.5 px-3.5">Remarks / Description</th>
                      <th className="py-2.5 px-3.5 text-right">Amount Paid</th>
                      <th className="py-2.5 px-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                          No payments recorded yet for this bill. Click "Record Payment" to add.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                            {p.date}
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold whitespace-nowrap border border-slate-200/80 dark:border-slate-700/80">
                              {p.paymentMethod || 'Bank Transfer'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {p.refNo || '—'}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                            {p.notes || 'Clearance installment'}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            + Rs. {Math.round(Number(p.amount)).toLocaleString()}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Original Bill Itemized Breakdown Accordion */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBillBreakdown(prev => !prev)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-left flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Original Clearance Duty & Charges Breakdown</span>
                </div>
                {showBillBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showBillBreakdown && (
                <div className="p-4 space-y-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block font-medium">Custom Duty:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(c.customDuty || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Shipping Line + Empty:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(c.shippingLineCharges || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Port Payment:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(c.portPayment || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Clearance Charges:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(c.clearanceCharges || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Consignee (Concinises):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(c.consigneeCharges || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">DryPort Expenses:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(c.dryPortExpenses || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Service & Agency:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        Rs. {Math.round(Number(c.serviceCharges || 0) + Number(c.agencyFee || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Other Expenses:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        Rs. {Math.round(Number(c.otherExpenses || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Total Calculated Consignment Bill:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {Math.round(grandTotal).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && (
        <RecordClearancePaymentModal
          clearance={activeClearance}
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          onSuccess={(updated) => {
            if (updated) setActiveClearance(updated);
          }}
        />
      )}
    </>
  );
};

