import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  Plus,
  Building2,
  Phone,
  MapPin,
  ArrowDownLeft,
  CreditCard,
  Calendar,
  FileText,
  Pencil
} from 'lucide-react';
import { downloadSupplierStatementPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';

export const SupplierStatementModal = () => {
  const {
    selectedSupplierDetail,
    setSelectedSupplierDetail,
    setEditingSupplier,
    setIsEditSupplierOpen,
    purchases,
    payments,
    setIsRecordPaymentOpen
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
      ref: `Invoice #${p.invoiceNo}`,
      description: `Container Import (${p.items?.map(i => `${i.articleNo} x${i.quantity}`).join(', ')})`,
      debit: Number(p.totalBill || 0),
      credit: 0
    })),
    ...supPayments.map(pay => ({
      type: 'PAYMENT',
      date: pay.date,
      ref: `Payment (${pay.paymentMethod})`,
      description: `Ref: ${pay.refNo} - ${pay.notes || 'Settlement'}`,
      debit: 0,
      credit: Number(pay.amount || 0)
    }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Compute running balance starting from opening balance
  let running = Number(sup.openingBalance || 0);
  const ledgerEntries = rawTransactions.map(tx => {
    running = running + (Number(tx.debit) || 0) - (Number(tx.credit) || 0);
    return {
      ...tx,
      balanceAfter: running
    };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                {sup.id}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Supplier Account & Statement
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{sup.company}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Contact: <strong className="text-slate-700 dark:text-slate-200">{sup.name}</strong>
              </span>
              {sup.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {sup.phone}
                </span>
              )}
              {sup.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {sup.address}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingSupplier(sup);
                setIsEditSupplierOpen(true);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 font-medium cursor-pointer"
              title="Edit Vendor / Factory Details"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Edit Vendor</span>
            </button>
            <button
              type="button"
              onClick={() => downloadSupplierStatementPDF(sup, supPurchases, supPayments)}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs font-medium cursor-pointer"
              title="Download Professional PDF Statement"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSupplierDetail(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Core Highlight KPI Cards (Total Purchases, Total Payments, Remaining Balance) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          
          {/* Total Purchases */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Purchases</span>
              <ArrowDownLeft className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            </div>
            <div className="text-xs text-slate-400 mb-1 font-medium">Total Consignment Value</div>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white truncate" title={`Rs. ${Number(sup.totalPurchases || 0).toLocaleString()}`}>
              Rs. {Math.round(Number(sup.totalPurchases || 0)).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Total Invoices: {supPurchases.length}
            </div>
          </div>

          {/* Total Payments */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Paid</span>
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <div className="text-xs text-slate-400 mb-1 font-medium">Total Paid to Vendor</div>
            <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 truncate" title={`Rs. ${Number(sup.totalPayments || 0).toLocaleString()}`}>
              Rs. {Math.round(Number(sup.totalPayments || 0)).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Transactions: {supPayments.length}
            </div>
          </div>

          {/* Remaining Balance */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-rose-300 dark:border-rose-900 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between text-rose-800 dark:text-rose-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Remaining Balance</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 shrink-0">Due</span>
            </div>
            <div className="text-xs text-rose-600 dark:text-rose-500 mb-1 font-medium">Net Outstanding Payable</div>
            <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 truncate" title={`Rs. ${Number(sup.remainingBalance || 0).toLocaleString()}`}>
              Rs. {Math.round(Number(sup.remainingBalance || 0)).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Accounts Payable Balance
            </div>
          </div>

        </div>

        {/* Sub-tabs and Record Payment button */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex space-x-2">
            {[
              { id: 'statement', label: 'Ledger Statement', count: ledgerEntries.length },
              { id: 'purchases', label: 'Purchases History', count: supPurchases.length },
              { id: 'payments', label: 'Payments History', count: supPayments.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
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
            onClick={() => setIsRecordPaymentOpen(true)}
            className="mb-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-80 overflow-y-auto">
          
          {/* 1. Complete Chronological Ledger Statement */}
          {activeTab === 'statement' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Transaction / Ref</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Debit / Bill (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Credit / Paid (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Running Balance (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="bg-slate-50 dark:bg-slate-800/40 font-semibold text-slate-600 dark:text-slate-400">
                    <td className="py-2 px-3 font-mono">—</td>
                    <td className="py-2 px-3">Opening Balance</td>
                    <td className="py-2 px-3 text-slate-400">Initial balance brought forward</td>
                    <td className="py-2 px-3 text-right font-mono">—</td>
                    <td className="py-2 px-3 text-right font-mono">—</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {(sup.openingBalance || 0).toLocaleString()}
                    </td>
                  </tr>

                  {ledgerEntries.slice((statementPage - 1) * pageSize, statementPage * pageSize).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{row.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{row.ref}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">{row.description}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        Rs. {row.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                currentPage={statementPage}
                totalItems={ledgerEntries.length}
                pageSize={pageSize}
                onPageChange={setStatementPage}
                itemLabel="transactions"
              />
            </div>
          )}

          {/* 2. Purchases History */}
          {activeTab === 'purchases' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Invoice No</th>
                    <th className="py-2.5 px-3">Articles & Quantities</th>
                    <th className="py-2.5 px-3 text-right">Total Bill</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {supPurchases.slice((purchasesPage - 1) * pageSize, purchasesPage * pageSize).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.purchaseDate}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.invoiceNo}</td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                        {p.items?.map(i => `${i.articleNo} (${i.quantity} pcs)`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(Number(p.totalBill || 0)).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        Rs. {Math.round(Number(p.paidAmount || 0)).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        Rs. {Math.round(Number(p.remainingAmount || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                currentPage={purchasesPage}
                totalItems={supPurchases.length}
                pageSize={pageSize}
                onPageChange={setPurchasesPage}
                itemLabel="invoices"
              />
            </div>
          )}

          {/* 3. Payments History */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Reference #</th>
                    <th className="py-2.5 px-3 text-right">Paid Amount</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {supPayments.slice((paymentsPage - 1) * pageSize, paymentsPage * pageSize).map((pay, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{pay.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{pay.paymentMethod}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{pay.refNo}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {Math.round(Number(pay.amount || 0)).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{pay.recordedBy}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{pay.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                currentPage={paymentsPage}
                totalItems={supPayments.length}
                pageSize={pageSize}
                onPageChange={setPaymentsPage}
                itemLabel="payments"
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Total Outstanding Balance: <strong className="font-mono text-rose-600 dark:text-rose-400 text-sm">Rs. {Math.round(Number(sup.remainingBalance || 0)).toLocaleString()}</strong>
          </div>
          <button
            onClick={() => setSelectedSupplierDetail(null)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold rounded-xl transition-colors"
          >
            Close Statement
          </button>
        </div>

      </div>
    </div>
  );
};
