import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  CreditCard,
  Pencil,
  FileText,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Check,
  Loader2,
  Ship
} from 'lucide-react';
import { downloadSupplierStatementPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';

export const SupplierStatementModal = () => {
  const {
    selectedSupplierDetail,
    setSelectedSupplierDetail,
    setEditingSupplier,
    setIsEditSupplierOpen,
    purchases = [],
    payments = [],
    setIsRecordPaymentOpen,
    setSelectedSupplierForPayment,
    setIsNewPurchaseOpen,
    setSelectedSupplierForBill,
    updateSupplierPayment,
    deleteSupplierPayment,
    updatePurchase,
    deletePurchase
  } = useApp();

  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'purchases' | 'payments'
  const [statementPage, setStatementPage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const pageSize = 10;

  // 3-Dots Action Dropdown state
  const [activeDropdown, setActiveDropdown] = useState(null); // { id, type, item, top, left }

  // Edit and Delete Modal states
  const [editingEntry, setEditingEntry] = useState(null); // { type: 'PAYMENT' | 'PURCHASE', item }
  const [editForm, setEditForm] = useState({
    amount: '',
    date: '',
    paymentMethod: 'Bank TT / Wire Transfer',
    refNo: '',
    notes: '',
    containerNo: ''
  });
  const [deletingEntry, setDeletingEntry] = useState(null); // { type: 'PAYMENT' | 'PURCHASE', item }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Close dropdown on outside click, window resize or scroll
  useEffect(() => {
    const handleClose = (e) => {
      if (e?.target?.closest?.('.statement-action-menu')) return;
      setActiveDropdown(null);
    };
    if (activeDropdown) {
      document.addEventListener('click', handleClose);
      window.addEventListener('resize', handleClose);
      window.addEventListener('scroll', handleClose, true);
    }
    return () => {
      document.removeEventListener('click', handleClose);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [activeDropdown]);

  if (!selectedSupplierDetail) return null;

  const sup = selectedSupplierDetail;

  // Filter purchases for this supplier
  const supPurchases = purchases.filter(p => p.supplierId === sup.id);

  // Filter payments for this supplier
  const supPayments = payments.filter(p => p.supplierId === sup.id);

  // Unified chronological statement with running balance
  const rawTransactions = [
    ...supPurchases.map(p => ({
      id: p.id,
      originalItem: p,
      type: 'PURCHASE',
      date: p.purchaseDate,
      rawDate: new Date(p.purchaseDate || 0).getTime(),
      ref: `Invoice #${p.invoiceNo}`,
      description: `Container Import (${p.items?.map(i => `${i.articleNo} x${i.quantity}`).join(', ') || 'Consignment'})`,
      debit: Number(p.totalBill || 0),
      credit: 0
    })),
    ...supPayments.map(pay => ({
      id: pay.id,
      originalItem: pay,
      type: 'PAYMENT',
      date: pay.date,
      rawDate: new Date(pay.date || 0).getTime(),
      ref: `Payment (${pay.paymentMethod || 'TT'})`,
      description: `Ref: ${pay.refNo} - ${pay.notes || 'Settlement'}`,
      debit: 0,
      credit: Number(pay.amount || 0)
    }))
  ].sort((a, b) => a.rawDate - b.rawDate);

  // Compute running balance starting from opening balance
  let running = Number(sup.openingBalance || 0);
  const ledgerEntries = rawTransactions.map((tx, idx) => {
    running = running + (Number(tx.debit) || 0) - (Number(tx.credit) || 0);
    return {
      ...tx,
      index: idx + 1,
      balanceAfter: running
    };
  });

  const handleOpenPayment = () => {
    if (setSelectedSupplierForPayment) setSelectedSupplierForPayment(sup);
    setIsRecordPaymentOpen(true);
  };

  const handleOpenNewBill = () => {
    if (setSelectedSupplierForBill) setSelectedSupplierForBill(sup);
    setIsNewPurchaseOpen(true);
  };

  const handleOpenEdit = () => {
    setEditingSupplier(sup);
    setIsEditSupplierOpen(true);
  };

  // Toggle 3-dots action dropdown
  const handleToggleDropdown = (e, type, item) => {
    e.stopPropagation();
    if (activeDropdown?.id === item.id && activeDropdown?.type === type) {
      setActiveDropdown(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 96;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top = rect.bottom + 6;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      top = rect.top - dropdownHeight - 6;
    }

    const width = 160;
    const left = Math.max(10, rect.right - width);

    setActiveDropdown({
      id: item.id,
      type,
      item,
      top,
      left
    });
  };

  // Initiate Edit
  const handleStartEdit = (type, item) => {
    setActiveDropdown(null);
    setActionError('');
    if (type === 'PAYMENT') {
      setEditForm({
        amount: item.amount || '',
        date: item.date || '',
        paymentMethod: item.paymentMethod || 'Bank TT / Wire Transfer',
        refNo: item.refNo || '',
        notes: item.notes || '',
        containerNo: ''
      });
    } else {
      setEditForm({
        amount: item.totalBill || '',
        date: item.purchaseDate || '',
        paymentMethod: '',
        refNo: item.invoiceNo || '',
        notes: item.notes || '',
        containerNo: item.containerNo || ''
      });
    }
    setEditingEntry({ type, item });
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    setIsSubmitting(true);
    setActionError('');

    try {
      if (editingEntry.type === 'PAYMENT') {
        const amt = Number(editForm.amount);
        if (isNaN(amt) || amt <= 0) {
          setActionError('Please enter a valid positive payment amount');
          setIsSubmitting(false);
          return;
        }

        const res = await updateSupplierPayment(editingEntry.item.id, {
          amount: amt,
          date: editForm.date,
          paymentMethod: editForm.paymentMethod,
          refNo: editForm.refNo,
          notes: editForm.notes
        });

        if (!res?.success) {
          setActionError(res?.message || 'Failed to update payment');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await updatePurchase(editingEntry.item.id, {
          purchaseDate: editForm.date,
          containerNo: editForm.containerNo,
          notes: editForm.notes
        });

        if (!res?.success) {
          setActionError(res?.message || 'Failed to update purchase entry');
          setIsSubmitting(false);
          return;
        }
      }

      setEditingEntry(null);
    } catch (err) {
      setActionError(err.message || 'An error occurred while updating');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initiate Delete
  const handleStartDelete = (type, item) => {
    setActiveDropdown(null);
    setActionError('');
    setDeletingEntry({ type, item });
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingEntry) return;
    setIsSubmitting(true);
    setActionError('');

    try {
      if (deletingEntry.type === 'PAYMENT') {
        const res = await deleteSupplierPayment(deletingEntry.item.id);
        if (!res?.success) {
          setActionError(res?.message || 'Failed to delete payment');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await deletePurchase(deletingEntry.item.id);
        if (!res?.success) {
          setActionError(res?.message || 'Failed to delete purchase consignment');
          setIsSubmitting(false);
          return;
        }
      }

      setDeletingEntry(null);
    } catch (err) {
      setActionError(err.message || 'An error occurred while deleting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Unified Single-Line Clean ERP Layout */}
        <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-nowrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white whitespace-nowrap">
                Supplier Khata Statement
              </h2>
              <span className="text-slate-300 dark:text-slate-600 font-light">•</span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400 truncate">
                {sup.company || sup.name}
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                {sup.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Contact: {sup.name} {sup.phone ? `• ${sup.phone}` : ''} {sup.address ? `• ${sup.address}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              title="Edit Vendor Details"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => downloadSupplierStatementPDF(sup, supPurchases, supPayments)}
              className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors font-medium cursor-pointer flex items-center gap-1.5"
              title="Download Statement PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSupplierDetail(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Statement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Core Highlight KPI Cards - Compact ERP Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          
          {/* Total Purchases */}
          <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
              Total Purchases
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5 leading-snug">
              Rs. {Math.round(Number(sup.totalPurchases || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-none">
              {supPurchases.length} Consignment Invoices
            </div>
          </div>

          {/* Total Payments */}
          <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
              Total Paid (TT / Bank)
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 leading-snug">
              Rs. {Math.round(Number(sup.totalPayments || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-none">
              {supPayments.length} Wire Transfers Recorded
            </div>
          </div>

          {/* Remaining Balance */}
          <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
              Outstanding Baqaya Due
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 leading-snug">
              Rs. {Math.round(Number(sup.remainingBalance || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-none">
              Net Payable Accounts
            </div>
          </div>

        </div>

        {/* Sub-tabs and Record Payment CTA */}
        <div className="px-6 pt-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex space-x-1 sm:space-x-2">
            {[
              { id: 'statement', label: 'Ledger Statement', count: ledgerEntries.length },
              { id: 'purchases', label: 'Purchases History', count: supPurchases.length },
              { id: 'payments', label: 'Payments History', count: supPayments.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={handleOpenNewBill}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Ship className="w-3.5 h-3.5" />
              <span>+ New Bill</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPayment}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          
          {/* 1. Complete Chronological Ledger Statement */}
          {activeTab === 'statement' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Ref #</th>
                      <th className="py-2.5 px-3.5">Particulars / Description</th>
                      <th className="py-2.5 px-3.5 text-right">Debit / Bill</th>
                      <th className="py-2.5 px-3.5 text-right">Credit / Paid</th>
                      <th className="py-2.5 px-3.5 text-right">Running Balance</th>
                      <th className="py-2.5 px-4 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 font-medium text-slate-600 dark:text-slate-400">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">Opening</td>
                      <td className="py-2.5 px-3.5 font-mono">—</td>
                      <td className="py-2.5 px-3.5 text-slate-500">Initial balance brought forward</td>
                      <td className="py-2.5 px-3.5 text-right font-mono">—</td>
                      <td className="py-2.5 px-3.5 text-right font-mono">—</td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(sup.openingBalance || 0)).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-300 dark:text-slate-600 font-mono text-xs">—</td>
                    </tr>

                    {ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No transactions recorded yet for this vendor.
                        </td>
                      </tr>
                    ) : (
                      ledgerEntries.slice((statementPage - 1) * pageSize, statementPage * pageSize).map((row) => (
                        <tr key={`${row.type}-${row.id}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {row.ref}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={row.description}>
                            {row.description}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {row.debit > 0 ? `Rs. ${Math.round(row.debit).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {row.credit > 0 ? `Rs. ${Math.round(row.credit).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            Rs. {Math.round(row.balanceAfter).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => handleToggleDropdown(e, row.type, row.originalItem)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Khata Actions"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {ledgerEntries.length > pageSize && (
                <Pagination
                  currentPage={statementPage}
                  totalItems={ledgerEntries.length}
                  pageSize={pageSize}
                  onPageChange={setStatementPage}
                  itemLabel="transactions"
                />
              )}
            </div>
          )}

          {/* 2. Purchases History */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Invoice No</th>
                      <th className="py-2.5 px-3.5">Articles & Quantities</th>
                      <th className="py-2.5 px-3.5 text-right">Total Bill</th>
                      <th className="py-2.5 px-3.5 text-right">Paid Advance</th>
                      <th className="py-2.5 px-3.5 text-right">Remaining</th>
                      <th className="py-2.5 px-4 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {supPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No purchases recorded yet for this supplier.
                        </td>
                      </tr>
                    ) : (
                      supPurchases.slice((purchasesPage - 1) * pageSize, purchasesPage * pageSize).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {p.purchaseDate}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {p.invoiceNo}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-800 dark:text-slate-200">
                            {p.items?.map(i => `${i.articleNo} (${i.quantity} pcs)`).join(', ') || 'Consignment'}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            Rs. {Math.round(Number(p.totalBill || 0)).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            Rs. {Math.round(Number(p.paidAmount || 0)).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            Rs. {Math.round(Number(p.remainingAmount || 0)).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => handleToggleDropdown(e, 'PURCHASE', p)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Purchase Actions"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {supPurchases.length > pageSize && (
                <Pagination
                  currentPage={purchasesPage}
                  totalItems={supPurchases.length}
                  pageSize={pageSize}
                  onPageChange={setPurchasesPage}
                  itemLabel="invoices"
                />
              )}
            </div>
          )}

          {/* 3. Payments History */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Method</th>
                      <th className="py-2.5 px-3.5">Reference #</th>
                      <th className="py-2.5 px-3.5 text-right">Paid Amount</th>
                      <th className="py-2.5 px-3.5">Recorded By</th>
                      <th className="py-2.5 px-3.5">Remarks</th>
                      <th className="py-2.5 px-4 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {supPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No payments recorded yet for this supplier.
                        </td>
                      </tr>
                    ) : (
                      supPayments.slice((paymentsPage - 1) * pageSize, paymentsPage * pageSize).map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {pay.date}
                          </td>
                          <td className="py-2.5 px-3.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {pay.paymentMethod}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {pay.refNo}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            Rs. {Math.round(Number(pay.amount || 0)).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {pay.recordedBy || 'Admin'}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={pay.notes}>
                            {pay.notes || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => handleToggleDropdown(e, 'PAYMENT', pay)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Payment Actions"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {supPayments.length > pageSize && (
                <Pagination
                  currentPage={paymentsPage}
                  totalItems={supPayments.length}
                  pageSize={pageSize}
                  onPageChange={setPaymentsPage}
                  itemLabel="payments"
                />
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 dark:text-slate-400">
            Current Outstanding Balance: <strong className="font-mono text-rose-600 dark:text-rose-400 text-sm">Rs. {Math.round(Number(sup.remainingBalance || 0)).toLocaleString()}</strong>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSupplierDetail(null)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close Statement
          </button>
        </div>

      </div>

      {/* Floating 3-Dots Action Dropdown Menu */}
      {activeDropdown && (
        <div
          className="statement-action-menu fixed z-[999] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 min-w-[150px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${activeDropdown.top}px`, left: `${activeDropdown.left}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleStartEdit(activeDropdown.type, activeDropdown.item)}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit Entry</span>
          </button>

          <button
            type="button"
            onClick={() => handleStartDelete(activeDropdown.type, activeDropdown.item)}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete Entry</span>
          </button>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingEntry.type === 'PAYMENT' ? 'Edit Supplier Payment' : 'Edit Consignment Bill'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editingEntry.type === 'PAYMENT' 
                    ? `Ref: ${editingEntry.item.refNo} • Vendor: ${sup.company}`
                    : `Invoice: #${editingEntry.item.invoiceNo} • Vendor: ${sup.company}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5">
              {actionError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {editingEntry.type === 'PAYMENT' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Amount (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={editForm.amount}
                      onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Amount update will automatically adjust vendor remaining khata.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={editForm.date}
                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Method *
                      </label>
                      <select
                        value={editForm.paymentMethod}
                        onChange={(e) => setEditForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Bank TT / Wire Transfer">Bank TT / Wire Transfer</option>
                        <option value="Cash Payment">Cash Payment</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online Bank Transfer">Online Bank Transfer</option>
                        <option value="Pay Order">Pay Order</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reference / Slip #
                    </label>
                    <input
                      type="text"
                      value={editForm.refNo}
                      onChange={(e) => setEditForm(prev => ({ ...prev, refNo: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. TT-89421"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Notes / Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.notes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Cleared for Container 8"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Invoice No
                      </label>
                      <input
                        type="text"
                        disabled
                        value={editForm.refNo}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Purchase Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={editForm.date}
                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Container / Bilty #
                    </label>
                    <input
                      type="text"
                      value={editForm.containerNo}
                      onChange={(e) => setEditForm(prev => ({ ...prev, containerNo: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. COSCO-99238"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Remarks / Port Gate Pass
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.notes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Unloaded in Lahore godown"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setEditingEntry(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEntry && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm shadow-2xl p-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {deletingEntry.type === 'PAYMENT' ? 'Delete Payment Entry?' : 'Delete Purchase Consignment?'}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {deletingEntry.type === 'PAYMENT' ? (
                <>
                  Are you sure you want to delete payment <strong className="text-slate-700 dark:text-slate-200 font-mono">{deletingEntry.item.refNo}</strong> for <strong className="text-emerald-600 font-mono">Rs. {Number(deletingEntry.item.amount).toLocaleString()}</strong>?
                  <br />
                  <span className="text-[11px] text-rose-500 mt-1 block">
                    This will restore Rs. {Number(deletingEntry.item.amount).toLocaleString()} to the vendor's outstanding balance.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to delete Invoice <strong className="text-slate-700 dark:text-slate-200 font-mono">#{deletingEntry.item.invoiceNo}</strong> (Total: <strong className="text-slate-800 dark:text-slate-200 font-mono">Rs. {Number(deletingEntry.item.totalBill).toLocaleString()}</strong>)?
                  <br />
                  <span className="text-[11px] text-rose-500 mt-1 block">
                    This will revert article inventory stock and recalculate vendor ledger.
                  </span>
                </>
              )}
            </p>

            {actionError && (
              <div className="mt-3 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 text-left">
                {actionError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeletingEntry(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
