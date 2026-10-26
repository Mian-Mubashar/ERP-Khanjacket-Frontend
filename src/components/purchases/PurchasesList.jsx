import React, { useState } from 'react';
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
  CreditCard
} from 'lucide-react';
import { downloadInvoicePDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';

export const PurchasesList = () => {
  const { purchases, setIsNewPurchaseOpen, setSelectedArticleDetail, articles } = useApp();

  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredPurchases = purchases.filter(p => 
    p.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    p.containerNo?.toLowerCase().includes(search.toLowerCase()) ||
    p.items?.some(it => it.articleNo.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPurchasesAmount = purchases.reduce((s, p) => s + (p.totalBill || 0), 0);
  const totalPaidAmount = purchases.reduce((s, p) => s + (p.paidAmount || 0), 0);
  const totalRemainingAmount = purchases.reduce((s, p) => s + (p.remainingAmount || 0), 0);

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
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total China Purchases</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">All recorded import bills</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            Rs. {totalPurchasesAmount.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total Paid Amount</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Paid</span>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Paid via Wire / LC</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            Rs. {totalPaidAmount.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total Remaining Balance</span>
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full">Due</span>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Payables to China factories</div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            Rs. {totalRemainingAmount.toLocaleString()}
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
                  const totalPcs = pur.items?.reduce((s, i) => s + i.quantity, 0) || 0;
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
                        Rs. {pur.totalBill?.toLocaleString()}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        Rs. {pur.paidAmount?.toLocaleString()}
                      </td>

                      {/* Remaining */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        Rs. {pur.remainingAmount?.toLocaleString()}
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
                          onClick={() => setSelectedInvoice(pur)}
                          className="w-8 h-8 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 hover:bg-blue-100/80 inline-flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          title="View Bill Voucher"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
                      + Rs. {selectedInvoice.extraExpenses?.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-blue-200 dark:border-blue-900">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-blue-700 dark:text-blue-400">
                    Rs. {selectedInvoice.totalBill?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400">
                  <span>Paid Amount:</span>
                  <span className="font-mono font-bold">
                    - Rs. {selectedInvoice.paidAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-blue-200 dark:border-blue-900 text-sm">
                  <span>Remaining Supplier Balance:</span>
                  <span className="font-mono">
                    Rs. {selectedInvoice.remainingAmount?.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close Bill
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
