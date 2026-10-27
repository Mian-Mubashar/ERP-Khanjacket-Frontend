import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Calendar,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Ship,
  Truck,
  Shirt,
  Wallet,
  Receipt,
  MapPin,
  Warehouse,
  Tag
} from 'lucide-react';
import { downloadBusinessReportsPDF } from '../../utils/pdfGenerator';
import { showToast, showError } from '../../utils/sweetalert';
import { Pagination } from '../common/Pagination';
import { formatLakhCrore, formatPKR } from '../../utils/formatters';

export const ReportsView = () => {
  const { articles = [], suppliers = [], purchases = [], outward = [], payments = [], categories = [], warehouseLocations = [] } = useApp();

  const [dateRangeType, setDateRangeType] = useState('ALL'); // 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM' | 'ALL'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 10-Item Pagination States
  const [categoryPage, setCategoryPage] = useState(1);
  const [locationPage, setLocationPage] = useState(1);
  const pageSize = 10;

  const todayStr = new Date().toISOString().split('T')[0];

  // Date filtering logic
  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    if (dateRangeType === 'ALL') return true;
    if (dateRangeType === 'TODAY') return dateStr === todayStr;

    if (dateRangeType === 'WEEK') {
      const now = new Date();
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      const d = new Date(dateStr);
      return d >= past7 && d <= now;
    }

    if (dateRangeType === 'MONTH') {
      const now = new Date();
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      const d = new Date(dateStr);
      return d >= past30 && d <= now;
    }

    if (dateRangeType === 'CUSTOM') {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    }

    return true;
  };

  // Filtered transactions
  const filteredPurchases = purchases.filter(p => isDateInRange(p.purchaseDate));
  const filteredOutward = outward.filter(o => isDateInRange(o.date));
  const filteredPayments = payments.filter(pay => isDateInRange(pay.date));

  // Clean Numeric Calculations (Guaranteed Number type to prevent string concatenation)
  const periodInwardQty = filteredPurchases.reduce((s, p) => 
    s + (p.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0), 0
  );
  const periodOutwardQty = filteredOutward.reduce((s, o) => s + Number(o.quantity || 0), 0);
  const periodPurchaseAmount = filteredPurchases.reduce((s, p) => s + Number(p.totalBill || 0), 0);
  const periodPaidAmount = filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

  // Overall stats
  const totalStockWarehouse = articles.reduce((s, a) => s + Number(a.currentStock || 0), 0);
  const totalStockValue = articles.reduce((s, a) => s + (Number(a.currentStock || 0) * Number(a.unitCost || 0)), 0);
  const totalSuppliersOutstanding = suppliers.reduce((s, sup) => s + Number(sup.remainingBalance || 0), 0);

  // Dynamic Categories Stats
  const allCategories = useMemo(() => {
    const set = new Set([...categories, ...articles.map(a => a.category).filter(Boolean)]);
    return Array.from(set).sort();
  }, [categories, articles]);

  const categoryStats = useMemo(() => {
    return allCategories.map(cat => {
      const catArticles = articles.filter(a => a.category === cat);
      const catStock = catArticles.reduce((s, a) => s + Number(a.currentStock || 0), 0);
      const catPurchased = catArticles.reduce((s, a) => s + Number(a.totalPurchased || 0), 0);
      const catOut = catArticles.reduce((s, a) => s + Number(a.totalOut || 0), 0);
      const catVal = catArticles.reduce((s, a) => s + (Number(a.currentStock || 0) * Number(a.unitCost || 0)), 0);
      const stockShare = totalStockWarehouse > 0 ? ((catStock / totalStockWarehouse) * 100).toFixed(1) : '0.0';
      return {
        category: cat,
        articleCount: catArticles.length,
        purchased: catPurchased,
        out: catOut,
        stock: catStock,
        valuation: catVal,
        share: Number(stockShare)
      };
    });
  }, [allCategories, articles, totalStockWarehouse]);

  // Dynamic Warehouse Locations Stats
  const allLocations = useMemo(() => {
    const set = new Set([...warehouseLocations, ...articles.map(a => a.warehouseLocation).filter(Boolean)]);
    return Array.from(set).sort();
  }, [warehouseLocations, articles]);

  const locationStats = useMemo(() => {
    return allLocations.map(loc => {
      const locArticles = articles.filter(a => (a.warehouseLocation || '') === loc);
      const locStock = locArticles.reduce((s, a) => s + Number(a.currentStock || 0), 0);
      const locPurchased = locArticles.reduce((s, a) => s + Number(a.totalPurchased || 0), 0);
      const locOut = locArticles.reduce((s, a) => s + Number(a.totalOut || 0), 0);
      const locVal = locArticles.reduce((s, a) => s + (Number(a.currentStock || 0) * Number(a.unitCost || 0)), 0);
      const stockShare = totalStockWarehouse > 0 ? ((locStock / totalStockWarehouse) * 100).toFixed(1) : '0.0';
      return {
        location: loc,
        articleCount: locArticles.length,
        purchased: locPurchased,
        out: locOut,
        stock: locStock,
        valuation: locVal,
        share: Number(stockShare)
      };
    });
  }, [allLocations, articles, totalStockWarehouse]);

  // Download PDF Report
  const handleDownloadPDF = () => {
    try {
      showToast('Preparing official report PDF...', 'info');
      downloadBusinessReportsPDF({
        dateRangeType,
        startDate,
        endDate,
        articles,
        suppliers,
        totalStockWarehouse,
        totalStockValue,
        periodInwardQty,
        periodOutwardQty,
        periodPurchaseAmount,
        periodPaidAmount,
        totalSuppliersOutstanding,
        filteredPurchases,
        filteredOutward
      });
      showToast('Report PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to generate report PDF:', err);
      showError('Download Error', 'Could not generate PDF: ' + (err.message || 'Unknown error'));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Category,Metric,Value\n'];
    const rows = [
      `Stock,Current Total Pieces in Warehouse,${totalStockWarehouse}`,
      `Stock,Total Valuation in PKR,${totalStockValue}`,
      `Period,Inward Pieces,${periodInwardQty}`,
      `Period,Outward Pieces,${periodOutwardQty}`,
      `Financial,Total Purchases Bill,${periodPurchaseAmount}`,
      `Financial,Total Payments Paid,${periodPaidAmount}`,
      `Financial,Total Outstanding to Suppliers,${totalSuppliersOutstanding}`
    ];
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Khan_Clothes_Report_${dateRangeType}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Business Reports & Ledger Statements</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Audit & Financial Reports
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daily, weekly, monthly and custom date range stock movements and financial summaries
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPDF}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'TODAY', label: 'Today' },
            { id: 'WEEK', label: 'This Week' },
            { id: 'MONTH', label: 'This Month' },
            { id: 'CUSTOM', label: 'Custom Date Range' }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setDateRangeType(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                dateRangeType === pill.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {dateRangeType === 'CUSTOM' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
            <span className="text-slate-500 dark:text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>
        )}

      </div>

      {/* 8 Required Report Metric Cards with Squircle Icon Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Inward Pieces */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Inward Pieces</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Period Arrivals from China</div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 tracking-tight truncate">
            +{periodInwardQty.toLocaleString()} pcs
          </div>
        </div>

        {/* 2. Outward Pieces */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Outward Pieces</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Period Dispatches</div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight truncate">
            -{periodOutwardQty.toLocaleString()} pcs
          </div>
        </div>

        {/* 3. Current Total Stock */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-emerald-500/40 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Current Total Stock</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-500 mb-2 font-medium">Available in Warehouse</div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
            {totalStockWarehouse.toLocaleString()} pcs
          </div>
        </div>

        {/* 4. Total Outstanding Payables */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-rose-300 dark:border-rose-900 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total Outstanding Payables</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-500 mb-2 font-medium">Payables to China Vendors</div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight break-words">
            Rs. {Math.round(totalSuppliersOutstanding).toLocaleString()}
          </div>
          {totalSuppliersOutstanding > 0 && (
            <div className="text-[11px] font-semibold text-rose-500/90 mt-1 truncate">
              {formatLakhCrore(totalSuppliersOutstanding)}
            </div>
          )}
        </div>

        {/* 5. Period Purchases Bill */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Period Purchases Bill</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Total Consignment Purchases</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight break-words">
            Rs. {Math.round(periodPurchaseAmount).toLocaleString()}
          </div>
          {periodPurchaseAmount > 0 && (
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              {formatLakhCrore(periodPurchaseAmount)}
            </div>
          )}
        </div>

        {/* 6. Period Payments */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Period Payments Paid</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Total Paid to Vendors</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight break-words">
            Rs. {Math.round(periodPaidAmount).toLocaleString()}
          </div>
          {periodPaidAmount > 0 && (
            <div className="text-[11px] font-semibold text-emerald-600/90 dark:text-emerald-400/90 mt-1 truncate">
              {formatLakhCrore(periodPaidAmount)}
            </div>
          )}
        </div>

        {/* 7. Invoices Count */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">China Invoices</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Recorded Shipments</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight truncate">
            {filteredPurchases.length} Shipments
          </div>
        </div>

        {/* 8. Dispatches Count */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Dispatches Count</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Challans & Gate Passes</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight truncate">
            {filteredOutward.length} Challans
          </div>
        </div>

      </div>

      {/* 1. Category-wise Warehouse Stock Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Category-wise Warehouse Stock Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Garments inventory and stock valuation grouped by dynamic categories
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            {allCategories.length} Categories
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4 text-center">Articles</th>
                <th className="py-3.5 px-4 text-right">Total Inward</th>
                <th className="py-3.5 px-4 text-right">Total Outward</th>
                <th className="py-3.5 px-4 text-right">Available Stock</th>
                <th className="py-3.5 px-4 text-right">Valuation (PKR)</th>
                <th className="py-3.5 px-4 text-center">Stock Share</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {categoryStats.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No categories found. Articles or categories add karen.
                  </td>
                </tr>
              ) : (
                categoryStats.slice((categoryPage - 1) * pageSize, categoryPage * pageSize).map((row, idx) => {
                  const globalIndex = (categoryPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.category} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs">{globalIndex}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-blue-500" />
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {row.articleCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {row.purchased.toLocaleString()} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                        {row.out.toLocaleString()} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {row.stock.toLocaleString()} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {row.valuation.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(100, row.share)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-500 w-9 text-right">{row.share}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.stock === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Empty
                          </span>
                        ) : row.stock < 100 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {categoryStats.length > 0 && (
              <tfoot className="bg-slate-50/80 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white">
                <tr>
                  <td className="py-3.5 px-4 text-center">Total</td>
                  <td className="py-3.5 px-4">{allCategories.length} Categories</td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {categoryStats.reduce((s, r) => s + r.articleCount, 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                    {categoryStats.reduce((s, r) => s + r.purchased, 0).toLocaleString()} pcs
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                    {categoryStats.reduce((s, r) => s + r.out, 0).toLocaleString()} pcs
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                    {totalStockWarehouse.toLocaleString()} pcs
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    Rs. {totalStockValue.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">100%</td>
                  <td className="py-3.5 px-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 10-Item Pagination for Category Breakdown */}
        <Pagination
          currentPage={categoryPage}
          totalItems={categoryStats.length}
          pageSize={pageSize}
          onPageChange={setCategoryPage}
          itemLabel="categories"
        />
      </div>

      {/* 2. Warehouse Locations & Godown Racks Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Warehouse Locations & Godown Racks (Maal Kahan Para Hai)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Physical rack, shelf, and godown inventory distribution & valuation
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            {allLocations.length} Active Storage Locations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Storage Location / Rack</th>
                <th className="py-3.5 px-4 text-center">Assigned Articles</th>
                <th className="py-3.5 px-4 text-right">Inward (Purchased)</th>
                <th className="py-3.5 px-4 text-right">Outward (Dispatched)</th>
                <th className="py-3.5 px-4 text-right">Current Stock (Pcs)</th>
                <th className="py-3.5 px-4 text-right">Valuation (PKR)</th>
                <th className="py-3.5 px-4 text-center">Occupancy Share</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {locationStats.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No warehouse locations registered yet. Add locations from Articles &gt; Manage Locations.
                  </td>
                </tr>
              ) : (
                locationStats.slice((locationPage - 1) * pageSize, locationPage * pageSize).map((row, idx) => {
                  const globalIndex = (locationPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.location} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs">{globalIndex}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{row.location}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                          {row.articleCount} Codes
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {row.purchased.toLocaleString()} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                        {row.out.toLocaleString()} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {row.stock.toLocaleString()} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {row.valuation.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, row.share)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-500 w-9 text-right">{row.share}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.stock === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Empty Rack
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Stock Stored
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {locationStats.length > 0 && (
              <tfoot className="bg-slate-50/80 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white">
                <tr>
                  <td className="py-3.5 px-4 text-center">Total</td>
                  <td className="py-3.5 px-4">{allLocations.length} Racks / Godowns</td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {locationStats.reduce((s, r) => s + r.articleCount, 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                    {locationStats.reduce((s, r) => s + r.purchased, 0).toLocaleString()} pcs
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                    {locationStats.reduce((s, r) => s + r.out, 0).toLocaleString()} pcs
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                    {totalStockWarehouse.toLocaleString()} pcs
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    Rs. {totalStockValue.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">100%</td>
                  <td className="py-3.5 px-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 10-Item Pagination for Warehouse Locations */}
        <Pagination
          currentPage={locationPage}
          totalItems={locationStats.length}
          pageSize={pageSize}
          onPageChange={setLocationPage}
          itemLabel="locations"
        />
      </div>

    </div>
  );
};
