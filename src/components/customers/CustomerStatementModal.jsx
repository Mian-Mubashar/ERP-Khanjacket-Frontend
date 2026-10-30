import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X,
  Download,
  Truck,
  Wallet,
  Pencil,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react';
import { downloadCustomerKhataPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';

export const CustomerStatementModal = () => {
  const { 
    selectedCustomerKhata, 
    setSelectedCustomerKhata, 
    setSelectedCustomerForPayment,
    setIsRecordCustomerPaymentOpen,
    setIsNewOutwardOpen,
    setSelectedCustomerForBill,
    setEditingCustomer,
    setIsEditCustomerOpen,
    updateCustomer,
    updateCustomerPayment,
    deleteCustomerPayment,
    updateOutward,
    deleteOutward,
    outward = [], 
    customerPayments = [] 
  } = useApp();

  const [activeTab, setActiveTab] = useState('LEDGER'); // 'LEDGER' | 'DISPATCHES' | 'PAYMENTS'
  const [ledgerPage, setLedgerPage] = useState(1);
  const [dispPage, setDispPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const pageSize = 12;

  // 3-Dots Action Dropdown state
  const [activeDropdown, setActiveDropdown] = useState(null); // { id, type, item, top, left }

  // Edit and Delete Modal states
  const [editingEntry, setEditingEntry] = useState(null); // { type: 'PAYMENT' | 'DISPATCH' | 'OPENING', item }
  const [editForm, setEditForm] = useState({
    amount: '',
    date: '',
    paymentMethod: 'Cash Receipt',
    refNo: '',
    notes: '',
    destination: '',
    gatePassNo: ''
  });
  const [deletingEntry, setDeletingEntry] = useState(null); // { type: 'PAYMENT' | 'DISPATCH', item }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Close dropdown on outside click, window resize or scroll
  useEffect(() => {
    const handleClose = (e) => {
      if (e?.target?.closest?.('.customer-statement-action-menu')) return;
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

  if (!selectedCustomerKhata) return null;

  const currentShopName = selectedCustomerKhata.shopName || '';
  const currentShopLower = currentShopName.toLowerCase();

  const customerDispatches = (outward || []).filter(o => 
    (o.customerId && o.customerId === selectedCustomerKhata.id) ||
    (o.customerName && currentShopLower && o.customerName.toLowerCase() === currentShopLower)
  );

  const customerPayHistory = (customerPayments || []).filter(p => 
    p.customerId === selectedCustomerKhata.id ||
    (p.customerName && currentShopLower && p.customerName.toLowerCase().includes(currentShopLower))
  );

  const totalBilled = customerDispatches.reduce((s, d) => s + (Number(d.totalSaleAmount) || 0), 0);
  const totalPaid = customerPayHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const recordedTotalBill = Number(selectedCustomerKhata.totalBill) || 0;
  const openingBalance = Math.max(0, recordedTotalBill - totalBilled);
  const currentNetBalance = Math.max(0, (openingBalance + totalBilled) - totalPaid);

  // Build unified running ledger matching traditional physical Khata
  const events = [];

  // 1. Initial Opening Balance row (if exists)
  if (openingBalance > 0) {
    let createdDateStr = 'Pehla Hisab';
    if (selectedCustomerKhata.createdAt) {
      try {
        createdDateStr = typeof selectedCustomerKhata.createdAt === 'string'
          ? selectedCustomerKhata.createdAt.split('T')[0]
          : new Date(selectedCustomerKhata.createdAt).toISOString().split('T')[0];
      } catch {
        createdDateStr = 'Opening';
      }
    }

    events.push({
      id: 'opening-bal',
      originalItem: { ...selectedCustomerKhata, openingBalance },
      date: createdDateStr,
      rawDate: new Date(selectedCustomerKhata.createdAt || 0).getTime(),
      type: 'OPENING',
      ref: '—',
      desc: 'Sabqa Baqaya / Opening Balance',
      subDesc: 'Registered starting balance',
      debit: openingBalance,
      credit: 0
    });
  }

  // 2. Outward Dispatches (Debits / Billed goods)
  customerDispatches.forEach(d => {
    events.push({
      id: `disp-${d.id}`,
      originalItem: d,
      date: d.date,
      rawDate: new Date(d.date || d.createdAt || 0).getTime(),
      type: 'DISPATCH',
      ref: d.challanNo,
      desc: `Maal Rawangi (Bill #${d.challanNo}) — ${d.articleNo}`,
      subDesc: `${(d.quantity || 0).toLocaleString()} pcs @ Rs. ${(d.unitSalePrice || 0).toLocaleString()} ${d.destination ? `| Muqam: ${d.destination}` : ''}`,
      debit: Number(d.totalSaleAmount) || 0,
      credit: 0
    });
  });

  // 3. Customer Payments (Credits / Wasooli)
  customerPayHistory.forEach(p => {
    events.push({
      id: `pay-${p.id}`,
      originalItem: p,
      date: p.date,
      rawDate: new Date(p.date || p.createdAt || 0).getTime(),
      type: 'PAYMENT',
      ref: p.refNo || `REC-${p.id}`,
      desc: `Wasooli / Payment Received (MK / ${p.paymentMethod || 'Cash'})`,
      subDesc: p.notes ? p.notes : 'Naqad Wasool shuda raqam',
      debit: 0,
      credit: Number(p.amount) || 0
    });
  });

  // Sort chronologically ascending
  events.sort((a, b) => a.rawDate - b.rawDate);

  // Compute line-by-line running balance
  let running = 0;
  const ledgerRows = events.map((item, idx) => {
    running = running + item.debit - item.credit;
    return {
      ...item,
      index: idx + 1,
      runningBalance: running
    };
  });

  const handleOpenPayment = () => {
    setSelectedCustomerForPayment(selectedCustomerKhata);
    setIsRecordCustomerPaymentOpen(true);
  };

  const handleOpenOutward = () => {
    setSelectedCustomerForBill(selectedCustomerKhata);
    setIsNewOutwardOpen(true);
  };

  const handleOpenEdit = () => {
    setEditingCustomer(selectedCustomerKhata);
    setIsEditCustomerOpen(true);
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
        paymentMethod: item.paymentMethod || 'Cash Receipt',
        refNo: item.refNo || '',
        notes: item.notes || '',
        destination: '',
        gatePassNo: ''
      });
    } else if (type === 'DISPATCH') {
      setEditForm({
        amount: item.totalSaleAmount || '',
        date: item.date || '',
        paymentMethod: '',
        refNo: item.challanNo || '',
        notes: item.notes || '',
        destination: item.destination || '',
        gatePassNo: item.gatePassNo || ''
      });
    } else {
      setEditForm({
        amount: openingBalance,
        date: '',
        paymentMethod: '',
        refNo: '',
        notes: '',
        destination: '',
        gatePassNo: ''
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

        const res = await updateCustomerPayment(editingEntry.item.id, {
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
      } else if (editingEntry.type === 'DISPATCH') {
        const res = await updateOutward(editingEntry.item.id, {
          date: editForm.date,
          destination: editForm.destination,
          gatePassNo: editForm.gatePassNo,
          notes: editForm.notes
        });

        if (!res?.success) {
          setActionError(res?.message || 'Failed to update outward dispatch');
          setIsSubmitting(false);
          return;
        }
      } else if (editingEntry.type === 'OPENING') {
        const newOpening = Math.max(0, Number(editForm.amount) || 0);
        const res = await updateCustomer(selectedCustomerKhata.id, {
          openingBalance: newOpening
        });

        if (!res?.success) {
          setActionError(res?.message || 'Failed to update opening balance');
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
        const res = await deleteCustomerPayment(deletingEntry.item.id);
        if (!res?.success) {
          setActionError(res?.message || 'Failed to delete payment');
          setIsSubmitting(false);
          return;
        }
      } else if (deletingEntry.type === 'DISPATCH') {
        const res = await deleteOutward(deletingEntry.item.id);
        if (!res?.success) {
          setActionError(res?.message || 'Failed to delete dispatch bill');
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Clean, Simple Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Khata Statement
              </h2>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-base font-semibold text-slate-700 dark:text-slate-200">
                {selectedCustomerKhata.shopName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedCustomerKhata.shopkeeperName} • {selectedCustomerKhata.city} {selectedCustomerKhata.phone ? `• ${selectedCustomerKhata.phone}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors font-medium cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Edit Khata & Shopkeeper Details"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPayment}
              className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5 text-slate-500" />
              <span>Receive Payment</span>
            </button>

            <button
              type="button"
              onClick={handleOpenOutward}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>+ New Bill</span>
            </button>

            <button
              type="button"
              onClick={() => downloadCustomerKhataPDF(selectedCustomerKhata, customerDispatches, customerPayHistory)}
              className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors font-medium cursor-pointer flex items-center gap-1.5"
              title="Download Statement PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCustomerKhata(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Simple, Clean 4-Stat Financial Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Total Billed
              </span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                Rs. {Math.round(totalBilled).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Total Paid (Wasool)
              </span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                Rs. {Math.round(totalPaid).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Opening Balance
              </span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                Rs. {Math.round(openingBalance).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Net Remaining Balance
              </span>
              <span className={`text-base font-bold font-mono mt-0.5 block ${
                currentNetBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
              }`}>
                Rs. {Math.round(currentNetBalance).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Simple Clean Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-2">
            {[
              { id: 'LEDGER', label: 'All Transactions', count: ledgerRows.length },
              { id: 'DISPATCHES', label: 'Bills Only', count: customerDispatches.length },
              { id: 'PAYMENTS', label: 'Payments Only', count: customerPayHistory.length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-slate-200 dark:bg-slate-200 dark:text-slate-800'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* TAB 1: RUNNING LEDGER TABLE */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-24">Date</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (+)</th>
                      <th className="py-2.5 px-3 text-right">Credit (-)</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-mono">
                    {ledgerRows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400 font-sans">
                          No transactions recorded yet for this customer.
                        </td>
                      </tr>
                    ) : (
                      ledgerRows.slice((ledgerPage - 1) * pageSize, ledgerPage * pageSize).map((row) => (
                        <tr 
                          key={row.id} 
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 text-[11px] font-sans">
                            {row.index}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                            {row.date}
                          </td>
                          <td className="py-2.5 px-4 font-sans">
                            <span className="font-medium text-slate-900 dark:text-white text-xs">
                              {row.desc}
                            </span>
                            {row.subDesc && (
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {row.subDesc}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                            {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                            {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                            Rs. {row.runningBalance.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => handleToggleDropdown(e, row.type, row.originalItem)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Entry Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {ledgerRows.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 font-bold text-xs">
                        <td colSpan="3" className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-sans">
                          Net Balance Due
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                          Rs. {Math.round(totalBilled + openingBalance).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                          Rs. {Math.round(totalPaid).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white text-sm">
                          Rs. {Math.round(currentNetBalance).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                <Pagination
                  currentPage={ledgerPage}
                  totalItems={ledgerRows.length}
                  pageSize={pageSize}
                  onPageChange={setLedgerPage}
                  itemLabel="transactions"
                />
              </div>
            </div>
          )}

          {/* TAB 2: DISPATCHES LIST */}
          {activeTab === 'DISPATCHES' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Challan #</th>
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                      <th className="py-2.5 px-3 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                    {customerDispatches.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-6 text-center text-slate-400">
                          No bills or dispatches recorded yet for this customer.
                        </td>
                      </tr>
                    ) : (
                      customerDispatches.slice((dispPage - 1) * pageSize, dispPage * pageSize).map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-500">{d.date}</td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white">{d.challanNo}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-900 dark:text-white">{d.articleNo}</span>
                            <span className="text-[10px] text-slate-400 block">{d.articleName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{d.quantity} pcs</td>
                          <td className="py-2.5 px-3 text-right font-mono">Rs. {d.unitSalePrice?.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                            Rs. {d.totalSaleAmount?.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => handleToggleDropdown(e, 'DISPATCH', d)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Bill Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <Pagination
                  currentPage={dispPage}
                  totalItems={customerDispatches.length}
                  pageSize={pageSize}
                  onPageChange={setDispPage}
                  itemLabel="bills"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS LIST */}
          {activeTab === 'PAYMENTS' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Receipt / Ref #</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Remarks</th>
                      <th className="py-2.5 px-3 text-right">Amount Received</th>
                      <th className="py-2.5 px-3 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                    {customerPayHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400">
                          No payments recorded yet for this customer.
                        </td>
                      </tr>
                    ) : (
                      customerPayHistory.slice((payPage - 1) * pageSize, payPage * pageSize).map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-500">{p.date}</td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white">{p.refNo || p.id}</td>
                          <td className="py-2.5 px-3">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">{p.notes || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                            Rs. {p.amount?.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => handleToggleDropdown(e, 'PAYMENT', p)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Payment Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <Pagination
                  currentPage={payPage}
                  totalItems={customerPayHistory.length}
                  pageSize={pageSize}
                  onPageChange={setPayPage}
                  itemLabel="payments"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Transactions: <strong className="text-slate-700 dark:text-slate-200">{ledgerRows.length}</strong>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCustomerKhata(null)}
            className="px-4 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Floating 3-Dots Action Dropdown Menu */}
      {activeDropdown && (
        <div
          className="customer-statement-action-menu fixed z-[999] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 min-w-[150px] animate-in fade-in zoom-in-95 duration-100"
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

          {activeDropdown.type !== 'OPENING' && (
            <button
              type="button"
              onClick={() => handleStartDelete(activeDropdown.type, activeDropdown.item)}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Entry</span>
            </button>
          )}
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingEntry.type === 'PAYMENT' 
                    ? 'Edit Wasooli / Payment Receipt' 
                    : editingEntry.type === 'DISPATCH' 
                    ? 'Edit Dispatch Bill' 
                    : 'Edit Opening Khata Balance'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCustomerKhata.shopName} ({selectedCustomerKhata.city})
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

              {editingEntry.type === 'PAYMENT' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Wasool Amount (PKR) *
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
                      Amount update will automatically recalculate shopkeeper's remaining khata.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Receipt Date *
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
                        <option value="Cash Receipt">Cash Receipt</option>
                        <option value="Online Bank Transfer">Online Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Pay Order">Pay Order</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Receipt / Ref #
                    </label>
                    <input
                      type="text"
                      value={editForm.refNo}
                      onChange={(e) => setEditForm(prev => ({ ...prev, refNo: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. REC-4821"
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
                      placeholder="e.g. Wasooli through Munshi / Ugrahi"
                    />
                  </div>
                </>
              )}

              {editingEntry.type === 'DISPATCH' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Challan No
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
                        Dispatch Date *
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Destination / Muqam
                      </label>
                      <input
                        type="text"
                        value={editForm.destination}
                        onChange={(e) => setEditForm(prev => ({ ...prev, destination: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Raja Bazaar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Gate Pass #
                      </label>
                      <input
                        type="text"
                        value={editForm.gatePassNo}
                        onChange={(e) => setEditForm(prev => ({ ...prev, gatePassNo: e.target.value }))}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. GP-456"
                      />
                    </div>
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
                      placeholder="e.g. Goods sent via cargo / bilty"
                    />
                  </div>
                </>
              )}

              {editingEntry.type === 'OPENING' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Balance (Sabqa Baqaya PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={editForm.amount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Starting old khata balance before using this computer system.
                  </span>
                </div>
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
              {deletingEntry.type === 'PAYMENT' ? 'Delete Payment Receipt?' : 'Delete Dispatch Bill?'}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {deletingEntry.type === 'PAYMENT' ? (
                <>
                  Are you sure you want to delete payment receipt <strong className="text-slate-700 dark:text-slate-200 font-mono">{deletingEntry.item.refNo || deletingEntry.item.id}</strong> for <strong className="text-emerald-600 font-mono">Rs. {Number(deletingEntry.item.amount).toLocaleString()}</strong>?
                  <br />
                  <span className="text-[11px] text-rose-500 mt-1 block">
                    This will restore Rs. {Number(deletingEntry.item.amount).toLocaleString()} to the customer's outstanding balance.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to delete Bill <strong className="text-slate-700 dark:text-slate-200 font-mono">#{deletingEntry.item.challanNo}</strong> ({deletingEntry.item.quantity} pcs of {deletingEntry.item.articleNo})?
                  <br />
                  <span className="text-[11px] text-rose-500 mt-1 block">
                    This will restore {deletingEntry.item.quantity} pcs back to warehouse stock and decrease customer balance by Rs. {Number(deletingEntry.item.totalSaleAmount).toLocaleString()}.
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
