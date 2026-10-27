import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Download, Truck, Wallet, MapPin, Phone, Building, Pencil } from 'lucide-react';
import { downloadCustomerKhataPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';

export const CustomerStatementModal = () => {
  const { 
    selectedCustomerKhata, 
    setSelectedCustomerKhata, 
    setEditingCustomer,
    setIsEditCustomerOpen,
    outward, 
    customerPayments 
  } = useApp();

  const [dispPage, setDispPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const pageSize = 10;

  if (!selectedCustomerKhata) return null;

  const customerDispatches = outward.filter(o => 
    (o.customerId && o.customerId === selectedCustomerKhata.id) ||
    (o.customerName && o.customerName.toLowerCase() === selectedCustomerKhata.shopName.toLowerCase())
  );

  const customerPayHistory = customerPayments.filter(p => 
    p.customerId === selectedCustomerKhata.id ||
    (p.customerName && p.customerName.toLowerCase().includes(selectedCustomerKhata.shopName.toLowerCase()))
  );

  const totalDispatchedPcs = customerDispatches.reduce((s, d) => s + (Number(d.quantity) || 0), 0);
  const totalBilled = customerDispatches.reduce((s, d) => s + (Number(d.totalSaleAmount) || 0), 0);
  const totalPaid = customerPayHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <Building className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Customer Khata Statement / Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detailed goods outward records and payments summary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingCustomer(selectedCustomerKhata);
                setIsEditCustomerOpen(true);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 font-medium cursor-pointer"
              title="Edit Shopkeeper / Customer Info"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Edit Info</span>
            </button>
            <button
              type="button"
              onClick={() => downloadCustomerKhataPDF(selectedCustomerKhata, customerDispatches, customerPayHistory)}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs font-medium cursor-pointer"
              title="Download Professional PDF Statement"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCustomerKhata(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Shop Header Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {selectedCustomerKhata.shopName}
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                <span>Owner: <strong>{selectedCustomerKhata.shopkeeperName}</strong></span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  {selectedCustomerKhata.city}
                </span>
                {selectedCustomerKhata.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {selectedCustomerKhata.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Net Balance Pill */}
            <div className="text-left sm:text-right overflow-hidden">
              <span className="text-xs text-slate-400 block">Remaining Khata Balance</span>
              <span className="text-xl font-semibold font-mono text-rose-600 dark:text-rose-400 truncate block" title={`Rs. ${Number(selectedCustomerKhata.remainingBalance || 0).toLocaleString()}`}>
                Rs. {Math.round(Number(selectedCustomerKhata.remainingBalance || 0)).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center overflow-hidden">
              <span className="text-[11px] text-slate-400 block">Total Pieces Sent</span>
              <span className="text-base font-semibold font-mono text-blue-600 dark:text-blue-400 truncate block">
                {Math.round(Number(selectedCustomerKhata.totalPiecesReceived) || totalDispatchedPcs).toLocaleString()} pcs
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center overflow-hidden">
              <span className="text-[11px] text-slate-400 block">Total Billed</span>
              <span className="text-base font-semibold font-mono text-purple-600 dark:text-purple-400 truncate block" title={`Rs. ${(Number(selectedCustomerKhata.totalBill) || totalBilled).toLocaleString()}`}>
                Rs. {Math.round(Number(selectedCustomerKhata.totalBill) || totalBilled).toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center overflow-hidden">
              <span className="text-[11px] text-slate-400 block">Payments Received</span>
              <span className="text-base font-semibold font-mono text-emerald-600 dark:text-emerald-400 truncate block" title={`Rs. ${(Number(selectedCustomerKhata.totalPaid) || totalPaid).toLocaleString()}`}>
                Rs. {Math.round(Number(selectedCustomerKhata.totalPaid) || totalPaid).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 1. Dispatches Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Mal Dispatches History ({customerDispatches.length})
              </h4>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Challan #</th>
                    <th className="py-2.5 px-3">Article</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {customerDispatches.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-slate-400">
                        No inward dispatches recorded yet for this customer.
                      </td>
                    </tr>
                  ) : (
                    customerDispatches.slice((dispPage - 1) * pageSize, dispPage * pageSize).map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-400">{d.date}</td>
                        <td className="py-2.5 px-3 font-mono">{d.challanNo}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-900 dark:text-white">{d.articleNo}</span>
                          <span className="text-[10px] text-slate-400 block">{d.articleName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">{d.quantity} pcs</td>
                        <td className="py-2.5 px-3 text-right font-mono">Rs. {d.unitSalePrice?.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">Rs. {d.totalSaleAmount?.toLocaleString()}</td>
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
                itemLabel="dispatches"
              />
            </div>
          </div>

          {/* 2. Payments History Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Payments Received History ({customerPayHistory.length})
              </h4>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Receipt / Ref #</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {customerPayHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-slate-400">
                        No payments logged yet for this customer.
                      </td>
                    </tr>
                  ) : (
                    customerPayHistory.slice((payPage - 1) * pageSize, payPage * pageSize).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-400">{p.date}</td>
                        <td className="py-2.5 px-3 font-mono">{p.refNo || p.id}</td>
                        <td className="py-2.5 px-3">{p.paymentMethod}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{p.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          Rs. {p.amount?.toLocaleString()}
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

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={() => setSelectedCustomerKhata(null)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium hover:bg-slate-300 transition-colors"
          >
            Close Statement
          </button>
        </div>

      </div>
    </div>
  );
};
