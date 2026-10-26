import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shirt,
  Ship,
  Truck,
  Building2,
  Wallet,
  ScanBarcode,
  Scale,
  FileSpreadsheet,
  AlertTriangle,
  Boxes,
  Eye,
  Download,
  Calendar,
  Clock,
  CalendarDays,
  CalendarRange,
  Layers,
  RotateCcw,
  ChevronRight,
  Warehouse,
  BadgeDollarSign,
  Receipt,
  Sparkles,
  Tag,
  SlidersHorizontal,
  CheckCircle2,
  Plus,
  ChevronDown
} from 'lucide-react';
import { downloadWarehouseReportPDF, downloadOutwardLogPDF } from '../../utils/pdfGenerator';
import { formatLakhCrore, formatPKR } from '../../utils/formatters';
import { DashboardAnalyticsCharts } from './DashboardAnalyticsCharts';
import { Pagination } from '../common/Pagination';

export const DashboardOverview = ({ setActiveTab }) => {
  const {
    articles = [],
    suppliers = [],
    purchases = [],
    outward = [],
    payments = [],
    customerPayments = [],
    customers = [],
    cities = [],
    stuffs = [],
    setIsNewPurchaseOpen,
    setIsNewOutwardOpen,
    setIsAddArticleOpen,
    setIsAddSupplierOpen,
    setIsRecordPaymentOpen,
    setIsRecordCustomerPaymentOpen,
    setSelectedArticleDetail,
    setSelectedInvoiceDetail,
    setIsQuickSearchOpen
  } = useApp();

  const [showWorkflowGuide, setShowWorkflowGuide] = useState(true);

  // Timeframe and Interactive Filters for Payments Summary / Stock Report section
  const [timeframe, setTimeframe] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('All branches');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedArticleCode, setSelectedArticleCode] = useState('All Articles');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [articlesPage, setArticlesPage] = useState(1);
  const articlesPageSize = 10;

  // Helper to format clean numeric values matching Image 2
  const formatNumber = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return Math.round(Number(val)).toLocaleString('en-US');
  };

  // Helper to format currency values cleanly
  const formatMoney = (val) => {
    if (!val || val === 0) return 'Rs. 0';
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1000000) {
      return `${sign}Rs. ${(absVal / 1000000).toFixed(2)}M`;
    }
    return `${sign}Rs. ${absVal.toLocaleString()}`;
  };

  // Determine current active date matching dataset or local time
  const getTodayStr = () => {
    const d = new Date();
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hasLocal = outward?.some(o => o.date === local) || purchases?.some(p => p.purchaseDate === local);
    if (hasLocal) return local;
    const utc = d.toISOString().split('T')[0];
    const hasUtc = outward?.some(o => o.date === utc) || purchases?.some(p => p.purchaseDate === utc);
    if (hasUtc) return utc;
    const allDates = [
      ...(outward || []).map(o => o.date),
      ...(purchases || []).map(p => p.purchaseDate)
    ].filter(Boolean).sort();
    return allDates[allDates.length - 1] || local;
  };

  const getDaysAgoStr = (baseStr, daysAgo) => {
    const d = new Date(baseStr);
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleTimeframeChange = (mode) => {
    setTimeframe(mode);
    const today = getTodayStr();
    if (mode === 'DAY') {
      setDateFrom(today);
      setDateTo(today);
    } else if (mode === 'WEEK') {
      setDateFrom(getDaysAgoStr(today, 7));
      setDateTo(today);
    } else if (mode === 'MONTH') {
      setDateFrom(getDaysAgoStr(today, 30));
      setDateTo(today);
    } else if (mode === 'MANUAL') {
      if (!dateFrom && !dateTo) {
        setDateFrom(getDaysAgoStr(today, 7));
        setDateTo(today);
      }
    } else if (mode === 'ALL') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const isDateInRange = (dateStr) => {
    if (!dateStr) return true;
    if (dateFrom && dateStr < dateFrom) return false;
    if (dateTo && dateStr > dateTo) return false;
    return true;
  };

  const matchBranch = (cityOrDest) => {
    if (!selectedBranch || selectedBranch === 'All branches' || selectedBranch === 'All Warehouses') return true;
    if (!cityOrDest) return false;
    const lower = cityOrDest.toLowerCase();
    const branchKey = selectedBranch.toLowerCase().split(' ')[0];
    return lower.includes(branchKey);
  };

  // Lifetime global summaries
  const totalStock = articles.reduce((sum, a) => sum + (a.currentStock || 0), 0);
  const totalPurchasedQty = articles.reduce((sum, a) => sum + (a.totalPurchased || 0), 0);
  const totalOutwardQty = articles.reduce((sum, a) => sum + (a.totalOut || 0), 0);
  const totalPurchaseBill = purchases.reduce((sum, p) => sum + (p.totalBill || 0), 0);
  const totalStockValue = articles.reduce((sum, a) => sum + ((a.currentStock || 0) * (a.unitCost || 0)), 0);
  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.remainingBalance || 0), 0);
  const totalPaid = suppliers.reduce((sum, s) => sum + (s.totalPayments || 0), 0);
  const lowStockCount = articles.filter(a => a.currentStock <= (a.minAlertStock || 200)).length;

  // Filtered transactions for dynamic Stock Report calculations
  const filteredPurchases = purchases.filter(p => {
    if (!isDateInRange(p.purchaseDate)) return false;
    if (selectedBranch !== 'All branches' && selectedBranch !== 'All Warehouses' && !selectedBranch.toLowerCase().includes('karachi')) {
      return false; // China container arrivals come to Karachi Central Warehouse
    }
    if (selectedCategory !== 'All Categories') {
      const hasCat = p.items?.some(i => i.category === selectedCategory);
      if (!hasCat) return false;
    }
    if (selectedBrand !== 'All Brands') {
      const hasBrand = p.items?.some(i => i.stuff === selectedBrand || i.brand === selectedBrand);
      if (!hasBrand) return false;
    }
    if (selectedArticleCode !== 'All Articles') {
      const hasArt = p.items?.some(i => i.articleNo === selectedArticleCode);
      if (!hasArt) return false;
    }
    return true;
  });

  const filteredOutward = outward.filter(o => {
    if (!isDateInRange(o.date)) return false;
    if (selectedBranch !== 'All branches' && selectedBranch !== 'All Warehouses' && !matchBranch(o.city || o.destination)) return false;
    if (selectedCategory !== 'All Categories' && o.category !== selectedCategory) return false;
    if (selectedBrand !== 'All Brands' && o.stuff !== selectedBrand && o.brand !== selectedBrand) return false;
    if (selectedArticleCode !== 'All Articles' && o.articleNo !== selectedArticleCode) return false;
    return true;
  });

  const filteredPayments = (payments || []).filter(pay => {
    return isDateInRange(pay.date);
  });

  const filteredCustomerPayments = (customerPayments || []).filter(cp => {
    if (!isDateInRange(cp.date)) return false;
    if (selectedBranch !== 'All Warehouses' && !matchBranch(cp.city)) return false;
    return true;
  });

  // Calculate dynamic metrics for period
  let periodInwardQty = 0;
  let periodPurchaseBill = 0;
  let periodExtraExpenses = 0;

  filteredPurchases.forEach(p => {
    periodExtraExpenses += (p.extraExpenses || 0);
    p.items?.forEach(item => {
      let match = true;
      if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) match = false;
      if (selectedArticleCode !== 'All Articles' && item.articleNo !== selectedArticleCode) match = false;
      if (match) {
        periodInwardQty += (Number(item.quantity) || 0);
        periodPurchaseBill += (Number(item.total) || 0);
      }
    });
  });

  if (selectedCategory === 'All Categories' && selectedArticleCode === 'All Articles') {
    periodPurchaseBill = filteredPurchases.reduce((sum, p) => sum + (p.totalBill || 0), 0);
  }

  const periodAvgPurchaseRate = periodInwardQty > 0 ? Math.round(periodPurchaseBill / periodInwardQty) : 0;
  const periodOutwardQty = filteredOutward.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const periodWholesaleSale = filteredOutward.reduce((sum, o) => sum + (Number(o.totalSaleAmount) || 0), 0);
  const periodChallansCount = filteredOutward.length;
  const periodWholesaleCities = new Set(filteredOutward.map(o => o.city).filter(Boolean)).size;
  const periodGatePassCount = filteredOutward.filter(o => o.gatePassNo).length;

  const periodSupplierPaid = filteredPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0) +
    filteredPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
  const periodPayables = Math.max(0, periodPurchaseBill - periodSupplierPaid);
  const periodSettlementRate = periodPurchaseBill > 0 ? Math.min(100, Math.round((periodSupplierPaid / periodPurchaseBill) * 100)) : (periodPurchaseBill === 0 ? 100 : 0);
  const periodInvoicesCount = filteredPurchases.length;
  const periodVendorsCovered = new Set(filteredPurchases.map(p => p.supplierId || p.supplierName)).size;

  const periodCustomerCashReceived = filteredCustomerPayments.reduce((sum, cp) => sum + (cp.amount || 0), 0);
  const periodCustomerPending = Math.max(0, periodWholesaleSale - periodCustomerCashReceived);
  const periodClosingNet = periodCustomerCashReceived - periodExtraExpenses;

  // Articles filtered by category, brand/stuff, and code
  const filteredArticles = articles.filter(a => {
    if (selectedCategory !== 'All Categories' && a.category !== selectedCategory) return false;
    if (selectedBrand !== 'All Brands' && a.stuff !== selectedBrand && a.brand !== selectedBrand) return false;
    if (selectedArticleCode !== 'All Articles' && a.articleNo !== selectedArticleCode) return false;
    return true;
  });

  const filteredArticlesStock = filteredArticles.reduce((sum, a) => sum + (Number(a.currentStock) || 0), 0);
  const filteredStockValue = filteredArticles.reduce((sum, a) => sum + ((Number(a.currentStock) || 0) * (Number(a.unitCost) || 0)), 0);
  const customerTotalAmount = (filteredStockValue > 0 ? filteredStockValue : totalStockValue) + periodCustomerPending;
  const comparisonAmount = customerTotalAmount - periodPayables;
  const netPeriodStockChange = periodInwardQty - periodOutwardQty;

  return (
    <div className="space-y-6">
      
      {/* 0. Executive Operational Workflow Guide (Godam Karobar Rahnumai) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs transition-colors">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Godam Karobar Rahnumai (Daily Warehouse Workflow)
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  Asaan 4-Step Guide
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Har kaam direct 1-click se karein — non-tech users ke liye asaan aur seedha tareeqa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWorkflowGuide(prev => !prev)}
            className="self-start sm:self-auto px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <span>{showWorkflowGuide ? 'Chhupayein (Minimize)' : 'Kholein (Show Steps)'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showWorkflowGuide ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showWorkflowGuide && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            
            {/* Step 1: Article Register */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    MARHALA 1: MAAL CODE
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{articles.length} Active</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  1. Naya Design Code
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Jacket, Hoodie ya Trouser ka design code (maslan BF411) register karein.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddArticleOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800/80 text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>Naya Article Darj Karein</span>
              </button>
            </div>

            {/* Step 2: China Inward Bill */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    MARHALA 2: MAAL AAMAD
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{purchases.length} Bills</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  2. China Container Bill
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Container ya factory se godam pohnchne wala maal aur bill darj karein.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPurchaseOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800/80 text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Ship className="w-3.5 h-3.5 text-emerald-500" />
                <span>Container Bill Banayein</span>
              </button>
            </div>

            {/* Step 3: Outward Dispatch */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    MARHALA 3: MAAL RAWANGI
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{outward.length} Challans</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  3. Shehron ko Dispatch
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Lahore, Karachi, Pindi ki dukanon ko gate pass challan ke sath maal bhejein.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOutwardOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800/80 text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-rose-500" />
                <span>Maal Rawana Karein</span>
              </button>
            </div>

            {/* Step 4: Khata Wasooli */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    MARHALA 4: KHATA & WASOOLI
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{customers.length} Dukaandaar</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  4. Dukaan Wasooli
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Dukaandaar se aane wali raqam wasool karein ya factory ko payment dein.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordCustomerPaymentOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-850 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800/80 text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-500" />
                <span>Wasooli Darj Karein</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Quick Links Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs transition-colors">
        
        {/* Section Header with Duo-Tone Alert Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Quick Action Shortcuts</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Fauri Entry Center
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Seedha aur asaan shortcuts — rozmara ke hisaab kitaab ke liye button dabayein
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Payment Alert Badge */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-100 dark:ring-rose-950 shrink-0" />
              <span>Payment Alerts:</span>
              <strong className="font-mono text-slate-900 dark:text-white font-bold">
                {suppliers.filter(s => s.remainingBalance > 0).length}
              </strong>
            </span>

            {/* Pending Shipments Badge */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-100 dark:ring-blue-950 shrink-0" />
              <span>China Freight:</span>
              <strong className="font-mono text-slate-900 dark:text-white font-bold">
                {purchases.length}
              </strong>
            </span>

            {/* Low Stock Badge */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-100 dark:ring-amber-950 shrink-0" />
              <span>Kam Stock:</span>
              <strong className="font-mono text-slate-900 dark:text-white font-bold">
                {lowStockCount}
              </strong>
            </span>
          </div>
        </div>

        {/* 8 Action Pills with Squircle Icon Badges, Subtitles, and Executive Eye Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          
          {/* 1. New Bill (China Import Container) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all shadow-2xs hover:shadow-xs group">
            <button
              onClick={() => setIsNewPurchaseOpen(true)}
              className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Ship className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block leading-tight">
                  New Inward Bill
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                  China Container Aamad
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                if (purchases[0]) setSelectedInvoiceDetail(purchases[0]);
                else setIsNewPurchaseOpen(true);
              }}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-all shadow-2xs shrink-0 ml-1.5 cursor-pointer"
              title="View Last Purchase Bill"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Stock Outward (Wholesale Dispatches) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all shadow-2xs hover:shadow-xs group">
            <button
              onClick={() => setIsNewOutwardOpen(true)}
              className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Truck className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block leading-tight">
                  Stock Outward
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                  Gate Pass (Maal Rawangi)
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('outward')}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-all shadow-2xs shrink-0 ml-1.5 cursor-pointer"
              title="View Outward Dispatches"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Add Article (Jackets, Jerseys, T-Shirts) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all shadow-2xs hover:shadow-xs group">
            <button
              onClick={() => setIsAddArticleOpen(true)}
              className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Shirt className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block leading-tight">
                  Add Article
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                  Garment Code (Naya Mal)
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                if (articles[0]) setSelectedArticleDetail(articles[0]);
                else setIsAddArticleOpen(true);
              }}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-all shadow-2xs shrink-0 ml-1.5 cursor-pointer"
              title="View Latest Article Record"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4. Add Vendor (China Apparel Factories) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all shadow-2xs hover:shadow-xs group">
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block leading-tight">
                  Add Vendor
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                  China Factory (Supplier)
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-all shadow-2xs shrink-0 ml-1.5 cursor-pointer"
              title="View Vendor Accounts"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5. Pay Vendor (TT / Cash Remittance) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all shadow-2xs hover:shadow-xs group">
            <button
              onClick={() => setIsRecordPaymentOpen(true)}
              className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block leading-tight">
                  Pay Vendor
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                  Factory Adaigi (TT / Cash)
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-all shadow-2xs shrink-0 ml-1.5 cursor-pointer"
              title="View Vendor Statements"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6. Dukaan Wasooli (Customer Receipt) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all shadow-2xs hover:shadow-xs group">
            <button
              onClick={() => setIsRecordCustomerPaymentOpen(true)}
              className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Receipt className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block leading-tight">
                  Dukaan Wasooli
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                  Customer Khata Receipt
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-all shadow-2xs shrink-0 ml-1.5 cursor-pointer"
              title="View Shopkeeper Ledgers"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 7. Quick Search Article */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all shadow-2xs hover:shadow-xs group">
            <button
              onClick={() => setIsQuickSearchOpen(true)}
              className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ScanBarcode className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block leading-tight">
                  Maal Search
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                  Fauri Design Lookup
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                if (articles[0]) setSelectedArticleDetail(articles[0]);
                else setIsQuickSearchOpen(true);
              }}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-all shadow-2xs shrink-0 ml-1.5 cursor-pointer"
              title="Open Article Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 8. Export Ledger */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs hover:shadow-xs group">
            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white block leading-tight">
                  Hisaab Kitaab
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                  Download Reports PDF
                </span>
              </div>
            </button>
            <button
              onClick={() => downloadWarehouseReportPDF(articles, totalStock * 2000)}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all shadow-2xs shrink-0 ml-1.5 cursor-pointer"
              title="Download Ledger PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* 2. Payments Summary (Clean Executive Layout matching Reference Image 2) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs transition-colors space-y-6">
        
        {/* Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Payments Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Account balances and period activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadWarehouseReportPDF(filteredArticles.length > 0 ? filteredArticles : articles, periodPurchaseBill)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Download Stock & Financial Summary PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Bar Row matching Image 2 */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. All branches */}
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-200 outline-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-2xs pr-8"
              >
                <option value="All branches">All branches</option>
                {cities.map(c => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Select Category */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-200 outline-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-2xs pr-8"
              >
                <option value="All Categories">Select Category</option>
                <option value="Jacket">Jacket</option>
                <option value="Jersey">Jersey</option>
                <option value="T-Shirt">T-Shirt</option>
                <option value="Trouser">Trouser</option>
                <option value="Hoodie">Hoodie</option>
                <option value="Tracksuit">Tracksuit</option>
              </select>
            </div>

            {/* 3. Select Brand */}
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-200 outline-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-2xs pr-8"
              >
                <option value="All Brands">Select Brand</option>
                {stuffs.map(s => (
                  <option key={s.id || s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Select Item */}
            <div className="relative">
              <select
                value={selectedArticleCode}
                onChange={e => setSelectedArticleCode(e.target.value)}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-200 outline-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-2xs pr-8"
              >
                <option value="All Articles">Select Item</option>
                {articles.map(a => (
                  <option key={a.articleNo} value={a.articleNo}>
                    {a.articleNo} — {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Date Range Input: mm/dd/yyyy to mm/dd/yyyy */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 outline-hidden text-xs cursor-pointer"
                title="Start Date"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 outline-hidden text-xs cursor-pointer"
                title="End Date"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="text-slate-400 hover:text-rose-500 font-bold ml-1 cursor-pointer"
                  title="Clear dates"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Button: Manage cash */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsRecordCustomerPaymentOpen(true)}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            >
              Manage cash
            </button>

            {(selectedBranch !== 'All branches' || selectedCategory !== 'All Categories' || selectedBrand !== 'All Brands' || selectedArticleCode !== 'All Articles' || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBranch('All branches');
                  setSelectedCategory('All Categories');
                  setSelectedBrand('All Brands');
                  setSelectedArticleCode('All Articles');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* TOP ROW: 5 Columns (Clean, Minimalist Executive Layout matching Image 2) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            
            {/* 1. CURRENT BALANCE */}
            <div className="sm:pr-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                CURRENT BALANCE
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatNumber(periodClosingNet)}
              </div>
              <div className="space-y-1 pt-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Total</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(periodCustomerCashReceived)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Used</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(periodExtraExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transfer Out</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transfer In</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
              </div>
            </div>

            {/* 2. CASH IN HAND */}
            <div className="sm:px-4 space-y-1 pt-4 sm:pt-0">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                CASH IN HAND
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatNumber(periodCustomerCashReceived)}
              </div>
              <div className="space-y-1 pt-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Total</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(periodCustomerCashReceived)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Used</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(periodExtraExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Refunded</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transfer Out</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transfer In</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
              </div>
            </div>

            {/* 3. IN BANK */}
            <div className="sm:px-4 space-y-1 pt-4 sm:pt-0">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                IN BANK
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatNumber(periodSupplierPaid)}
              </div>
              <div className="space-y-1 pt-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Total</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(periodSupplierPaid)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Used</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(periodSupplierPaid)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Refunded</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transfer Out</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transfer In</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
              </div>
            </div>

            {/* 4. EXPENSES */}
            <div className="sm:px-4 space-y-1 pt-4 sm:pt-0">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                EXPENSES
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatNumber(periodExtraExpenses)}
              </div>
              <div className="space-y-1 pt-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Cash used</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(periodExtraExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bank used</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transfer Out</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transfer In</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">0</span>
                </div>
              </div>
            </div>

            {/* 5. ITEMS STOCK */}
            <div className="sm:pl-4 space-y-1 pt-4 sm:pt-0">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                ITEMS STOCK
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatNumber(filteredStockValue > 0 ? filteredStockValue : totalStockValue)}
              </div>
              <div className="space-y-1 pt-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Total value</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(filteredStockValue > 0 ? filteredStockValue : totalStockValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sold amount</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(periodWholesaleSale)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Available qty</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(filteredArticlesStock > 0 ? filteredArticlesStock : totalStock)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sold qty</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                    {formatNumber(periodOutwardQty)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM ROW: 3 Comparison Cards matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: CUSTOMER AMOUNT */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-baseline justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                CUSTOMER AMOUNT
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {formatNumber(customerTotalAmount)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3.5">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  STOCK
                </span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
                  {formatNumber(filteredStockValue > 0 ? filteredStockValue : totalStockValue)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  PENDING
                </span>
                <span className="text-base font-bold text-amber-500 font-mono mt-0.5 block">
                  {formatNumber(periodCustomerPending)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: COMPARISON */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-baseline justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                COMPARISON
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatNumber(comparisonAmount)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3.5">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  CUSTOMER
                </span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
                  {formatNumber(customerTotalAmount)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  VENDOR (-)
                </span>
                <span className="text-base font-bold text-slate-600 dark:text-slate-300 font-mono mt-0.5 block">
                  -{formatNumber(periodPayables)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: VENDOR AMOUNT */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-baseline justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                VENDOR AMOUNT
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {formatNumber(periodPurchaseBill)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3.5">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  PAID / GAVE
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                  {formatNumber(periodSupplierPaid)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  PENDING
                </span>
                <span className="text-base font-bold text-amber-500 font-mono mt-0.5 block">
                  {formatNumber(periodPayables)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 2.5 Analytics & Trend Charts (Stock Flow Velocity & Category/Market Share) */}
      <DashboardAnalyticsCharts 
        articles={articles}
        purchases={purchases}
        outward={outward}
      />

      {/* 3. Live Articles Stock Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Warehouse Stock Register (Godam Stock Register)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Live Inventory
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kisi bhee article code par click karke mukammal aamad, rawangi aur bacha hua stock dekhein
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('articles')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group cursor-pointer"
          >
            <span>View All ({articles.length} Articles)</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="overflow-x-auto mt-3.5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Article Code</th>
                <th className="py-3 px-3.5">Description (Tafseel)</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5 text-right">Total Inward</th>
                <th className="py-3 px-3.5 text-right">Total Outward</th>
                <th className="py-3 px-3.5 text-right">Current Stock</th>
                <th className="py-3 px-3.5 text-right">Unit Cost</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                        <Shirt className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Abhi Tak Koi Garment Article Darj Nahi Hua
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Godam me pehla jacket, hoodie ya jersey design code enter karne ke liye neechay button dabayein:
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddArticleOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Pehla Article Darj Karein</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredArticles.slice((articlesPage - 1) * articlesPageSize, articlesPage * articlesPageSize).map((art) => (
                  <tr
                    key={art.articleNo}
                    onClick={() => setSelectedArticleDetail(art)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3.5">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {art.articleNo}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                      {art.name}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        {art.category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {art.totalPurchased?.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {art.totalOut?.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      {art.currentStock?.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-600 dark:text-slate-400 font-medium">
                      Rs. {art.unitCost?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedArticleDetail(art)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors mx-auto cursor-pointer"
                        title="View Article Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 10-Item Pagination */}
        <Pagination
          currentPage={articlesPage}
          totalItems={filteredArticles.length}
          pageSize={articlesPageSize}
          onPageChange={setArticlesPage}
          itemLabel="articles"
        />
      </div>

    </div>
  );
};

