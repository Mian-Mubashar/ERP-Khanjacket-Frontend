import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Wallet,
  FileText,
  MapPin,
  Phone,
  Trash2,
  DollarSign,
  Truck,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { confirmDelete, showToast } from '../../utils/sweetalert';
import { Pagination } from '../common/Pagination';

export const CustomersView = () => {
  const { 
    customers, 
    cities, 
    outward,
    deleteCustomer, 
    setIsAddCustomerOpen,
    setEditingCustomer,
    setIsEditCustomerOpen,
    setIsRecordCustomerPaymentOpen,
    setSelectedCustomerForPayment,
    setSelectedCustomerKhata 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [balanceFilter, setBalanceFilter] = useState('ALL'); // 'ALL' | 'DUE' | 'CLEAR'
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filtering
  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = 
      cust.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.shopkeeperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm) ||
      cust.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = selectedCity === 'ALL' || cust.city.toLowerCase() === selectedCity.toLowerCase();
    
    let matchesBalance = true;
    if (balanceFilter === 'DUE') matchesBalance = (cust.remainingBalance || 0) > 0;
    if (balanceFilter === 'CLEAR') matchesBalance = (cust.remainingBalance || 0) <= 0;

    return matchesSearch && matchesCity && matchesBalance;
  });

  // Calculations
  const totalPiecesDispatched = customers.reduce((sum, c) => sum + (Number(c.totalPiecesReceived) || 0), 0);
  const totalBilledAmount = customers.reduce((sum, c) => sum + (Number(c.totalBill) || 0), 0);
  const totalPaymentsReceived = customers.reduce((sum, c) => sum + (Number(c.totalPaid) || 0), 0);
  const totalKhataOutstanding = customers.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);

  const handleOpenPayment = (cust) => {
    setSelectedCustomerForPayment(cust);
    setIsRecordCustomerPaymentOpen(true);
  };

  const handleOpenKhata = (cust) => {
    setSelectedCustomerKhata(cust);
  };

  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setIsEditCustomerOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
            CUSTOMERS & SHOPKEEPERS
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Wholesale buyers, shops directory, pieces dispatched, payments received & outstanding balances
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedCustomerForPayment(null);
              setIsRecordCustomerPaymentOpen(true);
            }}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-medium rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Receive Payment</span>
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shopkeeper</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Highlighting Key Financials & Goods Tracking requested by user */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Mal Dispatched (Pcs) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Mal Sent</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-2xl font-semibold font-mono text-slate-900 dark:text-white truncate">
              {totalPiecesDispatched.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 shrink-0">Pcs</span>
          </div>
        </div>

        {/* Total Bill Amount (PKR) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Billed</span>
            <ArrowUpRight className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-2xl font-semibold font-mono text-slate-900 dark:text-white truncate">
              Rs. {Math.round(totalBilledAmount).toLocaleString()}
            </span>
            {totalBilledAmount >= 1000000 && (
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                {(totalBilledAmount / 1000000).toFixed(2)}M
              </span>
            )}
          </div>
        </div>

        {/* Payments Received (PKR) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Payment Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-2xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 truncate">
              Rs. {Math.round(totalPaymentsReceived).toLocaleString()}
            </span>
            {totalPaymentsReceived >= 1000000 && (
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                {(totalPaymentsReceived / 1000000).toFixed(2)}M
              </span>
            )}
          </div>
        </div>

        {/* Remaining Khata Due (PKR) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-medium">Outstanding Khata</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-2xl font-semibold font-mono text-rose-600 dark:text-rose-400 truncate">
              Rs. {Math.round(totalKhataOutstanding).toLocaleString()}
            </span>
            {totalKhataOutstanding >= 1000000 && (
              <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 shrink-0">
                {(totalKhataOutstanding / 1000000).toFixed(2)}M
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by shop name, shopkeeper, phone or city..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 shrink-0">City:</span>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="ALL">All Cities ({cities.length})</option>
            {cities.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Balance Due Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Balance:</span>
          <select
            value={balanceFilter}
            onChange={(e) => {
              setBalanceFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="ALL">All Accounts</option>
            <option value="DUE">Outstanding Due (&gt; 0)</option>
            <option value="CLEAR">Nil / Settled</option>
          </select>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                <th className="py-4 px-5">Shop / Shopkeeper</th>
                <th className="py-4 px-5">City / Branch</th>
                <th className="py-4 px-5 text-right">Mal Sent (Pcs)</th>
                <th className="py-4 px-5 text-right">Total Bill</th>
                <th className="py-4 px-5 text-right">Payment Recv.</th>
                <th className="py-4 px-5 text-right">Remaining Khata</th>
                <th className="py-4 px-5 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No customers found matching the search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.slice((page - 1) * pageSize, page * pageSize).map(cust => {
                  const isPending = (cust.remainingBalance || 0) > 0;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Shop Name & Shopkeeper */}
                      <td className="py-4 px-5">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {cust.shopName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{cust.shopkeeperName}</span>
                          {cust.phone && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Phone className="w-2.5 h-2.5" />
                              {cust.phone}
                            </span>
                          )}
                        </div>
                        {cust.marketAddress && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                            {cust.marketAddress}
                          </div>
                        )}
                      </td>

                      {/* City / Branch */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          {cust.city}
                        </span>
                      </td>

                      {/* Mal Sent (Pcs) */}
                      <td className="py-4 px-5 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                        {(cust.totalPiecesReceived || 0).toLocaleString()} pcs
                      </td>

                      {/* Total Bill */}
                      <td className="py-4 px-5 text-right font-mono text-slate-600 dark:text-slate-300">
                        Rs. {(cust.totalBill || 0).toLocaleString()}
                      </td>

                      {/* Payment Received */}
                      <td className="py-4 px-5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        Rs. {(cust.totalPaid || 0).toLocaleString()}
                      </td>

                      {/* Remaining Khata Due */}
                      <td className="py-4 px-5 text-right font-mono">
                        {isPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold">
                            Rs. {cust.remainingBalance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            Settled (Rs. 0)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Shopkeeper Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cust)}
                            className="w-8 h-8 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 hover:bg-blue-100/80 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Edit Shopkeeper Details (Naam, Phone, Pata badlein)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Receive Payment Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(cust)}
                            className="w-8 h-8 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100/80 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Receive Payment"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                          </button>

                          {/* Khata Ledger Statement */}
                          <button
                            type="button"
                            onClick={() => handleOpenKhata(cust)}
                            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:bg-slate-100 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="View Khata / Ledger Statement"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete with SweetAlert */}
                          <button
                            type="button"
                            onClick={async () => {
                              const isConfirmed = await confirmDelete({
                                title: `Delete "${cust.shopName}"?`,
                                text: `Are you sure you want to delete customer ${cust.shopName} (${cust.shopkeeperName}, ${cust.city})? Their remaining balance is Rs. ${(cust.remainingBalance || 0).toLocaleString()}.`,
                                confirmButtonText: 'Yes, Delete Customer'
                              });
                              if (isConfirmed) {
                                deleteCustomer(cust.id);
                                showToast(`Customer "${cust.shopName}" removed!`, 'success');
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 hover:bg-rose-100/80 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
          totalItems={filteredCustomers.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="customers"
        />
      </div>

    </div>
  );
};
