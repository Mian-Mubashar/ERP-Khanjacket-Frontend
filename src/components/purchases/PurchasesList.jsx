import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Ship,
  Plus,
  Search,
  Eye,
  Download,
  CheckCircle2,
  X,
  Receipt,
  CreditCard,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { downloadInvoicePDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';
import { confirmDelete, showToast, showError } from '../../utils/sweetalert';

export const PurchasesList = () => {
  const { 
    purchases = [], 
    updatePurchase,
    deletePurchase,
    setIsNewPurchaseOpen, 
    setSelectedArticleDetail, 
    articles = [] 
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 3-Dots Dropdown State
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Edit Modal State
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editForm, setEditForm] = useState({
    invoiceNo: '',
    purchaseDate: '',
    containerNo: '',
    extraExpenses: 0,
    expenseNote: 'Freight & Clearing',
    paidAmount: 0,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Close active dropdown on outside click, window resize, or scroll
  useEffect(() => {
    const handleClose = (e) => {
      if (e?.target?.closest?.('.purchase-action-menu')) return;
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

  const handleToggleDropdown = (e, item) => {
    e.stopPropagation();
    if (activeDropdown?.id === item.id) {
      setActiveDropdown(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 160;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top = rect.bottom + 6;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      top = rect.top - dropdownHeight - 6;
    }

    const width = 185;
    const left = Math.max(10, rect.right - width);

    setActiveDropdown({
      id: item.id,
      item,
      top,
      left
    });
  };

  const handleStartEdit = (pur) => {
    setActiveDropdown(null);
    setEditError('');
    setEditForm({
      invoiceNo: pur.invoiceNo || '',
      purchaseDate: pur.purchaseDate || '',
      containerNo: pur.containerNo || '',
      extraExpenses: Number(pur.extraExpenses) || 0,
      expenseNote: pur.expenseNote || 'Freight & Clearing',
      paidAmount: Number(pur.paidAmount) || 0,
      notes: pur.notes || ''
    });
    setEditingPurchase(pur);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPurchase) return;
    setIsSubmitting(true);
    setEditError('');

    try {
      const extraExpensesNum = Math.max(0, Number(editForm.extraExpenses) || 0);
      const paidAmountNum = Math.max(0, Number(editForm.paidAmount) || 0);

      const res = await updatePurchase(editingPurchase.id, {
        invoiceNo: editForm.invoiceNo.trim(),
        purchaseDate: editForm.purchaseDate,
        containerNo: editForm.containerNo.trim(),
        extraExpenses: extraExpensesNum,
        expenseNote: editForm.expenseNote.trim(),
        paidAmount: paidAmountNum,
        notes: editForm.notes.trim()
      });

      if (res?.success) {
        showToast(`Purchase invoice #${editForm.invoiceNo} updated successfully!`, 'success');
        setEditingPurchase(null);
      } else {
        setEditError(res?.message || 'Failed to update purchase invoice');
      }
    } catch (err) {
      setEditError(err.message || 'An error occurred while updating purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pur) => {
    setActiveDropdown(null);
    const totalPcs = pur.items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) || 0;
    const isConfirmed = await confirmDelete({
      title: `Delete Invoice #${pur.invoiceNo}?`,
      text: `Are you sure you want to delete China purchase invoice #${pur.invoiceNo} (${pur.supplierName})? This will safely revert ${totalPcs.toLocaleString()} pcs from warehouse stock and adjust supplier balance by Rs. ${Math.round(Number(pur.totalBill || 0)).toLocaleString()}.`,
      confirmButtonText: 'Yes, Delete Purchase'
    });

    if (isConfirmed) {
      const res = await deletePurchase(pur.id);
      if (res?.success) {
        showToast(`Invoice #${pur.invoiceNo} deleted successfully!`, 'success');
      } else {
        showError('Cannot Delete Purchase', res?.message || 'Failed to delete purchase record');
      }
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    p.containerNo?.toLowerCase().includes(search.toLowerCase()) ||
    p.items?.some(it => it.articleNo.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPurchasesAmount = purchases.reduce((s, p) => s + (Number(p.totalBill) || 0), 0);
  const totalPaidAmount = purchases.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
  const totalRemainingAmount = purchases.reduce((s, p) => s + (Number(p.remainingAmount) || 0), 0);

  // Live calculation for edit form
  const editItemsSubtotal = Number(editingPurchase?.itemsSubtotal) || 0;
  const editExtraExpenses = Math.max(0, Number(editForm.extraExpenses) || 0);
  const editTotalBill = editItemsSubtotal + editExtraExpenses;
  const editPaidAmount = Math.max(0, Number(editForm.paidAmount) || 0);
  const editRemaining = editTotalBill - editPaidAmount;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">China Purchases & Invoices</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {purchases.length} Shipments
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            China import consignments, multi-article container arrivals, and supplier bills
          </p>
        </div>

        <button
          onClick={() => setIsNewPurchaseOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Bill</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total China Purchases</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">All recorded import bills</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight truncate">
            Rs. {Math.round(totalPurchasesAmount).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total Paid Amount</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0">Paid</span>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Paid via Wire / LC</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
            Rs. {Math.round(totalPaidAmount).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total Remaining Balance</span>
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full shrink-0">Due</span>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Payables to China factories</div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight truncate">
            Rs. {Math.round(totalRemainingAmount).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Invoice #, Supplier Name, Container #, Article (e.g. BF411)..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-hidden transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing {filteredPurchases.length} invoices
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice / Bill #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">China Supplier</th>
                <th className="py-3 px-4">Articles in Container</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                    No purchase records found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.slice((page - 1) * pageSize, page * pageSize).map((pur) => {
                  const totalPcs = pur.items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) || 0;
                  return (
                    <tr
                      key={pur.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedInvoice(pur)}
                    >
                      {/* Invoice No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {pur.invoiceNo}
                        {pur.containerNo && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Cont: {pur.containerNo}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                        {pur.purchaseDate}
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{pur.supplierName}</div>
                      </td>

                      {/* Articles included */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {pur.items?.map((item, idx) => (
                            <span
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                const art = articles.find(a => a.articleNo === item.articleNo);
                                if (art) setSelectedArticleDetail(art);
                              }}
                              className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px] border border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white transition-colors"
                              title="Click to view article record"
                            >
                              {item.articleNo}: {item.quantity} pcs
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Total: {totalPcs.toLocaleString()} pcs
                        </span>
                      </td>

                      {/* Total Bill */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(pur.totalBill || 0)).toLocaleString()}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        Rs. {Math.round(Number(pur.paidAmount || 0)).toLocaleString()}
                      </td>

                      {/* Remaining */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        Rs. {Math.round(Number(pur.remainingAmount || 0)).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Warehouse Received
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleDropdown(e, pur)}
                          className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer border ${
                            activeDropdown?.id === pur.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="Actions Menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 10-Item Pagination */}
        <Pagination
          currentPage={page}
          totalItems={filteredPurchases.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="invoices"
        />
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">
                  China Import Invoice Voucher
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Invoice #{selectedInvoice.invoiceNo}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadInvoicePDF(selectedInvoice)}
                  className="px-3.5 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs font-medium cursor-pointer"
                  title="Download Professional PDF Voucher"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bill Info */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Supplier:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedInvoice.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedInvoice.purchaseDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Container #:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{selectedInvoice.containerNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status:</span>
                  <span className="font-bold text-emerald-600">Stock In Warehouse</span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Article Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.articleNo}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {item.articleName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {item.quantity?.toLocaleString()} pcs
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          Rs. {item.unitCost?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {item.total?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expense & Payment Breakdown */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Items Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    Rs. {selectedInvoice.itemsSubtotal?.toLocaleString()}
                  </span>
                </div>
                {selectedInvoice.extraExpenses > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Freight & Duty ({selectedInvoice.expenseNote}):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      + Rs. {Math.round(Number(selectedInvoice.extraExpenses || 0)).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-blue-200 dark:border-blue-900">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-blue-700 dark:text-blue-400">
                    Rs. {Math.round(Number(selectedInvoice.totalBill || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400">
                  <span>Paid Amount:</span>
                  <span className="font-mono font-bold">
                    - Rs. {Math.round(Number(selectedInvoice.paidAmount || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-blue-200 dark:border-blue-900 text-sm">
                  <span>Remaining Supplier Balance:</span>
                  <span className="font-mono">
                    Rs. {Math.round(Number(selectedInvoice.remainingAmount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Bill
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating 3-Dots Action Dropdown Menu */}
      {activeDropdown && (
        <div
          style={{
            position: 'fixed',
            top: `${activeDropdown.top}px`,
            left: `${activeDropdown.left}px`,
            width: '185px',
            zIndex: 99999
          }}
          className="purchase-action-menu bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl py-1.5 text-left animate-in fade-in zoom-in-95 duration-100"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
            Invoice #{activeDropdown.item.invoiceNo}
          </div>

          <button
            type="button"
            onClick={() => {
              const item = activeDropdown.item;
              setActiveDropdown(null);
              setSelectedInvoice(item);
            }}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>View Bill Voucher</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const item = activeDropdown.item;
              setActiveDropdown(null);
              downloadInvoicePDF(item);
            }}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleStartEdit(activeDropdown.item)}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-500" />
            <span>Edit Invoice</span>
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

          <button
            type="button"
            onClick={() => handleDelete(activeDropdown.item)}
            className="w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete Invoice</span>
          </button>
        </div>
      )}

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-4 my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Purchase Invoice
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Invoice #{editingPurchase.invoiceNo} • Supplier: {editingPurchase.supplierName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Row 1: Invoice No & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Invoice / Bill #
                  </label>
                  <input
                    type="text"
                    value={editForm.invoiceNo}
                    onChange={e => setEditForm(prev => ({ ...prev, invoiceNo: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={editForm.purchaseDate}
                    onChange={e => setEditForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Row 2: Container No & Expense Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Container / Bilty #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MSKU-902144"
                    value={editForm.containerNo}
                    onChange={e => setEditForm(prev => ({ ...prev, containerNo: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Duty / Expense Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Freight & Clearing"
                    value={editForm.expenseNote}
                    onChange={e => setEditForm(prev => ({ ...prev, expenseNote: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Row 3: Extra Expenses & Paid Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Extra Freight & Duties (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.extraExpenses}
                    onChange={e => setEditForm(prev => ({ ...prev, extraExpenses: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-bold font-mono text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Paid Advance (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.paidAmount}
                    onChange={e => setEditForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Articles In Container Summary */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Articles in this Consignment (Stock Inward)
                </label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap gap-1.5 text-xs max-h-24 overflow-y-auto">
                  {editingPurchase.items?.map((it, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-200">
                      <strong>{it.articleNo}</strong>: {it.quantity} pcs @ Rs. {Number(it.unitCost).toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Live Calculation Preview */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Articles Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">Rs. {Math.round(editItemsSubtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Freight & Clearing:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">+ Rs. {Math.round(editExtraExpenses).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-blue-200 dark:border-blue-900">
                  <span>Total Calculated Bill:</span>
                  <span className="font-mono text-blue-700 dark:text-blue-400 text-sm">Rs. {Math.round(editTotalBill).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Advance Paid:</span>
                  <span className="font-mono">- Rs. {Math.round(editPaidAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-blue-200 dark:border-blue-900">
                  <span>Remaining Supplier Baqaya:</span>
                  <span className="font-mono">Rs. {Math.round(editRemaining).toLocaleString()}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Notes / Remarks
                </label>
                <textarea
                  rows="2"
                  value={editForm.notes}
                  onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional consignment notes..."
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
