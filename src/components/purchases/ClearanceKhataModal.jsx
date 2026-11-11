import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Receipt,
  MoreVertical,
  Edit3
} from 'lucide-react';
import { showToast, showError, confirmDelete } from '../../utils/sweetalert';
import { RecordClearancePaymentModal } from './RecordClearancePaymentModal';
import { NewClearanceModal } from './NewClearanceModal';
import { downloadClearancePDF } from '../../utils/pdfGenerator';
import logoImg from '../../images/khan jacket logo.png';

export const ClearanceKhataModal = ({ clearance, isOpen, onClose }) => {
  const { deleteClearancePayment, updateClearancePayment, deleteClearance, clearances = [] } = useApp();

  const [activeItem, setActiveItem] = useState(clearance);
  const [viewScope, setViewScope] = useState('ALL'); // 'ALL' (All Bills for Agent) | 'SINGLE' (Selected Bill)
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'BILLS' | 'PAYMENTS'
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [showBillBreakdown, setShowBillBreakdown] = useState(false);
  const [paymentTargetClearance, setPaymentTargetClearance] = useState(null);

  // Row dropdown & edit states
  const [activeRowDropdown, setActiveRowDropdown] = useState(null);
  const [editingClearanceBill, setEditingClearanceBill] = useState(null);
  const [editingPaymentData, setEditingPaymentData] = useState(null);

  // Close dropdown on outside click or scroll
  useEffect(() => {
    const handleCloseDropdown = (e) => {
      if (e?.target?.closest?.('.ledger-row-dropdown') || e?.target?.closest?.('.ledger-row-trigger')) return;
      setActiveRowDropdown(null);
    };
    if (activeRowDropdown) {
      document.addEventListener('click', handleCloseDropdown);
      window.addEventListener('resize', handleCloseDropdown);
      window.addEventListener('scroll', handleCloseDropdown, true);
    }
    return () => {
      document.removeEventListener('click', handleCloseDropdown);
      window.removeEventListener('resize', handleCloseDropdown);
      window.removeEventListener('scroll', handleCloseDropdown, true);
    };
  }, [activeRowDropdown]);

  // Sync state whenever clearance or clearances change
  useEffect(() => {
    if (clearance) {
      if (clearance.isAgentKhata) {
        setActiveItem(clearance);
        setViewScope('ALL');
      } else {
        const fresh = clearances.find(c => c.id === clearance.id);
        setActiveItem(fresh || clearance);
        setViewScope('SINGLE');
      }
    }
  }, [clearance, clearances]);

  if (!isOpen || !activeItem) return null;

  // Determine Agent Name & Party
  const agentName = (activeItem.agentName || activeItem.clearingAgent || 'BARCA TRADERS').trim();
  const partyName = activeItem.party || 'TOOR HAJI';
  const consigneeName = activeItem.consignee || '';
  const agencyName = activeItem.agency || '';
  const portName = activeItem.port || 'AKDP / DryPort';

  // Find all clearances for this agent
  const agentBills = clearances.filter(c => 
    (c.clearingAgent || '').trim().toLowerCase() === agentName.toLowerCase()
  );

  // Target bills based on viewScope
  const targetBills = viewScope === 'SINGLE' && !activeItem.isAgentKhata
    ? [activeItem]
    : (agentBills.length > 0 ? agentBills : (activeItem.bills || [activeItem]));

  // Build unified chronological running ledger
  const transactions = [];

  targetBills.forEach(b => {
    const bGrand = Number(b.grandTotal) || 0;
    const bDate = b.billDate || (b.createdAt ? b.createdAt.split('T')[0] : '2026-11-10');
    const rawBDate = new Date(bDate || 0).getTime();

    // 1. Bill Debit Entry (Charges added to account)
    transactions.push({
      id: `bill-${b.id}`,
      clearanceId: b.id,
      type: 'BILL',
      date: bDate,
      rawDate: rawBDate,
      ref: `Bill #${b.invoiceNo}`,
      container: b.containerNumber || 'Cont N/A',
      containerSize: b.containerSize || '',
      gdNo: b.gdNo,
      blNo: b.blNumber,
      description: `Container Clearance & Duty Charges (${b.containerNumber || 'Consignment'}${b.containerSize ? ` ${b.containerSize}` : ''}${b.port ? ` • ${b.port}` : ''})`,
      debit: bGrand,
      credit: 0,
      originalBill: b
    });

    // 2. Associated Payment Credit Entries
    if (Array.isArray(b.payments)) {
      b.payments.forEach(p => {
        const pDate = p.date || (p.createdAt ? p.createdAt.split('T')[0] : bDate);
        const rawPDate = new Date(pDate || 0).getTime();
        transactions.push({
          id: `payment-${p.id}`,
          clearanceId: b.id,
          type: 'PAYMENT',
          date: pDate,
          rawDate: rawPDate + 1, // Ensure payment appears after bill on same day
          ref: p.refNo || `REC-${p.id}`,
          container: b.containerNumber || '',
          billInvoiceNo: b.invoiceNo,
          description: p.notes || `Installment Payment (${p.paymentMethod || 'Bank Transfer'}) - Bill #${b.invoiceNo}`,
          paymentMethod: p.paymentMethod || 'Bank Transfer',
          debit: 0,
          credit: Number(p.amount) || 0,
          originalPayment: p,
          originalBill: b
        });
      });
    }
  });

  // Sort chronological: oldest first to calculate accurate running balance
  transactions.sort((a, b) => a.rawDate - b.rawDate);

  // Compute running balance
  let running = 0;
  const ledgerWithBalance = transactions.map((t, idx) => {
    running = running + t.debit - t.credit;
    return {
      ...t,
      sr: idx + 1,
      runningBalance: running
    };
  });

  // Financial KPIs
  const totalBilled = targetBills.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
  const totalPaid = targetBills.reduce((s, b) => s + (Number(b.paidAmount) || 0), 0);
  const totalRemaining = Math.max(0, totalBilled - totalPaid);

  const isCleared = totalRemaining <= 0 && totalBilled > 0;
  const isPartial = totalPaid > 0 && totalRemaining > 0;

  // Filter ledger for UI table display
  const filteredLedger = ledgerWithBalance.filter(entry => {
    if (typeFilter === 'BILLS' && entry.type !== 'BILL') return false;
    if (typeFilter === 'PAYMENTS' && entry.type !== 'PAYMENT') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = 
        entry.ref.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.date.toLowerCase().includes(q) ||
        (entry.container && entry.container.toLowerCase().includes(q)) ||
        (entry.paymentMethod && entry.paymentMethod.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPayment = () => {
    // If viewing single bill, pick that bill. If agent khata, find the first unpaid bill or fallback to first
    const target = targetBills.find(b => {
      const rem = Number(b.remainingAmount !== undefined ? b.remainingAmount : Math.max(0, Number(b.grandTotal || 0) - Number(b.paidAmount || 0)));
      return rem > 0;
    }) || targetBills[0];

    setPaymentTargetClearance(target);
    setIsRecordPaymentOpen(true);
  };

  const handleToggleRowDropdown = (e, row) => {
    e.stopPropagation();
    if (activeRowDropdown?.id === row.id) {
      setActiveRowDropdown(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = row.type === 'BILL' ? 140 : 100;
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = rect.bottom + 4;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      top = rect.top - dropdownHeight - 4;
    }
    const width = 160;
    const left = Math.max(10, rect.right - width);
    setActiveRowDropdown({
      id: row.id,
      row,
      top,
      left
    });
  };

  const handleDeleteBill = async (bill) => {
    const isConfirmed = await confirmDelete({
      title: `Delete Clearance Bill #${bill.invoiceNo}?`,
      text: `Are you sure you want to delete clearance bill #${bill.invoiceNo} (Rs. ${Number(bill.grandTotal || 0).toLocaleString()})? This action cannot be undone.`,
      confirmButtonText: 'Yes, Delete Bill'
    });

    if (isConfirmed) {
      const res = await deleteClearance(bill.id);
      if (res?.success) {
        showToast(`Clearance bill #${bill.invoiceNo} deleted successfully!`, 'success');
        const remaining = targetBills.filter(b => b.id !== bill.id);
        if (remaining.length === 0) {
          onClose();
        } else {
          setActiveItem(remaining[0]);
        }
      } else {
        showError('Delete Failed', res?.message || 'Could not delete clearance bill');
      }
    }
  };

  const handleDeletePayment = async (payment, clearanceId) => {
    const isConfirmed = await confirmDelete({
      title: `Delete Payment of Rs. ${Number(payment.amount).toLocaleString()}?`,
      text: `Are you sure you want to revert this payment made on ${payment.date}? Remaining balance will be adjusted back.`,
      confirmButtonText: 'Yes, Delete Payment'
    });

    if (isConfirmed) {
      const res = await deleteClearancePayment(payment.id, clearanceId);
      if (res?.success) {
        showToast('Payment deleted successfully!', 'success');
        if (res.clearance) {
          if (!activeItem.isAgentKhata && activeItem.id === res.clearance.id) {
            setActiveItem(res.clearance);
          }
        }
      } else {
        showError('Delete Failed', res?.message || 'Could not delete payment');
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150 transition-colors">
          
          {/* Top Header */}
          <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
                <Anchor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Clearing Khata & Account Ledger
                  </h2>
                  {isCleared ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Cleared
                    </span>
                  ) : isPartial ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Partial Due
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Unpaid
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>Clearing Agent: <strong className="text-slate-900 dark:text-white font-bold">{agentName}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>Party: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{partyName}</strong></span>
                  {consigneeName && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>Consignee: <strong className="text-slate-700 dark:text-slate-300">{consigneeName}</strong></span>
                    </>
                  )}
                  {portName && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">{portName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 print:hidden shrink-0 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleOpenPayment}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Payment</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                title="Print Khata Statement"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scope Switcher: All Bills of Agent vs Single Bill */}
          {agentBills.length > 1 && (
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Khata Scope:</span>
                <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewScope('ALL')}
                    className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                      viewScope === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Full Party Khata ({agentBills.length} Bills)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewScope('SINGLE')}
                    className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                      viewScope === 'SINGLE'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    This Bill Only #{activeItem.invoiceNo || agentBills[0]?.invoiceNo}
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {targetBills.length} Bill{targetBills.length === 1 ? '' : 's'} included in statement
              </div>
            </div>
          )}

          {/* Modal Body / Khata Ledger Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            
            {/* 1. Khata Financial Summary KPI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Billed (Charges)
                </span>
                <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-white mt-1">
                  Rs. {Math.round(totalBilled).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {targetBills.length} Consignment{targetBills.length === 1 ? '' : 's'} duty & port charges
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Total Paid (Adaigi)
                </span>
                <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  Rs. {Math.round(totalPaid).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {transactions.filter(t => t.type === 'PAYMENT').length} installment payments recorded
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${totalRemaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                  Remaining Balance Due (Baqaya)
                </span>
                <div className={`text-xl font-mono font-extrabold mt-1 ${totalRemaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                  Rs. {Math.round(totalRemaining).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {totalRemaining > 0 ? 'Net balance payable to clearing agent' : 'Fully settled (Khata cleared)'}
                </span>
              </div>
            </div>

            {/* 2. Filters & Search for Ledger */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ledger by Ref #, Container #, Description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-hidden focus:border-blue-500 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    typeFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({ledgerWithBalance.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('BILLS')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    typeFilter === 'BILLS'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Bills ({ledgerWithBalance.filter(t => t.type === 'BILL').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('PAYMENTS')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    typeFilter === 'PAYMENTS'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Payments ({ledgerWithBalance.filter(t => t.type === 'PAYMENT').length})
                </button>
              </div>
            </div>

            {/* 3. Comprehensive Running Khata Ledger Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-center">Type</th>
                      <th className="py-2.5 px-3">Ref / Bill #</th>
                      <th className="py-2.5 px-3">Particulars & Description</th>
                      <th className="py-2.5 px-3 text-right">Billed (Debit +)</th>
                      <th className="py-2.5 px-3 text-right">Paid (Credit -)</th>
                      <th className="py-2.5 px-3 text-right">Balance Due (=)</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-10 text-center text-slate-400 font-medium">
                          No transactions found in ledger. Click "+ Record Payment" to record an installment.
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((row) => {
                        const isBill = row.type === 'BILL';
                        return (
                          <tr 
                            key={row.id} 
                            className={`transition-colors ${
                              isBill 
                                ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40' 
                                : 'bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                            }`}
                          >
                            {/* Sr # */}
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                              {row.sr}
                            </td>

                            {/* Date */}
                            <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                              {row.date}
                            </td>

                            {/* Type */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {isBill ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
                                  <Receipt className="w-3 h-3" />
                                  Bill
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                                  <ArrowDownLeft className="w-3 h-3" />
                                  Paid
                                </span>
                              )}
                            </td>

                            {/* Ref / Bill # */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {row.ref}
                              </span>
                              {row.container && (
                                <div className="text-[10px] font-mono text-slate-400">
                                  Cont: {row.container}
                                </div>
                              )}
                            </td>

                            {/* Particulars & Description */}
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-sm">
                              <div className="truncate font-medium" title={row.description}>
                                {row.description}
                              </div>
                              {row.paymentMethod && (
                                <div className="text-[10px] text-slate-400">
                                  Mode: <span className="font-semibold text-slate-500 dark:text-slate-300">{row.paymentMethod}</span>
                                </div>
                              )}
                            </td>

                            {/* Billed (Debit +) */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                              {row.debit > 0 ? `Rs. ${Math.round(row.debit).toLocaleString()}` : '—'}
                            </td>

                            {/* Paid (Credit -) */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {row.credit > 0 ? `- Rs. ${Math.round(row.credit).toLocaleString()}` : '—'}
                            </td>

                            {/* Running Balance Due (=) */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-extrabold text-xs">
                              <span className={row.runningBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                Rs. {Math.round(row.runningBalance).toLocaleString()}
                              </span>
                            </td>

                            {/* Actions (3 Dots Dropdown Trigger) */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleToggleRowDropdown(e, row)}
                                className={`ledger-row-trigger p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  activeRowDropdown?.id === row.id
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title="Actions (Edit, Delete, Download)"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {filteredLedger.length > 0 && (
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700 text-xs">
                      <tr>
                        <td colSpan="5" className="py-3 px-3 uppercase text-[11px] text-slate-500 tracking-wider">
                          Net Khata Balance Total:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-900 dark:text-white">
                          Rs. {Math.round(totalBilled).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          - Rs. {Math.round(totalPaid).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sm text-rose-600 dark:text-rose-400">
                          Rs. {Math.round(totalRemaining).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* 4. Single Bill Itemized Duty Breakdown Accordion (If viewing single bill) */}
            {viewScope === 'SINGLE' && targetBills[0] && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowBillBreakdown(prev => !prev)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 text-left flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Original Bill #{targetBills[0].invoiceNo} Itemized Duty & Port Expenses Breakdown</span>
                  </div>
                  {showBillBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showBillBreakdown && (
                  <div className="p-4 space-y-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block font-medium">Custom Duty:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {Math.round(Number(targetBills[0].customDuty || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Shipping Line + Empty:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {Math.round(Number(targetBills[0].shippingLineCharges || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Port Payment:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {Math.round(Number(targetBills[0].portPayment || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Clearance Charges:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {Math.round(Number(targetBills[0].clearanceCharges || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Consignee (Concinises):</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {Math.round(Number(targetBills[0].consigneeCharges || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">DryPort Expenses:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {Math.round(Number(targetBills[0].dryPortExpenses || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Service & Agency:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          Rs. {Math.round(Number(targetBills[0].serviceCharges || 0) + Number(targetBills[0].agencyFee || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Other Expenses:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          Rs. {Math.round(Number(targetBills[0].otherExpenses || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="font-bold text-slate-600 dark:text-slate-400">Total Landed Consignment Duty & Expenses:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        Rs. {Math.round(Number(targetBills[0].grandTotal || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && paymentTargetClearance && (
        <RecordClearancePaymentModal
          clearance={paymentTargetClearance}
          isOpen={isRecordPaymentOpen}
          onClose={() => {
            setIsRecordPaymentOpen(false);
            setPaymentTargetClearance(null);
          }}
          onSuccess={(updated) => {
            if (updated) {
              if (!activeItem.isAgentKhata && activeItem.id === updated.id) {
                setActiveItem(updated);
              }
            }
          }}
        />
      )}

      {/* Floating 3-Dots Dropdown for Ledger Row */}
      {activeRowDropdown && (
        <div
          className="ledger-row-dropdown fixed z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-100 text-xs"
          style={{ top: activeRowDropdown.top, left: activeRowDropdown.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {activeRowDropdown.row.type === 'BILL' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  const bill = activeRowDropdown.row.originalBill;
                  setActiveRowDropdown(null);
                  setEditingClearanceBill(bill);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">Edit Bill</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const bill = activeRowDropdown.row.originalBill;
                  setActiveRowDropdown(null);
                  downloadClearancePDF(bill);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium">Download PDF</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              <button
                type="button"
                onClick={() => {
                  const bill = activeRowDropdown.row.originalBill;
                  setActiveRowDropdown(null);
                  handleDeleteBill(bill);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-medium">Delete Bill</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  const row = activeRowDropdown.row;
                  setActiveRowDropdown(null);
                  setEditingPaymentData({
                    payment: row.originalPayment,
                    clearanceId: row.clearanceId
                  });
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium">Edit Payment</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              <button
                type="button"
                onClick={() => {
                  const row = activeRowDropdown.row;
                  setActiveRowDropdown(null);
                  handleDeletePayment(row.originalPayment, row.clearanceId);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-medium">Delete Payment</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit Clearance Bill Modal */}
      {editingClearanceBill && (
        <NewClearanceModal
          isOpen={!!editingClearanceBill}
          onClose={() => setEditingClearanceBill(null)}
          editingClearance={editingClearanceBill}
        />
      )}

      {/* Edit Clearance Payment Modal */}
      {editingPaymentData && (
        <EditClearancePaymentModal
          isOpen={!!editingPaymentData}
          paymentData={editingPaymentData}
          onClose={() => setEditingPaymentData(null)}
          onSuccess={(updatedClearance) => {
            if (updatedClearance) {
              if (!activeItem.isAgentKhata && activeItem.id === updatedClearance.id) {
                setActiveItem(updatedClearance);
              }
            }
          }}
        />
      )}
    </>
  );
};

// Dedicated Edit Clearance Payment Modal
const EditClearancePaymentModal = ({ isOpen, paymentData, onClose, onSuccess }) => {
  const { updateClearancePayment } = useApp();
  const payment = paymentData?.payment;
  const clearanceId = paymentData?.clearanceId;

  const [amount, setAmount] = useState(payment ? Number(payment.amount) || '' : '');
  const [date, setDate] = useState(payment?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(payment?.paymentMethod || 'Bank Transfer / Wire');
  const [refNo, setRefNo] = useState(payment?.refNo || '');
  const [notes, setNotes] = useState(payment?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const payNum = Math.max(0, Number(amount) || 0);

    if (payNum <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateClearancePayment(payment.id, clearanceId, {
        amount: payNum,
        date,
        paymentMethod,
        refNo: refNo.trim() || null,
        notes: notes.trim() || null
      });

      if (res?.success) {
        showToast(`Payment of Rs. ${payNum.toLocaleString()} updated successfully!`, 'success');
        if (onSuccess) onSuccess(res.clearance);
        onClose();
      } else {
        setErrorMsg(res?.message || 'Failed to update clearance payment');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while updating payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Clearance Payment Installment
              </h3>
              <p className="text-xs text-slate-400">
                Update payment installment details & ledger balance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Amount (Rs.) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rs.
              </span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              >
                <option value="Bank Transfer / Wire">Bank Transfer / Wire</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Online / Raast">Online / Raast</option>
                <option value="Initial Advance">Initial Advance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Ref # */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reference / Cheque # (Optional)
            </label>
            <input
              type="text"
              value={refNo}
              onChange={e => setRefNo(e.target.value)}
              placeholder="e.g. TR-9942, Chq #4401"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes / Particulars (Optional)
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Details about this payment..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
