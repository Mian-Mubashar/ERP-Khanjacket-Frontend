import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, Download, Truck, Wallet, Pencil 
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
    outward = [], 
    customerPayments = [] 
  } = useApp();

  const [activeTab, setActiveTab] = useState('LEDGER'); // 'LEDGER' | 'DISPATCHES' | 'PAYMENTS'
  const [ledgerPage, setLedgerPage] = useState(1);
  const [dispPage, setDispPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const pageSize = 12;

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

  // Build unified running ledger matching traditional physical Khata (Image 1)
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
          
          {/* Simple, Clean 4-Stat Financial Strip (Zero rainbow cards, calm & executive) */}
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

          {/* TAB 1: RUNNING LEDGER TABLE (Clean Bank Statement Style) */}
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-mono">
                    {ledgerRows.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 font-sans">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                    {customerDispatches.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                    {customerPayHistory.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-400">
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
    </div>
  );
};
