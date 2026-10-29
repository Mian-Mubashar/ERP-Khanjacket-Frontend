import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Shirt,
  Ship,
  Truck,
  Building2,
  Wallet,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
  Warehouse,
  Receipt,
  Plus,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';

export const DashboardOverview = ({ setActiveTab }) => {
  const navigate = useNavigate();

  const handleNavigate = (tab) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else {
      navigate(`/${tab}`);
    }
  };

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
    setIsRecordCustomerPaymentOpen,
    setSelectedArticleDetail
  } = useApp();

  // Helper to format clean numeric values
  const formatNumber = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return Math.round(Number(val)).toLocaleString('en-US');
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

  // Safe date normalizer (handles 'YYYY-MM-DD', ISO strings, or Date instances)
  const normalizeDate = (rawDate) => {
    if (!rawDate) return '';
    if (typeof rawDate === 'string') return rawDate.split('T')[0];
    try {
      return new Date(rawDate).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // =========================================================================
  // TIMEFRAME STATE (Controlled from the top command bar)
  // Default to 'ALL' (Kul Hisaab) so user sees lifetime by default, with 1-click switch to Daily/Weekly/Monthly
  // =========================================================================
  const [timeframe, setTimeframe] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Additional fine filters for branch, category, article
  const [selectedBranch, setSelectedBranch] = useState('All branches');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedArticleCode, setSelectedArticleCode] = useState('All Articles');
  const [hoveredSalesPoint, setHoveredSalesPoint] = useState(null);

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
    } else if (mode === 'YEAR') {
      const year = today.split('-')[0];
      setDateFrom(`${year}-01-01`);
      setDateTo(`${year}-12-31`);
    } else if (mode === 'ALL') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const handleCustomDateChange = (from, to) => {
    setTimeframe('MANUAL');
    setDateFrom(from);
    setDateTo(to);
  };

  const isDateInRange = (rawDate) => {
    if (timeframe === 'ALL') return true;
    if (!rawDate) return false;
    const dateStr = normalizeDate(rawDate);
    if (!dateStr) return false;
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

  // Clean human-readable timeframe label for badges and headers (English / Roman)
  const timeframeLabel = 
    timeframe === 'DAY' ? 'Daily (Today)' :
    timeframe === 'WEEK' ? 'Weekly (Last 7 Days)' :
    timeframe === 'MONTH' ? 'Monthly (Last 30 Days)' :
    timeframe === 'YEAR' ? 'Yearly (2026)' :
    timeframe === 'MANUAL' ? `Custom: ${dateFrom || 'Start'} to ${dateTo || 'End'}` :
    'All-Time';

  // =========================================================================
  // DYNAMIC DATA FILTERING FOR THE SELECTED PERIOD
  // =========================================================================
  const filteredPurchases = purchases.filter(p => {
    if (!isDateInRange(p.purchaseDate)) return false;
    if (selectedBranch !== 'All branches' && selectedBranch !== 'All Warehouses' && !selectedBranch.toLowerCase().includes('karachi')) {
      return false;
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

  const filteredPayments = (payments || []).filter(pay => isDateInRange(pay.date));
  const filteredCustomerPayments = (customerPayments || []).filter(cp => {
    if (!isDateInRange(cp.date)) return false;
    if (selectedBranch !== 'All branches' && selectedBranch !== 'All Warehouses' && !matchBranch(cp.city)) return false;
    return true;
  });

  // 1. Inward & Purchases in Period
  let periodInwardQty = 0;
  let periodPurchaseBill = 0;
  let periodExtraExpenses = 0;

  filteredPurchases.forEach(p => {
    periodExtraExpenses += (Number(p.extraExpenses) || 0);
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
    periodPurchaseBill = filteredPurchases.reduce((sum, p) => sum + (Number(p.totalBill) || 0), 0);
  }

  // 2. Outward Dispatches / Sales in Period
  const periodOutwardQty = filteredOutward.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const periodWholesaleSale = filteredOutward.reduce((sum, o) => sum + (Number(o.totalSaleAmount) || 0), 0);
  const periodChallansCount = filteredOutward.length;
  const periodWholesaleCities = new Set(filteredOutward.map(o => o.city).filter(Boolean)).size;

  // 3. Payments Made in Period (Money Paid to Suppliers + Freight)
  const periodSupplierPaymentsTotal = filteredPayments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const periodStandalonePurchaseCash = filteredPurchases.reduce((sum, p) => {
    const amt = Number(p.paidAmount) || 0;
    if (amt <= 0) return sum;
    const alreadyInPayments = filteredPayments.some(pay => 
      pay.refNo === p.invoiceNo || (pay.supplierId && pay.supplierId === p.supplierId && Number(pay.amount) === amt)
    );
    return alreadyInPayments ? sum : sum + amt;
  }, 0);
  const periodSupplierPaid = periodSupplierPaymentsTotal + periodStandalonePurchaseCash;
  const periodTotalExpenses = periodSupplierPaid;
  const periodPayables = Math.max(0, periodPurchaseBill - periodSupplierPaid);

  // 4. Customer Payments Received in Period (Wasooli + Upfront Cash Paid on Bills)
  const periodCustomerCashReceived = filteredCustomerPayments.reduce((sum, cp) => sum + (Number(cp.amount) || 0), 0);
  const periodOutwardUpfrontCash = filteredOutward.reduce((sum, o) => {
    const amt = Number(o.paidAmount) || 0;
    if (amt <= 0) return sum;
    const alreadyInPayments = filteredCustomerPayments.some(cp => 
      cp.refNo === `REC-${o.challanNo}` || (cp.customerId && cp.customerId === o.customerId && Number(cp.amount) === amt)
    );
    return alreadyInPayments ? sum : sum + amt;
  }, 0);
  const totalPeriodIncome = periodCustomerCashReceived + periodOutwardUpfrontCash;

  // 5. Remaining Balance generated in Period
  const relevantCustomers = customers.filter(c => {
    if (selectedBranch !== 'All branches' && selectedBranch !== 'All Warehouses' && !matchBranch(c.city)) return false;
    return true;
  });
  const totalCustomerKhataBalance = relevantCustomers.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);
  const periodCustomerPending = (timeframe === 'ALL' && !dateFrom && !dateTo)
    ? totalCustomerKhataBalance
    : Math.max(0, periodWholesaleSale - totalPeriodIncome);
  const periodClosingNet = totalPeriodIncome - periodTotalExpenses;

  // Global static summaries for warehouse stock inventory
  const totalStock = articles.reduce((sum, a) => sum + (Number(a.currentStock) || 0), 0);
  const totalStockValue = articles.reduce((sum, a) => sum + ((Number(a.currentStock) || 0) * (Number(a.unitCost) || 0)), 0);
  const lowStockCount = articles.filter(a => (Number(a.currentStock) || 0) <= (Number(a.minAlertStock) || 200)).length;

  // Filtered Articles for Stock Register Table
  const filteredArticles = articles.filter(a => {
    if (selectedCategory !== 'All Categories' && a.category !== selectedCategory) return false;
    if (selectedBrand !== 'All Brands' && a.stuff !== selectedBrand && a.brand !== selectedBrand) return false;
    if (selectedArticleCode !== 'All Articles' && a.articleNo !== selectedArticleCode) return false;
    return true;
  });
  const filteredStockValue = filteredArticles.reduce((sum, a) => sum + ((Number(a.currentStock) || 0) * (Number(a.unitCost) || 0)), 0);
  const filteredArticlesStock = filteredArticles.reduce((sum, a) => sum + (Number(a.currentStock) || 0), 0);
  const customerTotalAmount = (filteredStockValue > 0 ? filteredStockValue : totalStockValue) + periodCustomerPending;
  const comparisonAmount = customerTotalAmount - periodPayables;

  // =========================================================================
  // DYNAMIC SALES TREND GRAPH DATA (Adapts to DAY, WEEK, MONTH, or YEAR)
  // =========================================================================
  let trendPoints = [];
  const today = getTodayStr();

  if (timeframe === 'DAY') {
    // Break down today's dispatches or hours
    if (filteredOutward.length > 0) {
      trendPoints = filteredOutward.map((o, idx) => ({
        label: o.challanNo ? `#${o.challanNo.slice(-4)}` : `B${idx + 1}`,
        fullLabel: `${o.customerName || 'Customer'} (${o.challanNo || ''})`,
        amount: Number(o.totalSaleAmount) || 0,
        pcs: Number(o.quantity) || 0,
        sub: o.destination || o.city || 'Today'
      }));
    } else {
      trendPoints = [
        { label: 'Morning', fullLabel: 'Morning 9AM-12PM', amount: 0, pcs: 0, sub: 'Aaj' },
        { label: 'Afternoon', fullLabel: 'Afternoon 12PM-4PM', amount: 0, pcs: 0, sub: 'Aaj' },
        { label: 'Evening', fullLabel: 'Evening 4PM-8PM', amount: 0, pcs: 0, sub: 'Aaj' },
        { label: 'Night', fullLabel: 'Closing 8PM-10PM', amount: 0, pcs: 0, sub: 'Aaj' }
      ];
    }
  } else if (timeframe === 'WEEK') {
    // 7 Days of the Week
    const daysArr = [6, 5, 4, 3, 2, 1, 0];
    trendPoints = daysArr.map(dCount => {
      const targetDate = getDaysAgoStr(today, dCount);
      const dayName = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'short' });
      const dayDispatches = outward.filter(o => normalizeDate(o.date) === targetDate);
      const amt = dayDispatches.reduce((s, o) => s + (Number(o.totalSaleAmount) || 0), 0);
      const pcs = dayDispatches.reduce((s, o) => s + (Number(o.quantity) || 0), 0);
      return {
        label: dayName,
        fullLabel: `${dayName} (${targetDate})`,
        amount: amt,
        pcs,
        sub: `${dayDispatches.length} Challans`
      };
    });
  } else if (timeframe === 'MONTH') {
    // 5 Time Slices of the Month (Days 1-6, 7-12, 13-18, 19-24, 25-31)
    const intervals = [
      { label: 'W1 (1-6)', startDays: 30, endDays: 24 },
      { label: 'W2 (7-12)', startDays: 24, endDays: 18 },
      { label: 'W3 (13-18)', startDays: 18, endDays: 12 },
      { label: 'W4 (19-24)', startDays: 12, endDays: 6 },
      { label: 'W5 (25-30)', startDays: 6, endDays: 0 }
    ];
    trendPoints = intervals.map(inter => {
      const startDate = getDaysAgoStr(today, inter.startDays);
      const endDate = getDaysAgoStr(today, inter.endDays);
      const matches = outward.filter(o => {
        const d = normalizeDate(o.date);
        return d && d >= startDate && d <= endDate;
      });
      const amt = matches.reduce((s, o) => s + (Number(o.totalSaleAmount) || 0), 0);
      const pcs = matches.reduce((s, o) => s + (Number(o.quantity) || 0), 0);
      return {
        label: inter.label,
        fullLabel: `${inter.label}: ${startDate} to ${endDate}`,
        amount: amt,
        pcs,
        sub: `${matches.length} Bills`
      };
    });
  } else {
    // 12 Months (Jan - Dec) for YEAR & ALL
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    trendPoints = months.map((m, idx) => {
      const monthDispatches = (outward || []).filter(o => {
        const d = normalizeDate(o.date);
        if (!d) return false;
        const parsed = new Date(d);
        return !isNaN(parsed.getTime()) && parsed.getMonth() === idx;
      });
      const amt = monthDispatches.reduce((s, o) => s + (Number(o.totalSaleAmount) || 0), 0);
      const pcs = monthDispatches.reduce((s, o) => s + (Number(o.quantity) || 0), 0);
      return {
        label: m,
        fullLabel: `${m} 2026`,
        amount: amt,
        pcs,
        sub: `${monthDispatches.length} Challans`
      };
    });
  }

  // Calculate SVG Area Chart Geometry
  const maxTrendAmt = Math.max(...trendPoints.map(p => p.amount), 100);
  const chartWidth = 620;
  const chartHeight = 180;
  const padLeft = 45;
  const padRight = 20;
  const padBottom = 25;
  const padTop = 15;
  const graphW = chartWidth - padLeft - padRight;
  const graphH = chartHeight - padTop - padBottom;
  const numPoints = trendPoints.length;

  const svgPoints = trendPoints.map((pt, i) => {
    const x = numPoints > 1 ? padLeft + i * (graphW / (numPoints - 1)) : padLeft + graphW / 2;
    const y = (chartHeight - padBottom) - (pt.amount / maxTrendAmt) * graphH;
    return { x, y, ...pt, index: i };
  });

  let linePathD = numPoints > 0 ? `M ${svgPoints[0].x} ${svgPoints[0].y}` : '';
  for (let i = 0; i < svgPoints.length - 1; i++) {
    const p0 = svgPoints[i];
    const p1 = svgPoints[i + 1];
    const cpx1 = p0.x + (p1.x - p0.x) / 2;
    const cpy1 = p0.y;
    const cpx2 = p0.x + (p1.x - p0.x) / 2;
    const cpy2 = p1.y;
    linePathD += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.x} ${p1.y}`;
  }
  const areaPathD = numPoints > 0 
    ? `${linePathD} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - padBottom} L ${svgPoints[0].x} ${chartHeight - padBottom} Z`
    : '';

  // =========================================================================
  // DYNAMIC CITY / BRANCH DISTRIBUTION IN PERIOD (Donut Chart)
  // =========================================================================
  const cityCounts = {};
  filteredOutward.forEach(o => {
    const c = o.city || o.destination || 'Direct Shop';
    cityCounts[c] = (cityCounts[c] || 0) + (Number(o.quantity) || 1);
  });

  const cityPalette = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  let rawCityList = Object.entries(cityCounts).map(([name, pcs]) => ({ name, pcs }));
  rawCityList.sort((a, b) => b.pcs - a.pcs);

  const totalPeriodBranchPcs = rawCityList.reduce((sum, c) => sum + c.pcs, 0);
  const branchBreakdown = rawCityList.slice(0, 4).map((c, idx) => ({
    ...c,
    color: cityPalette[idx % cityPalette.length],
    percent: totalPeriodBranchPcs > 0 ? ((c.pcs / totalPeriodBranchPcs) * 100).toFixed(1) : 0
  }));

  const donutRadius = 52;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let donutOffsetAcc = 0;

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 0 & 1. UNIFIED FINANCIAL & TIMEFRAME COMMAND CONTAINER (Single Border)    */}
      {/* User requested: "in ko aik he container ma rakhe na yar means aik he border ma ho" */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs transition-colors space-y-5">
        
        {/* Top Header & Dynamic Timeframe Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          
          {/* Active Period Title & Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Financial Summary & Timeframe
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                  {timeframeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Neechay tamam Income, Expense, Maal Sent aur Graphs is muddat ke mutabiq dynamic hain
              </p>
            </div>
          </div>

          {/* Quick Timeframe Buttons & Date Range Picker (Single Row: Buttons + Manual Date Inputs Side-by-Side) */}
          <div className="flex items-center gap-2.5 shrink-0 overflow-x-auto">
            {/* 4 Timeframe Buttons (Yearly removed as requested) */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
              {[
                { id: 'DAY', label: 'Daily' },
                { id: 'WEEK', label: 'Weekly' },
                { id: 'MONTH', label: 'Monthly' },
                { id: 'ALL', label: 'All-Time' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTimeframeChange(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeframe === t.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Manual Date Range Inputs (Directly in front on the same line) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
              <span className="text-[11px] font-semibold text-slate-400">Date:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => handleCustomDateChange(e.target.value, dateTo)}
                className="bg-transparent text-slate-700 dark:text-slate-200 outline-hidden text-xs cursor-pointer"
                title="Start Date"
              />
              <span className="text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => handleCustomDateChange(dateFrom, e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 outline-hidden text-xs cursor-pointer"
                title="End Date"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => handleTimeframeChange('ALL')}
                  className="text-slate-400 hover:text-rose-500 font-bold ml-1 cursor-pointer transition-colors"
                  title="Reset Dates to All-Time"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* 4 Metric Cards: 2 cards per row for maximum width & large amount visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: TOTAL INCOME */}
          <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-blue-400 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-l-xl" />
            <div className="flex items-center gap-3.5 pl-1">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Wallet className="w-5.5 h-5.5 stroke-[1.8]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  TOTAL INCOME
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block tracking-tight">
                  Rs. {formatNumber(totalPeriodIncome)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  {filteredCustomerPayments.length} Wasooli Entries
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: TOTAL EXPENSE */}
          <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-cyan-400 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500 rounded-l-xl" />
            <div className="flex items-center gap-3.5 pl-1">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Layers className="w-5.5 h-5.5 stroke-[1.8]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  TOTAL EXPENSE
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block tracking-tight">
                  Rs. {formatNumber(periodTotalExpenses)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  Factory & Freight Paid
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: MAAL SENT */}
          <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-indigo-400 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-l-xl" />
            <div className="flex items-center gap-3.5 pl-1">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Truck className="w-5.5 h-5.5 stroke-[1.8]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  MAAL SENT
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block tracking-tight">
                  {periodOutwardQty.toLocaleString()} pcs
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block mt-0.5">
                  Total Billed: Rs. {formatNumber(periodWholesaleSale)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: BAQAYA REMAINING */}
          <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-rose-400 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-xl" />
            <div className="flex items-center gap-3.5 pl-1">
              <div className="w-12 h-12 rounded-full border-2 border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Receipt className="w-5.5 h-5.5 stroke-[1.8]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  BAQAYA REMAINING
                </span>
                <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 block tracking-tight">
                  Rs. {formatNumber(periodCustomerPending)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  {periodChallansCount} Challans in {periodWholesaleCities || 1} Cities
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. QUICK ACTION SHORTCUTS (Circled in Image 2 - Retained)                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs transition-colors">
        
        {/* Section Header with Alert Badges */}
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
            <button
              type="button"
              onClick={() => handleNavigate('suppliers')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="View Suppliers Page"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-100 dark:ring-rose-950 shrink-0" />
              <span>Payment Alerts:</span>
              <strong className="font-mono text-slate-900 dark:text-white font-bold">
                {suppliers.filter(s => s.remainingBalance > 0).length}
              </strong>
            </button>

            {/* Pending Shipments Badge */}
            <button
              type="button"
              onClick={() => handleNavigate('purchases')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="View Purchases / China Containers Page"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-100 dark:ring-blue-950 shrink-0" />
              <span>China Freight:</span>
              <strong className="font-mono text-slate-900 dark:text-white font-bold">
                {purchases.length}
              </strong>
            </button>

            {/* Low Stock Badge */}
            <button
              type="button"
              onClick={() => handleNavigate('articles')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="View Articles / Stock Page"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-100 dark:ring-amber-950 shrink-0" />
              <span>Kam Stock:</span>
              <strong className="font-mono text-slate-900 dark:text-white font-bold">
                {lowStockCount}
              </strong>
            </button>
          </div>
        </div>

        {/* 8 Modern App Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
          
          {/* 1. Party / Dukaandaar */}
          <div 
            onClick={() => handleNavigate('customers')}
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/40 hover:from-blue-100/60 dark:hover:from-slate-750 border border-blue-100 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-500/60 transition-all shadow-2xs hover:shadow-md group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                {customers.length} Shops
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Party (Dukaandar Khata)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Shopkeeper ledgers & khata
              </p>
            </div>
          </div>

          {/* 2. Dukaan Wasooli */}
          <div 
            onClick={() => handleNavigate('customers')}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/40 hover:from-emerald-100/60 dark:hover:from-slate-750 border border-emerald-100 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-500/60 transition-all shadow-2xs hover:shadow-md group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Cash In
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Dukaan Wasooli (Cash In)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Collect payment & update khata
              </p>
            </div>
          </div>

          {/* 3. Maal Rawangi */}
          <div 
            onClick={() => handleNavigate('outward')}
            className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/60 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/40 hover:from-rose-100/60 dark:hover:from-slate-750 border border-rose-100 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-500/60 transition-all shadow-2xs hover:shadow-md group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                {outward.length} Challans
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Maal Rawangi (Dispatches)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Dispatch goods to wholesale shops
              </p>
            </div>
          </div>

          {/* 4. Godam Stock */}
          <div 
            onClick={() => handleNavigate('articles')}
            className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/60 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/40 hover:from-purple-100/60 dark:hover:from-slate-750 border border-purple-100 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-500/60 transition-all shadow-2xs hover:shadow-md group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Shirt className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                {articles.length} Items
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Stock Catalog (Articles)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Garments inventory & pieces
              </p>
            </div>
          </div>

          {/* 5. China Container */}
          <div 
            onClick={() => handleNavigate('purchases')}
            className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/60 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/40 hover:from-teal-100/60 dark:hover:from-slate-750 border border-teal-100 dark:border-slate-700/80 hover:border-teal-300 dark:hover:border-teal-500/60 transition-all shadow-2xs hover:shadow-md group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Ship className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                {purchases.length} Bills
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                China Inward (Containers)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Record import shipment arrivals
              </p>
            </div>
          </div>

          {/* 6. China Suppliers */}
          <div 
            onClick={() => handleNavigate('suppliers')}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/40 hover:from-amber-100/60 dark:hover:from-slate-750 border border-amber-100 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-500/60 transition-all shadow-2xs hover:shadow-md group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200">
                {suppliers.length} Factories
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                China Vendors (Suppliers)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Factory accounts & payments
              </p>
            </div>
          </div>

          {/* 7. Roznamcha / Reports */}
          <div 
            onClick={() => handleNavigate('reports')}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/40 hover:from-indigo-100/60 dark:hover:from-slate-750 border border-indigo-100 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-500/60 transition-all shadow-2xs hover:shadow-md group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                PDF
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Reports & Hisaab Kitaab
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Download balance sheets & statements
              </p>
            </div>
          </div>

          {/* 8. Branches & Markets */}
          <div 
            onClick={() => handleNavigate('branches')}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-100/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/40 hover:from-slate-200/80 dark:hover:from-slate-750 border border-slate-200 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-2xs hover:shadow-md group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-slate-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Warehouse className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {cities.length} Cities
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                Branches & Cities
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Lahore, Karachi, Pindi branches
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CORE ANALYTICS HUB (Sales Overview + Branch Separation)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dynamic Sales Overview Chart (8 Columns) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs transition-colors flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-6 bg-indigo-600 rounded-full" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Sales & Outward Overview
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {timeframeLabel} ke mutabiq wholesale sale aur dispatches curve
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {trendPoints.length} Data Points ({timeframe})
              </span>
            </div>
          </div>

          {/* Premium Executive KPI Summary Strip (Replaced shocking blue banner) */}
          <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 shadow-2xs">
            <div className="px-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Total Billed Sale
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mt-0.5 block">
                Rs. {formatNumber(periodWholesaleSale)}
              </span>
            </div>
            <div className="px-1 sm:border-l sm:border-slate-200/80 dark:sm:border-slate-700/60 sm:pl-4">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Maal Sent (Pcs)
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mt-0.5 block">
                {periodOutwardQty.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
              </span>
            </div>
            <div className="px-1 sm:border-l sm:border-slate-200/80 dark:sm:border-slate-700/60 sm:pl-4">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Wasooli Collected
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5 block">
                Rs. {formatNumber(totalPeriodIncome)}
              </span>
            </div>
            <div className="px-1 sm:border-l sm:border-slate-200/80 dark:sm:border-slate-700/60 sm:pl-4">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Khata Baqaya
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight mt-0.5 block">
                Rs. {formatNumber(periodCustomerPending)}
              </span>
            </div>
          </div>

          {/* Dynamic SVG Area / Line Chart */}
          <div className="relative pt-2">
            
            {/* Hover Tooltip */}
            {hoveredSalesPoint && (
              <div className="absolute top-2 right-4 bg-slate-900/95 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700 pointer-events-none z-10 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-100">
                <span className="font-bold text-blue-400">{hoveredSalesPoint.fullLabel}:</span>
                <span className="font-mono">Rs. {formatNumber(hoveredSalesPoint.amount)}</span>
                <span className="text-slate-400 text-[11px]">({hoveredSalesPoint.pcs.toLocaleString()} pcs)</span>
              </div>
            )}

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 sm:h-56 overflow-visible">
              <defs>
                <linearGradient id="dynamicSalesGradArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = (chartHeight - padBottom) - ratio * graphH;
                const labelVal = Math.round(ratio * (maxTrendAmt >= 1000 ? maxTrendAmt / 1000 : maxTrendAmt));
                return (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={chartWidth - padRight}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? "0" : "3 3"}
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                    >
                      {labelVal}{maxTrendAmt >= 1000 ? 'k' : ''}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              {areaPathD && <path d={areaPathD} fill="url(#dynamicSalesGradArea)" />}

              {/* Smooth Indigo Bezier Curve Line */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points with Hover Interaction */}
              {svgPoints.map((p, i) => (
                <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredSalesPoint(p)} onMouseLeave={() => setHoveredSalesPoint(null)}>
                  <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
                  {hoveredSalesPoint?.index === i && (
                    <circle cx={p.x} cy={p.y} r={7} fill="#4F46E5" fillOpacity="0.20" />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredSalesPoint?.index === i ? 4.5 : 3}
                    fill="#4F46E5"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                  <text
                    x={p.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    className={`text-[10px] font-semibold transition-colors ${
                      hoveredSalesPoint?.index === i
                        ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Right Column: Dynamic Branch Separation Donut Chart (4 Columns) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs transition-colors flex flex-col justify-between">
          
          {/* Header */}
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Branch Separation
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {timeframeLabel} ke doran shehron ko maal rawangi
            </p>
          </div>

          {/* SVG Donut / Ring Chart (Refined & Slender) */}
          <div className="flex items-center justify-center my-3 relative">
            <svg viewBox="0 0 160 160" className="w-36 h-36 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={donutRadius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="11"
                className="text-slate-100 dark:text-slate-800"
              />

              {branchBreakdown.map((item, idx) => {
                const strokeDash = (Number(item.percent) / 100) * donutCircumference;
                const offset = donutOffsetAcc;
                donutOffsetAcc += strokeDash;
                return (
                  <circle
                    key={idx}
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="11"
                    strokeDasharray={`${strokeDash} ${donutCircumference}`}
                    strokeDashoffset={-offset}
                    className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                  />
                );
              })}
            </svg>

            {/* Centered Donut Hole Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Maal Sent
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight">
                {totalPeriodBranchPcs.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Pieces</span>
            </div>
          </div>

          {/* Legend with Percentages */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            {branchBreakdown.length === 0 ? (
              <div className="text-center py-2 text-xs text-slate-400">
                Is muddat me koi maal rawana nahi hua.
              </div>
            ) : (
              branchBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {item.percent}%
                  </span>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. DASHBOARD FOOTER (Branded + Developer Credit Link)                     */}
      {/* ========================================================================= */}
      <footer className="pt-6 pb-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
        <div className="font-bold tracking-wider uppercase text-slate-800 dark:text-slate-100 text-sm sm:text-base">
          KHAN JACKET HOUSE
        </div>
        <div className="text-center sm:text-right font-medium">
          Copyright &copy; 2026. All rights reserved. Powered by{' '}
          <a
            href="https://mubasharportfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white font-bold text-sm sm:text-base transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-4 cursor-pointer"
            title="Mubashar Portfolio"
          >
            Mubashar
          </a>
          .
        </div>
      </footer>

    </div>
  );
};
