import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Plus,
  Pencil,
  Wallet,
  FileText,
  MapPin,
  Phone,
  Trash2,
  Truck,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  MoreVertical
} from 'lucide-react';
import { confirmDelete, showToast, showError } from '../../utils/sweetalert';
import { Pagination } from '../common/Pagination';

export const CustomersView = () => {
  const { 
    customers, 
    cities, 
    deleteCustomer, 
    setIsAddCustomerOpen,
    setEditingCustomer,
    setIsEditCustomerOpen,
    setIsRecordCustomerPaymentOpen,
    setSelectedCustomerForPayment,
    setSelectedCustomerKhata,
    setIsNewOutwardOpen,
    setSelectedCustomerForBill,
    customerFilterKey
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [balanceFilter, setBalanceFilter] = useState('ALL'); // 'ALL' | 'DUE' | 'CLEAR'
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [activeDropdown, setActiveDropdown] = useState(null); // { id, cust, top, left }

  // Close 3-dots action dropdown on outside click, window resize, or scroll
  useEffect(() => {
    const handleClose = (e) => {
      if (e?.target?.closest?.('.customer-action-menu')) return;
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

  const handleToggleDropdown = (e, cust) => {
    e.stopPropagation();
    if (activeDropdown?.id === cust.id) {
      setActiveDropdown(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;

    // If space below is at least 250px or greater than space above, open downwards
    let top = rect.bottom + 6;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      top = rect.top - dropdownHeight - 6;
    }

    const width = 210;
    const left = Math.max(10, rect.right - width);

    setActiveDropdown({
      id: cust.id,
      cust,
      top,
      left
    });
  };

  // When a new shopkeeper is registered, clear search & filters to show the new record on top
  useEffect(() => {
    if (customerFilterKey > 0) {
      setSearchTerm('');
      setSelectedCity('ALL');
      setBalanceFilter('ALL');
      setPage(1);
    }
  }, [customerFilterKey]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCity('ALL');
    setBalanceFilter('ALL');
    setPage(1);
  };

  const isFiltered = searchTerm.trim() !== '' || selectedCity !== 'ALL' || balanceFilter !== 'ALL';

  // Defensive, production-grade filtering with safe optional chaining
  const filteredCustomers = customers.filter(cust => {
    if (!cust) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = !term || (
      (cust.shopName || '').toLowerCase().includes(term) ||
      (cust.shopkeeperName || '').toLowerCase().includes(term) ||
      (cust.phone || '').toLowerCase().includes(term) ||
      (cust.city || '').toLowerCase().includes(term) ||
      (cust.marketAddress || '').toLowerCase().includes(term) ||
      (cust.id || '').toLowerCase().includes(term)
    );

    const matchesCity = selectedCity === 'ALL' || (cust.city || '').toLowerCase() === selectedCity.toLowerCase();
    
    let matchesBalance = true;
    const bal = Number(cust.remainingBalance) || 0;
    if (balanceFilter === 'DUE') matchesBalance = bal > 0;
    if (balanceFilter === 'CLEAR') matchesBalance = bal <= 0;

    return matchesSearch && matchesCity && matchesBalance;
  }).sort((a, b) => (a.shopName || '').localeCompare(b.shopName || '', undefined, { sensitivity: 'base' }));

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

        <div className="flex flex-wrap items-center gap-2">
          {/* New Customer Bill / Outward Dispatch Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedCustomerForBill(null);
              setIsNewOutwardOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Create a new customer bill / dispatch goods"
          >
            <Truck className="w-4 h-4" />
            <span>+ Naya Bill</span>
          </button>

          <button
            type="button"
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
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shopkeeper</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: 2 cards per row layout for ultra-clear visibility of large amounts without truncation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Total Mal Dispatched (Pcs) */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-blue-400 transition-colors shadow-2xs">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-l-xl" />
          <div className="flex items-center gap-3.5 pl-1 w-full">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-5.5 h-5.5 stroke-[1.8]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  TOTAL MAL SENT
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                  {customers.length} Shops
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {totalPiecesDispatched.toLocaleString()} <span className="text-sm font-normal text-slate-400">Pcs</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Total wholesale garments dispatched
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Bill Amount (PKR) */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-indigo-400 transition-colors shadow-2xs">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-l-xl" />
          <div className="flex items-center gap-3.5 pl-1 w-full">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5.5 h-5.5 stroke-[1.8]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  TOTAL BILLED
                </span>
                {totalBilledAmount >= 1000000 && (
                  <span className="text-[11px] font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                    {(totalBilledAmount / 1000000).toFixed(2)} Million
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 tracking-tight break-normal">
                Rs. {Math.round(totalBilledAmount).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Total bill value across all shopkeeper challans
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Payments Received (PKR) */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-emerald-400 transition-colors shadow-2xs">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-xl" />
          <div className="flex items-center gap-3.5 pl-1 w-full">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5.5 h-5.5 stroke-[1.8]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  PAYMENT RECEIVED (WASOOLI)
                </span>
                {totalPaymentsReceived >= 1000000 && (
                  <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                    {(totalPaymentsReceived / 1000000).toFixed(2)} Million
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight break-normal">
                Rs. {Math.round(totalPaymentsReceived).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Total cash & bank payments received
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Remaining Khata Due (PKR) */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/15 dark:bg-rose-950/10 relative overflow-hidden flex items-center justify-between group hover:border-rose-400 transition-colors shadow-2xs">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-xl" />
          <div className="flex items-center gap-3.5 pl-1 w-full">
            <div className="w-12 h-12 rounded-full border-2 border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5.5 h-5.5 stroke-[1.8]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
                  OUTSTANDING KHATA (BAQAYA)
                </span>
                {totalKhataOutstanding >= 1000000 ? (
                  <span className="text-[11px] font-bold font-mono text-rose-600 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 shrink-0">
                    {(totalKhataOutstanding / 1000000).toFixed(2)} Million
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 shrink-0">
                    Baqaya Due
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 tracking-tight break-normal">
                Rs. {Math.round(totalKhataOutstanding).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {customers.filter(c => (Number(c.remainingBalance) || 0) > 0).length} Dukaandars with pending balances
              </span>
            </div>
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
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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

        {/* Reset Filters Button */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 font-medium"
            title="Reset filters and show all accounts"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                <th className="py-4 px-5">Shop / Shopkeeper</th>
                <th className="py-4 px-5">City / Branch</th>
                <th className="py-4 px-5 text-right">Mal Sent (Pcs)</th>
                <th className="py-4 px-5 text-right">Total Bill</th>
                <th className="py-4 px-5 text-right">Payment Recv.</th>
                <th className="py-4 px-5 text-right">Remaining Khata</th>
                <th className="py-4 px-5 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {customers.length === 0
                          ? 'No shopkeepers registered yet.'
                          : 'No shopkeepers found matching the active search / filter criteria.'}
                      </p>
                      {isFiltered && customers.length > 0 && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear Filters & Show All Customers ({customers.length})</span>
                        </button>
                      )}
                    </div>
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
                      <td className="py-4 px-5 text-right font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {(cust.totalPiecesReceived || 0).toLocaleString()} pcs
                      </td>

                      {/* Total Bill */}
                      <td className="py-4 px-5 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        Rs. {Math.round(Number(cust.totalBill) || 0).toLocaleString()}
                      </td>

                      {/* Payment Received */}
                      <td className="py-4 px-5 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        Rs. {Math.round(Number(cust.totalPaid) || 0).toLocaleString()}
                      </td>

                      {/* Remaining Khata Due */}
                      <td className="py-4 px-5 text-right font-mono whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold whitespace-nowrap">
                            Rs. {Math.round(Number(cust.remainingBalance) || 0).toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                            Settled (Rs. 0)
                          </span>
                        )}
                      </td>

                      {/* Actions: Clean Centered 3-Dots Button */}
                      <td className="py-4 px-5 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleDropdown(e, cust)}
                          className={`w-8 h-8 rounded-lg border transition-all inline-flex items-center justify-center shadow-2xs cursor-pointer ${
                            activeDropdown?.id === cust.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white'
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
          totalItems={filteredCustomers.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="customers"
        />
      </div>

      {/* Floating 3-Dots Action Dropdown Menu (Fixed Viewport-Aware, Never Clipped) */}
      {activeDropdown && (
        <div
          style={{
            position: 'fixed',
            top: `${activeDropdown.top}px`,
            left: `${activeDropdown.left}px`,
            width: '210px',
            zIndex: 99999
          }}
          className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200/90 dark:border-slate-750 shadow-2xl py-1.5 text-left customer-action-menu animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {activeDropdown.cust.shopName}
          </div>

          {/* 1. Create New Bill / Maal Rawangi (Prominent Blue) */}
          <button
            type="button"
            onClick={() => {
              const c = activeDropdown.cust;
              setActiveDropdown(null);
              setSelectedCustomerForBill(c);
              setIsNewOutwardOpen(true);
            }}
            className="w-full px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between font-semibold transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Naya Bill (Maal)</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              + Bill
            </span>
          </button>

          {/* 2. View Khata Statement */}
          <button
            type="button"
            onClick={() => {
              const c = activeDropdown.cust;
              setActiveDropdown(null);
              handleOpenKhata(c);
            }}
            className="w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Khata Statement</span>
          </button>

          {/* 3. Receive Payment */}
          <button
            type="button"
            onClick={() => {
              const c = activeDropdown.cust;
              setActiveDropdown(null);
              handleOpenPayment(c);
            }}
            className="w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Receive Payment</span>
          </button>

          {/* 4. Edit Details */}
          <button
            type="button"
            onClick={() => {
              const c = activeDropdown.cust;
              setActiveDropdown(null);
              handleOpenEdit(c);
            }}
            className="w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Edit Shopkeeper</span>
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

          {/* 5. Delete Customer */}
          <button
            type="button"
            onClick={async () => {
              const c = activeDropdown.cust;
              setActiveDropdown(null);
              const isConfirmed = await confirmDelete({
                title: `Delete "${c.shopName}"?`,
                text: `Are you sure you want to delete customer ${c.shopName} (${c.shopkeeperName}, ${c.city})? Their remaining balance is Rs. ${(c.remainingBalance || 0).toLocaleString()}.`,
                confirmButtonText: 'Yes, Delete Customer'
              });
              if (isConfirmed) {
                const res = await deleteCustomer(c.id);
                if (res?.success) {
                  showToast(`Customer "${c.shopName}" removed!`, 'success');
                } else {
                  showError('Cannot Delete Customer', res?.message || 'Failed to delete customer');
                }
              }
            }}
            className="w-full px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Shopkeeper</span>
          </button>
        </div>
      )}

    </div>
  );
};
