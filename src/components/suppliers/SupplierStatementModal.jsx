import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  CreditCard,
  Pencil,
  FileText
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
    setSelectedSupplierForPayment
  } = useApp();

  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'purchases' | 'payments'
  const [statementPage, setStatementPage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const pageSize = 10;

  if (!selectedSupplierDetail) return null;

  const sup = selectedSupplierDetail;

  // Filter purchases for this supplier
  const supPurchases = purchases.filter(p => p.supplierId === sup.id);

  // Filter payments for this supplier
  const supPayments = payments.filter(p => p.supplierId === sup.id);

  // Generate unified chronological statement with running balance
  const rawTransactions = [
    ...supPurchases.map(p => ({
      type: 'PURCHASE',
      date: p.purchaseDate,
      rawDate: new Date(p.purchaseDate || 0).getTime(),
      ref: `Invoice #${p.invoiceNo}`,
      description: `Container Import (${p.items?.map(i => `${i.articleNo} x${i.quantity}`).join(', ') || 'Consignment'})`,
      debit: Number(p.totalBill || 0),
      credit: 0
    })),
    ...supPayments.map(pay => ({
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

  const handleOpenEdit = () => {
    setEditingSupplier(sup);
    setIsEditSupplierOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Simple & Clean */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Supplier Khata Statement
              </h2>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-base font-semibold text-slate-700 dark:text-slate-200">
                {sup.company}
              </span>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/70 dark:border-blue-900/60">
                {sup.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Contact: {sup.name} {sup.phone ? `• ${sup.phone}` : ''} {sup.address ? `• ${sup.address}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              title="Edit Vendor Details"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => downloadSupplierStatementPDF(sup, supPurchases, supPayments)}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 font-medium shadow-2xs cursor-pointer"
              title="Download Statement PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSupplierDetail(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Statement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Core Highlight KPI Cards (Total Purchases, Total Payments, Remaining Balance) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          
          {/* Total Purchases */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Purchases
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              Rs. {Math.round(Number(sup.totalPurchases || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {supPurchases.length} Consignment Invoices
            </div>
          </div>

          {/* Total Payments */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Paid (TT / Bank)
            </span>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              Rs. {Math.round(Number(sup.totalPayments || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {supPayments.length} Wire Transfers Recorded
            </div>
          </div>

          {/* Remaining Balance */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Outstanding Baqaya Due
            </span>
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              Rs. {Math.round(Number(sup.remainingBalance || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
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

          <button
            type="button"
            onClick={handleOpenPayment}
            className="mb-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Tab Content Body - Flexible Scrollable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* 1. Complete Chronological Ledger Statement */}
          {activeTab === 'statement' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref #</th>
                      <th className="py-2.5 px-3">Particulars / Description</th>
                      <th className="py-2.5 px-3 text-right">Debit / Bill</th>
                      <th className="py-2.5 px-3 text-right">Credit / Paid</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 font-medium text-slate-600 dark:text-slate-400">
                      <td className="py-2 px-3 font-mono text-[11px]">Opening</td>
                      <td className="py-2 px-3 font-mono">—</td>
                      <td className="py-2 px-3 text-slate-500">Initial balance brought forward</td>
                      <td className="py-2 px-3 text-right font-mono">—</td>
                      <td className="py-2 px-3 text-right font-mono">—</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(sup.openingBalance || 0)).toLocaleString()}
                      </td>
                    </tr>

                    {ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No transactions recorded yet for this vendor.
                        </td>
                      </tr>
                    ) : (
                      ledgerEntries.slice((statementPage - 1) * pageSize, statementPage * pageSize).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {row.ref}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={row.description}>
                            {row.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {row.debit > 0 ? `Rs. ${Math.round(row.debit).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {row.credit > 0 ? `Rs. ${Math.round(row.credit).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            Rs. {Math.round(row.balanceAfter).toLocaleString()}
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
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">Articles & Quantities</th>
                      <th className="py-2.5 px-3 text-right">Total Bill</th>
                      <th className="py-2.5 px-3 text-right">Paid Advance</th>
                      <th className="py-2.5 px-3 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {supPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No purchases recorded yet for this supplier.
                        </td>
                      </tr>
                    ) : (
                      supPurchases.slice((purchasesPage - 1) * pageSize, purchasesPage * pageSize).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {p.purchaseDate}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {p.invoiceNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                            {p.items?.map(i => `${i.articleNo} (${i.quantity} pcs)`).join(', ') || 'Consignment'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            Rs. {Math.round(Number(p.totalBill || 0)).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            Rs. {Math.round(Number(p.paidAmount || 0)).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            Rs. {Math.round(Number(p.remainingAmount || 0)).toLocaleString()}
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
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Reference #</th>
                      <th className="py-2.5 px-3 text-right">Paid Amount</th>
                      <th className="py-2.5 px-3">Recorded By</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {supPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No payments recorded yet for this supplier.
                        </td>
                      </tr>
                    ) : (
                      supPayments.slice((paymentsPage - 1) * pageSize, paymentsPage * pageSize).map((pay, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {pay.date}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {pay.paymentMethod}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {pay.refNo}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            Rs. {Math.round(Number(pay.amount || 0)).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {pay.recordedBy || 'Admin'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={pay.notes}>
                            {pay.notes || '—'}
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
    </div>
  );
};
