import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Pencil,
  Search,
  Building2,
  Phone,
  MapPin,
  CreditCard,
  Ship,
  Wallet,
  MoreVertical,
  FileText,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Pagination } from '../common/Pagination';

export const SuppliersList = () => {
  const { 
    suppliers = [], 
    setSelectedSupplierDetail, 
    setIsAddSupplierOpen, 
    setIsRecordPaymentOpen,
    setSelectedSupplierForPayment,
    setEditingSupplier,
    setIsEditSupplierOpen
  } = useApp();

  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('ALL'); // 'ALL' | 'DUE' | 'CLEAR'
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [activeDropdown, setActiveDropdown] = useState(null); // { id, sup, top, left }

  // Close 3-dots action dropdown on outside click, window resize, or scroll
  useEffect(() => {
    const handleClose = (e) => {
      if (e?.target?.closest?.('.supplier-action-menu')) return;
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

  const handleToggleDropdown = (e, sup) => {
    e.stopPropagation();
    if (activeDropdown?.id === sup.id) {
      setActiveDropdown(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top = rect.bottom + 6;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      top = rect.top - dropdownHeight - 6;
    }

    const width = 200;
    const left = Math.max(10, rect.right - width);

    setActiveDropdown({
      id: sup.id,
      sup,
      top,
      left
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setBalanceFilter('ALL');
    setPage(1);
  };

  const isFiltered = search.trim() !== '' || balanceFilter !== 'ALL';

  const filteredSuppliers = suppliers.filter(s => {
    if (!s) return false;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || (
      (s.company || '').toLowerCase().includes(term) ||
      (s.name || '').toLowerCase().includes(term) ||
      (s.phone || '').toLowerCase().includes(term) ||
      (s.address || '').toLowerCase().includes(term) ||
      (s.id || '').toLowerCase().includes(term)
    );

    const bal = Number(s.remainingBalance) || 0;
    let matchesBalance = true;
    if (balanceFilter === 'DUE') matchesBalance = bal > 0;
    if (balanceFilter === 'CLEAR') matchesBalance = bal <= 0;

    return matchesSearch && matchesBalance;
  });

  const totalPurchases = suppliers.reduce((sum, s) => sum + (Number(s.totalPurchases) || 0), 0);
  const totalPaid = suppliers.reduce((sum, s) => sum + (Number(s.totalPayments) || 0), 0);
  const totalRemaining = suppliers.reduce((sum, s) => sum + (Number(s.remainingBalance) || 0), 0);

  const dueVendorsCount = suppliers.filter(s => (Number(s.remainingBalance) || 0) > 0).length;
  const clearVendorsCount = suppliers.filter(s => (Number(s.remainingBalance) || 0) <= 0).length;

  const paginatedSuppliers = filteredSuppliers.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenPayment = (sup) => {
    if (setSelectedSupplierForPayment) setSelectedSupplierForPayment(sup);
    setIsRecordPaymentOpen(true);
  };

  const handleOpenStatement = (sup) => {
    setSelectedSupplierDetail(sup);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setIsEditSupplierOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              China Suppliers & Accounts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {suppliers.length} Registered Vendors
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            China apparel factories, payment ledgers, transaction statements, and outstanding balances
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (setSelectedSupplierForPayment) setSelectedSupplierForPayment(null);
              setIsRecordPaymentOpen(true);
            }}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-medium rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Record Payment</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddSupplierOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[11px]">Total Purchases from China</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-1 font-medium">All consignments value</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight truncate">
            Rs. {Math.round(totalPurchases).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[11px]">Total Payments Paid</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-1 font-medium">Transferred via TT / LC</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
            Rs. {Math.round(totalPaid).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[11px]">Total Outstanding Payables</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-1 font-medium">Accounts payable to China</div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight truncate">
            Rs. {Math.round(totalRemaining).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Supplier Name, Company, Address, Phone..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-hidden transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Balance Filters */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => {
                setBalanceFilter('ALL');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                balanceFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({suppliers.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setBalanceFilter('DUE');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                balanceFilter === 'DUE'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Due ({dueVendorsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBalanceFilter('CLEAR');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                balanceFilter === 'CLEAR'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Clear ({clearVendorsCount})</span>
            </button>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-1">
            Showing {filteredSuppliers.length} of {suppliers.length} vendors
          </div>

        </div>

      </div>

      {/* High-End Enterprise Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Code / ID</th>
                <th className="py-3 px-4">Company & Contact Person</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Total Paid (TT)</th>
                <th className="py-3 px-4 text-right">Outstanding Baqaya</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400">No suppliers found</span>
                      <span className="text-[11px] text-slate-400">Try adjusting your search or filters</span>
                      {isFiltered && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((sup) => {
                  const remBal = Number(sup.remainingBalance || 0);
                  const isDue = remBal > 0;

                  return (
                    <tr
                      key={sup.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Code / ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-200/80 dark:border-blue-800/60">
                          {sup.id}
                        </span>
                      </td>

                      {/* 2. Company & Contact Person */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => handleOpenStatement(sup)}
                          className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          {sup.company}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>Contact:</span>
                          <strong className="text-slate-700 dark:text-slate-300 font-medium">{sup.name}</strong>
                        </div>
                      </td>

                      {/* 3. Contact Info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{sup.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 max-w-[220px] truncate" title={sup.address}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{sup.address || 'China'}</span>
                        </div>
                      </td>

                      {/* 4. Total Purchases */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        Rs. {Math.round(Number(sup.totalPurchases || 0)).toLocaleString()}
                      </td>

                      {/* 5. Total Paid (TT) */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        Rs. {Math.round(Number(sup.totalPayments || 0)).toLocaleString()}
                      </td>

                      {/* 6. Outstanding Baqaya */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isDue ? 'text-rose-600 dark:text-rose-400 text-sm' : 'text-slate-700 dark:text-slate-300'}>
                          Rs. {Math.round(remBal).toLocaleString()}
                        </span>
                      </td>

                      {/* 7. Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isDue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Settled
                          </span>
                        )}
                      </td>

                      {/* 8. Actions (Quick Pay & 3-Dots Menu) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Quick Pay Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(sup)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200/80 dark:border-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Record Payment / TT Transfer"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay</span>
                          </button>

                          {/* Quick Statement Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenStatement(sup)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Full Ledger Statement"
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>Khata</span>
                          </button>

                          {/* 3-Dots Dropdown Trigger */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleDropdown(e, sup)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              activeDropdown?.id === sup.id
                                ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 text-slate-900 dark:text-white'
                                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
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
      </div>

      {/* Floating 3-Dots Action Dropdown Menu */}
      {activeDropdown && (
        <div
          className="supplier-action-menu fixed z-[999] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 min-w-[190px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${activeDropdown.top}px`, left: `${activeDropdown.left}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vendor Actions</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
              {activeDropdown.sup.company}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const s = activeDropdown.sup;
              setActiveDropdown(null);
              handleOpenPayment(s);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment / TT</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const s = activeDropdown.sup;
              setActiveDropdown(null);
              handleOpenStatement(s);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>View Full Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const s = activeDropdown.sup;
              setActiveDropdown(null);
              handleOpenEdit(s);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-500" />
            <span>Edit Vendor Details</span>
          </button>
        </div>
      )}

      {/* 10-Item Pagination */}
      <Pagination
        currentPage={page}
        totalItems={filteredSuppliers.length}
        pageSize={pageSize}
        onPageChange={setPage}
        itemLabel="vendors"
      />

    </div>
  );
};
