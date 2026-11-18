import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  Wallet,
  FileText,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  Package,
  Shirt,
  ChevronRight,
  Calendar,
  MapPin,
  Phone,
  ShieldAlert,
  X,
  CreditCard,
  Building2,
  Eye,
  ExternalLink,
  Plus,
  Zap,
  Trash2,
  Download
} from 'lucide-react';
import api from '../../services/api';
import { formatCustomerDisplayName } from '../../utils/formatters';
import { showToast, showError } from '../../utils/sweetalert';
import { downloadAnnouncementsPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';
import { calculateCustomerPaymentPendingDays, getOverdueCustomerReminders } from '../../utils/paymentReminders';

export const AnnouncementsView = () => {
  const {
    articles,
    customers,
    customerPayments,
    outward,
    cities,
    fetchInitialData,
    setSelectedArticleDetail,
    setSelectedCustomerKhata,
    setSelectedCustomerForPayment,
    setIsRecordCustomerPaymentOpen,
    setSelectedDispatchForBill,
    setIsNewPurchaseOpen,
    setIsNewOutwardOpen,
    setSelectedCustomerForBill,
    announcementsSubTab,
    setAnnouncementsSubTab,
    canEdit
  } = useApp();

  // Primary Toggle Tabs: Wasooli & Bills | Stock | Customers | All (Synced with Sidebar Submenu)
  const mainTab = announcementsSubTab || 'WASOOLI_BILLS';
  
  const handleTabChange = (tab) => {
    if (setAnnouncementsSubTab) setAnnouncementsSubTab(tab);
    setPage(1);
  };
  const [stockSubFilter, setStockSubFilter] = useState('ALL_LOW'); 
  // 'ALL_LOW' | 'TIER_0' | 'TIER_10' | 'TIER_20' | 'TIER_30' | 'TIER_40' | 'TIER_50'

  // Sub-filters for Wasooli & Bills
  const [wasooliBillsSubFilter, setWasooliBillsSubFilter] = useState('ALL'); // 'ALL' | 'WASOOLI' | 'BILLS'

  // Sub-filters for Customers
  const [customersSubFilter, setCustomersSubFilter] = useState('ALL'); // 'ALL' | 'DUE' | 'SETTLED'

  // Search & City Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const handleStockSubFilterChange = (tier) => {
    setStockSubFilter(tier);
    setPage(1);
  };

  const handleWasooliBillsSubFilterChange = (filter) => {
    setWasooliBillsSubFilter(filter);
    setPage(1);
  };

  const handleCustomersSubFilterChange = (filter) => {
    setCustomersSubFilter(filter);
    setPage(1);
  };

  // 10-Day Retention Scope: '10_DAYS' (Active, auto-purges >10d) | 'ALL' (Full Archive)
  const [retentionScope, setRetentionScope] = useState('10_DAYS');

  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
  const cutoff10Days = useMemo(() => Date.now() - TEN_DAYS_MS, []);

  // Silent automatic 10-day retention cleanup on mount
  React.useEffect(() => {
    api.notifications.cleanup(10).catch(() => {});
  }, []);

  // 1. Process Stock Alerts (50% to 0% with 10% step notifications)
  const stockAlerts = useMemo(() => {
    return (articles || []).map(art => {
      const current = Number(art.currentStock) || 0;
      const initial = Number(art.totalPurchased) > 0 
        ? Number(art.totalPurchased) 
        : (current + (Number(art.totalOut) || 0));

      const percent = initial > 0 
        ? Math.min(100, Math.max(0, Math.round((current / initial) * 100))) 
        : (current === 0 ? 0 : 100);

      // Only alert if stock is 50% or below
      if (percent > 50) return null;

      let tier = 'TIER_50';
      let tierLabel = 'Below 50% Stock';
      let urgency = 'Low Warning';
      let badgeBg = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-900';
      let barBg = 'bg-blue-500';
      let tierRank = 5;

      if (current <= 0 || percent <= 0) {
        tier = 'TIER_0';
        tierLabel = '0% Out of Stock!';
        urgency = 'Critical Shortage';
        badgeBg = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 animate-pulse';
        barBg = 'bg-rose-600';
        tierRank = 0;
      } else if (percent <= 10) {
        tier = 'TIER_10';
        tierLabel = 'Below 10% Stock';
        urgency = 'Severe Alert';
        badgeBg = 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800';
        barBg = 'bg-red-600';
        tierRank = 1;
      } else if (percent <= 20) {
        tier = 'TIER_20';
        tierLabel = 'Below 20% Stock';
        urgency = 'High Priority';
        badgeBg = 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800';
        barBg = 'bg-orange-600';
        tierRank = 2;
      } else if (percent <= 30) {
        tier = 'TIER_30';
        tierLabel = 'Below 30% Stock';
        urgency = 'Reorder Alert';
        badgeBg = 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
        barBg = 'bg-amber-500';
        tierRank = 3;
      } else if (percent <= 40) {
        tier = 'TIER_40';
        tierLabel = 'Below 40% Stock';
        urgency = 'Moderate Alert';
        badgeBg = 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950/80 dark:text-yellow-300 dark:border-yellow-800';
        barBg = 'bg-yellow-500';
        tierRank = 4;
      }

      return {
        id: `stock-${art.articleNo}`,
        type: 'STOCK',
        article: art,
        articleNo: art.articleNo,
        articleName: art.name,
        category: art.category,
        stuff: art.stuff || 'Standard',
        currentStock: current,
        initialStock: initial,
        totalOut: Number(art.totalOut) || 0,
        percent,
        tier,
        tierLabel,
        urgency,
        badgeBg,
        barBg,
        tierRank,
        location: art.warehouseLocation || 'Main Godown',
        updatedAt: art.updatedAt || art.createdAt
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.tierRank - b.tierRank || a.percent - b.percent);
  }, [articles]);

  // 2. Process Wasooli (Customer Payments Received) with 10-Day Retention Tracking
  const wasooliList = useMemo(() => {
    return (customerPayments || []).map(p => {
      const amt = Number(p.amount) || 0;
      const rawDate = new Date(p.date || p.createdAt || 0).getTime();
      const isWithin10Days = rawDate >= cutoff10Days;
      const daysAgo = Math.max(0, Math.floor((Date.now() - rawDate) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, 10 - daysAgo);

      return {
        id: `wasooli-${p.id}`,
        rawId: p.id,
        type: 'WASOOLI',
        title: `Payment Received (Wasooli)`,
        amount: amt,
        customerName: formatCustomerDisplayName(p.customerName || 'Customer'),
        customerId: p.customerId,
        city: p.city || '',
        paymentMethod: p.paymentMethod || 'Cash Receipt',
        refNo: p.refNo || `REC-${p.id}`,
        notes: p.notes || '',
        date: p.date || (p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        rawDate,
        isWithin10Days,
        daysAgo,
        daysRemaining,
        recordedBy: p.recordedBy || 'Staff'
      };
    })
    .filter(p => retentionScope === 'ALL' || p.isWithin10Days)
    .sort((a, b) => b.rawDate - a.rawDate);
  }, [customerPayments, retentionScope, cutoff10Days]);

  // 3. Process Bills (Outward Dispatches Generated) with 10-Day Retention Tracking
  const billsList = useMemo(() => {
    return (outward || []).map(o => {
      const amt = Number(o.totalSaleAmount) || ((Number(o.quantity) || 0) * (Number(o.unitSalePrice) || 0));
      const rawDate = new Date(o.date || o.createdAt || 0).getTime();
      const isWithin10Days = rawDate >= cutoff10Days;
      const daysAgo = Math.max(0, Math.floor((Date.now() - rawDate) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, 10 - daysAgo);

      return {
        id: `bill-${o.id}`,
        rawId: o.id,
        type: 'BILL',
        title: `Bill #${o.challanNo || o.id} Dispatched`,
        challanNo: o.challanNo,
        amount: amt,
        customerName: formatCustomerDisplayName(o.customerName || 'Customer'),
        customerId: o.customerId,
        city: o.city || o.destination || '',
        quantity: Number(o.quantity) || 0,
        articleNo: o.articleNo,
        articleName: o.articleName || (o.isWithoutStock ? 'Direct Bill (Without Stock)' : o.articleNo),
        isWithoutStock: Boolean(o.isWithoutStock),
        date: o.date || (o.createdAt ? o.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        rawDate,
        isWithin10Days,
        daysAgo,
        daysRemaining,
        gatePassNo: o.gatePassNo,
        notes: o.notes || '',
        originalItem: o
      };
    })
    .filter(o => retentionScope === 'ALL' || o.isWithin10Days)
    .sort((a, b) => b.rawDate - a.rawDate);
  }, [outward, retentionScope, cutoff10Days]);

  // 4. Process Customer Ledger Balance Alerts (with 10+ Days Overdue Wasooli Tracking)
  const customerAlerts = useMemo(() => {
    return (customers || []).map(c => {
      const bal = Number(c.remainingBalance) || 0;
      const isDue = bal > 0;
      const pendingStats = calculateCustomerPaymentPendingDays(c, customerPayments, outward);
      return {
        id: `cust-${c.id}`,
        type: 'CUSTOMER',
        customer: c,
        shopName: c.shopName,
        shopkeeperName: c.shopkeeperName,
        city: c.city,
        phone: c.phone,
        marketAddress: c.marketAddress,
        remainingBalance: bal,
        totalBill: Number(c.totalBill) || 0,
        totalPaid: Number(c.totalPaid) || 0,
        totalPiecesReceived: Number(c.totalPiecesReceived) || 0,
        isDue,
        isOverdue: pendingStats.isOverdue,
        daysPending: pendingStats.daysPending,
        unpaidSinceDateStr: pendingStats.unpaidSinceDateStr,
        unpaidSinceReason: pendingStats.reason,
        inUgrahi: Boolean(c.inUgrahi),
        ugrahiRoute: c.ugrahiRoute
      };
    }).sort((a, b) => {
      if (b.isOverdue !== a.isOverdue) return b.isOverdue ? 1 : -1;
      if (b.daysPending !== a.daysPending) return b.daysPending - a.daysPending;
      return b.remainingBalance - a.remainingBalance;
    });
  }, [customers, customerPayments, outward]);

  const overdueReminders = useMemo(() => {
    return getOverdueCustomerReminders(customers, customerPayments, outward);
  }, [customers, customerPayments, outward]);

  // 5. Combined Timeline Feed (All Events sorted chronologically / priority)
  const unifiedTimeline = useMemo(() => {
    const combined = [];

    // Add Overdue Wasooli Reminders (10+ Days without payment)
    overdueReminders.forEach(rem => {
      combined.push({
        id: rem.id,
        eventCategory: 'OVERDUE_PAYMENT',
        customer: rem.customer,
        customerId: rem.customerId,
        customerName: formatCustomerDisplayName(rem.customerName || rem.customer?.shopName, rem.shopkeeperName || rem.customer?.shopkeeperName),
        shopkeeperName: rem.shopkeeperName,
        city: rem.city || '',
        location: rem.city || 'Shop',
        articleNo: 'Khata Reminder',
        articleName: `Payment not received for ${rem.daysPending} days`,
        category: 'Customer Khata',
        stuff: `${rem.daysPending} Days Overdue`,
        badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        tierLabel: `${rem.daysPending}d Overdue`,
        urgency: `${rem.daysPending} Days Overdue`,
        severity: `Payment Pending ${rem.daysPending} Days`,
        notes: `No wasooli received for ${rem.daysPending} days (Since ${rem.unpaidSinceDateStr})`,
        amount: rem.balance,
        remainingBalance: rem.balance,
        daysPending: rem.daysPending,
        sortTimestamp: Date.now() + 5000000
      });
    });

    // Add stock alerts
    stockAlerts.slice(0, 20).forEach(s => {
      combined.push({
        ...s,
        eventCategory: 'STOCK',
        sortTimestamp: s.tierRank === 0 ? Date.now() + 1000000 : (Date.now() - (s.tierRank * 3600000))
      });
    });

    // Add Wasooli
    wasooliList.forEach(w => {
      combined.push({
        ...w,
        eventCategory: 'WASOOLI',
        sortTimestamp: w.rawDate
      });
    });

    // Add Bills
    billsList.forEach(b => {
      combined.push({
        ...b,
        eventCategory: 'BILL',
        sortTimestamp: b.rawDate
      });
    });

    return combined.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
  }, [overdueReminders, stockAlerts, wasooliList, billsList]);

  // Filtered Stock Alerts
  const filteredStockAlerts = useMemo(() => {
    return stockAlerts.filter(s => {
      if (stockSubFilter !== 'ALL_LOW' && s.tier !== stockSubFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = 
          s.articleNo.toLowerCase().includes(q) ||
          s.articleName.toLowerCase().includes(q) ||
          (s.category && s.category.toLowerCase().includes(q)) ||
          (s.stuff && s.stuff.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [stockAlerts, stockSubFilter, searchTerm]);

  // Filtered Wasooli & Bills
  const filteredWasooliBills = useMemo(() => {
    let list = [];
    if (wasooliBillsSubFilter === 'ALL') {
      list = [...wasooliList, ...billsList].sort((a, b) => b.rawDate - a.rawDate);
    } else if (wasooliBillsSubFilter === 'WASOOLI') {
      list = wasooliList;
    } else if (wasooliBillsSubFilter === 'BILLS') {
      list = billsList;
    }

    return list.filter(item => {
      if (selectedCity !== 'ALL' && item.city && item.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = 
          (item.customerName && item.customerName.toLowerCase().includes(q)) ||
          (item.challanNo && item.challanNo.toLowerCase().includes(q)) ||
          (item.city && item.city.toLowerCase().includes(q)) ||
          (item.articleName && item.articleName.toLowerCase().includes(q)) ||
          (item.refNo && item.refNo.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [wasooliList, billsList, wasooliBillsSubFilter, selectedCity, searchTerm]);

  // Filtered Customers
  const filteredCustomerAlerts = useMemo(() => {
    return customerAlerts.filter(c => {
      if (customersSubFilter === 'OVERDUE' && !c.isOverdue) return false;
      if (customersSubFilter === 'DUE' && !c.isDue) return false;
      if (customersSubFilter === 'SETTLED' && c.isDue) return false;
      if (selectedCity !== 'ALL' && c.city && c.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = 
          (c.shopName && c.shopName.toLowerCase().includes(q)) ||
          (c.shopkeeperName && c.shopkeeperName.toLowerCase().includes(q)) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [customerAlerts, customersSubFilter, selectedCity, searchTerm]);

  // Filtered Unified Timeline
  const filteredTimeline = useMemo(() => {
    return unifiedTimeline.filter(item => {
      if (selectedCity !== 'ALL' && item.city && item.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const str = JSON.stringify(item).toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [unifiedTimeline, selectedCity, searchTerm]);

  // KPI Calculations
  const totalLowStockCount = stockAlerts.length;
  const outOfStockCount = stockAlerts.filter(s => s.tier === 'TIER_0').length;
  const criticalStockCount = stockAlerts.filter(s => s.tier === 'TIER_10' || s.tier === 'TIER_20').length;
  
  const totalWasooliSum = wasooliList.reduce((s, w) => s + w.amount, 0);
  const totalBillsSum = billsList.reduce((s, b) => s + b.amount, 0);
  const totalCustomerDueSum = customers.reduce((s, c) => s + (Number(c.remainingBalance) || 0), 0);
  const pendingCustomersCount = customers.filter(c => (Number(c.remainingBalance) || 0) > 0).length;
  const settledCustomersCount = customers.filter(c => (Number(c.remainingBalance) || 0) <= 0).length;
  const overdueCustomersCount = customerAlerts.filter(c => c.isOverdue).length;

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      if (fetchInitialData) await fetchInitialData();
      showToast('Data refreshed successfully!', 'success');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      setIsExportingPDF(true);
      showToast('Preparing Announcements PDF...', 'info');

      let activeList = [];
      if (mainTab === 'WASOOLI_BILLS') {
        activeList = filteredWasooliBills;
      } else if (mainTab === 'STOCK') {
        activeList = filteredStockAlerts;
      } else if (mainTab === 'CUSTOMERS') {
        activeList = filteredCustomerAlerts;
      } else {
        activeList = filteredTimeline;
      }

      downloadAnnouncementsPDF({
        mainTab,
        dataList: activeList,
        stats: {
          totalWasooliSum,
          totalBillsSum,
          totalLowStockCount,
          totalCustomerDueSum,
          pendingCustomersCount,
          overdueCustomersCount
        },
        filters: {
          selectedCity,
          searchTerm,
          wasooliBillsSubFilter,
          stockSubFilter,
          customersSubFilter,
          retentionScope
        }
      });

      showToast('Announcements PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('[handleDownloadPDF Error]:', err);
      showError('PDF Error', err.message || 'Could not generate Announcements PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const openCustomerStatementByNameOrId = (custName, custId) => {
    if (custId) {
      const found = customers.find(c => String(c.id) === String(custId));
      if (found) {
        setSelectedCustomerKhata(found);
        return;
      }
    }
    if (custName) {
      const cleanName = custName.split('(')[0].trim().toLowerCase();
      const found = customers.find(c => 
        (c.shopName && c.shopName.toLowerCase() === cleanName) ||
        `${c.shopName || ''} (${c.shopkeeperName || ''})`.toLowerCase().includes(cleanName)
      );
      if (found) {
        setSelectedCustomerKhata(found);
        return;
      }
    }
    showToast(`Opening customer statement...`, 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header (Modern, Clean & Minimalist - Linear / Stripe Style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Announcements & Activity
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                10-Day Retention Active
              </span>
              {totalLowStockCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  {totalLowStockCount} Low Stock
                </span>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time feed of customer wasooli receipts, outward dispatch bills, inventory depletion alerts, and customer khata reminders.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-60"
            title="Download PDF report of current register"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{isExportingPDF ? 'Generating...' : 'Export PDF'}</span>
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerForBill(null);
                  setIsNewOutwardOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>+ New Bill</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerForPayment(null);
                  setIsRecordCustomerPaymentOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Receive Payment</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Metric Cards: 2 cards per row (Exact Dashboard Style & Dimensions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: WASOOLI RECEIVED */}
        <div 
          onClick={() => {
            handleTabChange('WASOOLI_BILLS');
            handleWasooliBillsSubFilterChange('WASOOLI');
          }}
          className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
          title="Click to view Wasooli transactions"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-l-xl" />
          <div className="flex items-center gap-3.5 pl-1">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Wallet className="w-5.5 h-5.5 stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                WASOOLI RECEIVED {retentionScope === '10_DAYS' ? '(10 DAYS)' : ''}
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block tracking-tight">
                Rs. {Math.round(totalWasooliSum).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                {wasooliList.length} Payments {retentionScope === '10_DAYS' ? 'in last 10 days' : 'total'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60 transition-colors shrink-0">
            <span>View List</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: TOTAL BILLS GENERATED */}
        <div 
          onClick={() => {
            handleTabChange('WASOOLI_BILLS');
            handleWasooliBillsSubFilterChange('BILLS');
          }}
          className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer"
          title="Click to view Dispatch Challans"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500 rounded-l-xl" />
          <div className="flex items-center gap-3.5 pl-1">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-5.5 h-5.5 stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                TOTAL BILLS GENERATED {retentionScope === '10_DAYS' ? '(10 DAYS)' : ''}
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block tracking-tight">
                Rs. {Math.round(totalBillsSum).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                {billsList.length} Dispatch Challans {retentionScope === '10_DAYS' ? 'in last 10 days' : 'total'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50/80 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 px-2.5 py-1.5 rounded-lg border border-cyan-200/60 dark:border-cyan-800/60 transition-colors shrink-0">
            <span>View Challans</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: STOCK ALERTS */}
        <div 
          onClick={() => handleTabChange('STOCK')}
          className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-amber-500 hover:shadow-md transition-all cursor-pointer"
          title="Click to view Stock Alerts"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-xl" />
          <div className="flex items-center gap-3.5 pl-1">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <TrendingDown className="w-5.5 h-5.5 stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                STOCK ALERTS (≤ 50%)
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block tracking-tight">
                {totalLowStockCount} Models
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                {outOfStockCount > 0 ? `${outOfStockCount} Out of Stock` : `${criticalStockCount} Critical Stock`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2.5 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-800/60 transition-colors shrink-0">
            <span>View Alerts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: BAQAYA REMAINING / CUSTOMER BALANCE DUE */}
        <div 
          onClick={() => handleTabChange('CUSTOMERS')}
          className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4.5 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex items-center justify-between group hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"
          title="Click to view Customer Khata & Balances"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-xl" />
          <div className="flex items-center gap-3.5 pl-1">
            <div className="w-12 h-12 rounded-full border-2 border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5.5 h-5.5 stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                CUSTOMER BALANCE DUE
              </span>
              <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 block tracking-tight">
                Rs. {Math.round(totalCustomerDueSum).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                {pendingCustomersCount} Shops with balance {overdueCustomersCount > 0 ? `• ${overdueCustomersCount} Overdue (10d+)` : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2.5 py-1.5 rounded-lg border border-rose-200/60 dark:border-rose-800/60 transition-colors shrink-0">
            <span>View Khata</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* 3. Main Data Card with Unified Tab Navigation & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Top Segmented Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-5 pt-3 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto -mb-px pb-px">
            <button
              type="button"
              onClick={() => handleTabChange('WASOOLI_BILLS')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                mainTab === 'WASOOLI_BILLS'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Wasooli & Bills</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {wasooliList.length + billsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('STOCK')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                mainTab === 'STOCK'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Stock Alerts (≤ 50%)</span>
              {totalLowStockCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {totalLowStockCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('CUSTOMERS')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                mainTab === 'CUSTOMERS'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers & Khata</span>
              {pendingCustomersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  {pendingCustomersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('ALL')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                mainTab === 'ALL'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Activity Feed</span>
            </button>
          </div>

          {/* Quick Scope Toggle in tab header */}
          <div className="flex items-center gap-1 pb-2 sm:pb-0">
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => {
                  setRetentionScope('10_DAYS');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  retentionScope === '10_DAYS'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Last 10 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setRetentionScope('ALL');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  retentionScope === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* Unified Filter Toolbar (Directly under tabs) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Left: Search & Contextual Sub-filters */}
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by customer, article, bill #..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Contextual Sub-Filter */}
            {mainTab === 'WASOOLI_BILLS' && (
              <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => handleWasooliBillsSubFilterChange('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    wasooliBillsSubFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({wasooliList.length + billsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleWasooliBillsSubFilterChange('WASOOLI')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    wasooliBillsSubFilter === 'WASOOLI'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                  <span>Wasooli ({wasooliList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleWasooliBillsSubFilterChange('BILLS')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    wasooliBillsSubFilter === 'BILLS'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Truck className="w-3 h-3 text-blue-500" />
                  <span>Bills ({billsList.length})</span>
                </button>
              </div>
            )}

            {mainTab === 'STOCK' && (
              <select
                value={stockSubFilter}
                onChange={e => handleStockSubFilterChange(e.target.value)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL_LOW">All Low Stock (≤ 50%) — {stockAlerts.length} Models</option>
                <option value="TIER_0">0% Out of Stock — {stockAlerts.filter(s => s.tier === 'TIER_0').length}</option>
                <option value="TIER_10">Below 10% Stock — {stockAlerts.filter(s => s.tier === 'TIER_10').length}</option>
                <option value="TIER_20">Below 20% Stock — {stockAlerts.filter(s => s.tier === 'TIER_20').length}</option>
                <option value="TIER_30">Below 30% Stock — {stockAlerts.filter(s => s.tier === 'TIER_30').length}</option>
                <option value="TIER_40">Below 40% Stock — {stockAlerts.filter(s => s.tier === 'TIER_40').length}</option>
                <option value="TIER_50">Below 50% Stock — {stockAlerts.filter(s => s.tier === 'TIER_50').length}</option>
              </select>
            )}

            {mainTab === 'CUSTOMERS' && (
              <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => handleCustomersSubFilterChange('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    customersSubFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({customers.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleCustomersSubFilterChange('OVERDUE')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    customersSubFilter === 'OVERDUE'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3 text-rose-500" />
                  <span>Overdue 10d+ ({overdueCustomersCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCustomersSubFilterChange('DUE')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    customersSubFilter === 'DUE'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pending Due ({pendingCustomersCount})
                </button>
                <button
                  type="button"
                  onClick={() => handleCustomersSubFilterChange('SETTLED')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    customersSubFilter === 'SETTLED'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Settled ({customers.length - pendingCustomersCount})
                </button>
              </div>
            )}

            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={e => {
                setSelectedCity(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Cities ({cities.length})</option>
              {cities.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Right: Active record counter */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-slate-800 dark:text-slate-200">
                {mainTab === 'WASOOLI_BILLS' ? filteredWasooliBills.length :
                 mainTab === 'STOCK' ? filteredStockAlerts.length :
                 mainTab === 'CUSTOMERS' ? filteredCustomerAlerts.length :
                 filteredTimeline.length}
              </strong> records
            </span>
          </div>
        </div>

        {/* 4. TAB CONTENT: WASOOLI & BILLS TABLE */}
        {mainTab === 'WASOOLI_BILLS' && (
          <div>
            <div className="overflow-x-auto min-h-[320px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="py-3.5 px-4 text-center w-12 whitespace-nowrap">#</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Type</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Challan / Bill #</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Customer / Shop Name</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">City</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Details / Description</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Amount (PKR)</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                  {filteredWasooliBills.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            No Wasooli or Bill records found matching the active filters.
                          </p>
                          {(searchTerm || selectedCity !== 'ALL' || wasooliBillsSubFilter !== 'ALL') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchTerm('');
                                setSelectedCity('ALL');
                                setWasooliBillsSubFilter('ALL');
                                setPage(1);
                              }}
                              className="mt-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reset Filters</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredWasooliBills
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((item, idx) => {
                        const isWasooli = item.type === 'WASOOLI';
                        const rowNumber = (page - 1) * pageSize + idx + 1;

                        return (
                          <tr 
                            key={item.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            {/* # Index */}
                            <td className="py-4 px-4 text-center text-slate-400 font-mono whitespace-nowrap">
                              {rowNumber}
                            </td>

                            {/* Type Badge */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              {isWasooli ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Wasooli Recv.</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60">
                                  <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span>Bill Dispatch</span>
                                </span>
                              )}
                            </td>

                            {/* Challan / Ref # */}
                            <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {isWasooli ? item.refNo : (item.challanNo ? `Bill #${item.challanNo}` : `Bill #${item.rawId}`)}
                            </td>

                            {/* Customer / Shop */}
                            <td className="py-4 px-4">
                              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                                {formatCustomerDisplayName(item.customerName)}
                              </div>
                            </td>

                            {/* City */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              {item.city ? (
                                <span className="text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{item.city}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Date & 10-Day Retention Badge */}
                            <td className="py-4 px-4 font-mono whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{item.date}</span>
                                {item.daysRemaining !== undefined && (
                                  <span className={`text-[10px] font-semibold ${
                                    item.daysRemaining <= 2 
                                      ? 'text-rose-600 dark:text-rose-400 font-bold' 
                                      : 'text-slate-400'
                                  }`}>
                                    {item.daysRemaining === 0 ? 'Purges today' : `${item.daysRemaining}d left in feed`}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Details / Maal Source */}
                            <td className="py-4 px-4">
                              {isWasooli ? (
                                <div className="space-y-0.5">
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {item.paymentMethod}
                                  </span>
                                  {item.notes && (
                                    <span className="text-slate-400 block text-xs truncate max-w-xs">
                                      {item.notes}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                                    <span>{item.isWithoutStock ? 'Direct Sale (Bina Stock)' : `${item.quantity.toLocaleString()} pcs`}</span>
                                    {item.articleName && (
                                      <span className="text-slate-500 font-normal">
                                        • {item.articleName}
                                      </span>
                                    )}
                                  </div>
                                  {item.notes && (
                                    <span className="text-slate-400 block text-xs truncate max-w-xs">
                                      {item.notes}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Amount (PKR) */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <span className={`font-mono font-bold text-sm ${
                                isWasooli 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : 'text-slate-900 dark:text-white'
                              }`}>
                                {isWasooli ? '+' : ''} Rs. {item.amount.toLocaleString()}
                              </span>
                            </td>

                            {/* Actions Column */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5 w-[140px] mx-auto">
                                {isWasooli ? (
                                  <button
                                    type="button"
                                    onClick={() => openCustomerStatementByNameOrId(item.customerName, item.customerId)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer group"
                                    title="Open Customer Khata Statement"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Khata Statement</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDispatchForBill(item.originalItem || item);
                                      }}
                                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
                                      title="View Bill Details"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Bill</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openCustomerStatementByNameOrId(item.customerName, item.customerId)}
                                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-all cursor-pointer"
                                      title="Open Customer Khata Statement"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                      <span>Khata</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalItems={filteredWasooliBills.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="transactions"
            />
          </div>
        )}

        {/* 5. TAB CONTENT: STOCK ALERTS (50% to 0%) TABLE */}
        {mainTab === 'STOCK' && (
          <div>
            <div className="overflow-x-auto min-h-[320px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="py-3.5 px-4 text-center w-12 whitespace-nowrap">#</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Article No</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Garment Name</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Category & Stuff</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Alert Level</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Current / Initial Stock</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Remaining %</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Sold (Pcs)</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Location</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                  {filteredStockAlerts.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            All Inventory Levels Healthy!
                          </p>
                          <p className="text-xs text-slate-400">
                            No articles matching this stock alert threshold.
                          </p>
                          {stockSubFilter !== 'ALL_LOW' && (
                            <button
                              type="button"
                              onClick={() => handleStockSubFilterChange('ALL_LOW')}
                              className="mt-1 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            >
                              Show All Low Stock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStockAlerts
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((alert, idx) => {
                        const rowNumber = (page - 1) * pageSize + idx + 1;
                        return (
                          <tr 
                            key={alert.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            {/* # Index */}
                            <td className="py-4 px-4 text-center text-slate-400 font-mono whitespace-nowrap">
                              {rowNumber}
                            </td>

                            {/* Article Code */}
                            <td className="py-4 px-4 font-mono font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                              {alert.articleNo}
                            </td>

                            {/* Article Name */}
                            <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {alert.articleName}
                            </td>

                            {/* Category & Fabric */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {alert.category}
                                </span>
                                {alert.stuff && (
                                  <span className="text-slate-400 text-xs">
                                    ({alert.stuff})
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Alert Level Badge */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${alert.badgeBg}`}>
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{alert.tierLabel}</span>
                              </span>
                            </td>

                            {/* Stock Remaining / Initial */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="font-mono font-bold text-slate-900 dark:text-white">
                                {alert.currentStock.toLocaleString()} <span className="text-slate-400 font-normal">/ {alert.initialStock.toLocaleString()} pcs</span>
                              </div>
                            </td>

                            {/* Remaining % Progress */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                                  <div 
                                    className={`h-full rounded-full ${alert.barBg}`}
                                    style={{ width: `${Math.max(5, alert.percent)}%` }}
                                  />
                                </div>
                                <span className="font-mono font-semibold text-xs text-slate-700 dark:text-slate-300">
                                  {alert.percent}%
                                </span>
                              </div>
                            </td>

                            {/* Sold */}
                            <td className="py-4 px-4 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {alert.totalOut.toLocaleString()} pcs
                            </td>

                            {/* Location */}
                            <td className="py-4 px-4 text-slate-500 text-xs whitespace-nowrap">
                              {alert.location}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const art = articles.find(a => a.articleNo === alert.articleNo);
                                    if (art) setSelectedArticleDetail(art);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="View Article Ledger"
                                >
                                  Ledger
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsNewPurchaseOpen(true)}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                                  title="Reorder Article Stock"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Reorder</span>
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

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalItems={filteredStockAlerts.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="articles"
            />
          </div>
        )}

        {/* 6. TAB CONTENT: CUSTOMERS TABLE */}
        {mainTab === 'CUSTOMERS' && (
          <div>
            <div className="overflow-x-auto min-h-[320px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="py-3.5 px-4 text-center w-12 whitespace-nowrap">#</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Shop / Firm Name</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Owner & Contact</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">City</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Dispatched Pcs</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Billed</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Wasooli Recv.</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Remaining Khata</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                  {filteredCustomerAlerts.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            No customer records found matching the active filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerAlerts
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((c, idx) => {
                        const rowNumber = (page - 1) * pageSize + idx + 1;
                        return (
                          <tr 
                            key={c.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            {/* # Index */}
                            <td className="py-4 px-4 text-center text-slate-400 font-mono whitespace-nowrap">
                              {rowNumber}
                            </td>

                            {/* Shop Name */}
                            <td className="py-4 px-4">
                              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                                {c.shopName}
                              </div>
                            </td>

                            {/* Owner & Contact */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {c.shopkeeperName || '—'}
                              </div>
                              {c.phone && (
                                <div className="text-xs text-slate-400 font-mono mt-0.5">
                                  {c.phone}
                                </div>
                              )}
                            </td>

                            {/* City */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{c.city}</span>
                              </span>
                            </td>

                            {/* Mal Sent */}
                            <td className="py-4 px-4 text-right font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {c.totalPiecesReceived.toLocaleString()} pcs
                            </td>

                            {/* Total Bill */}
                            <td className="py-4 px-4 text-right font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              Rs. {Math.round(c.totalBill).toLocaleString()}
                            </td>

                            {/* Payment Received */}
                            <td className="py-4 px-4 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              Rs. {Math.round(c.totalPaid).toLocaleString()}
                            </td>

                            {/* Remaining Khata */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              {c.isDue ? (
                                <span className="inline-block font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                                  Rs. {Math.round(c.remainingBalance).toLocaleString()}
                                </span>
                              ) : (
                                <span className="inline-block font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  Settled (Rs. 0)
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              {c.isOverdue ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                    <Clock className="w-3 h-3 text-rose-600" />
                                    <span>{c.daysPending}d Overdue</span>
                                  </span>
                                </div>
                              ) : c.isDue ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Balance Due</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Settled</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCustomerKhata(c.customer)}
                                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="View Full Khata Statement"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Statement</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomerForPayment(c.customer);
                                    setIsRecordCustomerPaymentOpen(true);
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                                  title="Receive Customer Payment"
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                  <span>+ Wasooli</span>
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

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalItems={filteredCustomerAlerts.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="customers"
            />
          </div>
        )}

        {/* 7. TAB CONTENT: ALL ANNOUNCEMENTS TABLE (UNIFIED LIVE FEED) */}
        {mainTab === 'ALL' && (
          <div>
            <div className="overflow-x-auto min-h-[320px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="py-3.5 px-4 text-center w-12 whitespace-nowrap">#</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Identifier / Ref</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Party / Article Description</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">City / Location</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Date / Severity</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Value / Amount</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                  {filteredTimeline.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center text-slate-400">
                        <p className="text-sm font-medium">No announcements found matching the criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTimeline
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((item, idx) => {
                        const rowNumber = (page - 1) * pageSize + idx + 1;

                        if (item.eventCategory === 'OVERDUE_PAYMENT') {
                          return (
                            <tr key={item.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 bg-rose-50/10 dark:bg-rose-950/10 transition-colors">
                              <td className="py-4 px-4 text-center text-slate-400 font-mono whitespace-nowrap">{rowNumber}</td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800">
                                  <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                  <span>{item.daysPending}d Overdue</span>
                                </span>
                              </td>
                              <td className="py-4 px-4 font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                Khata Reminder
                              </td>
                              <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                                {formatCustomerDisplayName(item.customerName)}
                                <span className="text-rose-600 dark:text-rose-400 font-normal block text-xs">
                                  No wasooli received for {item.daysPending} days
                                </span>
                              </td>
                              <td className="py-4 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {item.city || '—'}
                              </td>
                              <td className="py-4 px-4 font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                {item.daysPending} Days Overdue
                              </td>
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                                  Rs. {Math.round(item.amount).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-normal">Pending Balance</span>
                              </td>
                              <td className="py-4 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCustomerKhata(item.customer)}
                                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Khata</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomerForPayment(item.customer);
                                      setIsRecordCustomerPaymentOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                                  >
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>+ Wasooli</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        if (item.eventCategory === 'STOCK') {
                          return (
                            <tr key={item.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                              <td className="py-4 px-4 text-center text-slate-400 font-mono whitespace-nowrap">{rowNumber}</td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${item.badgeBg}`}>
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{item.tierLabel}</span>
                                </span>
                              </td>
                              <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {item.articleNo}
                              </td>
                              <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                                {item.articleName}
                                <span className="text-slate-400 font-normal ml-1.5 text-xs">({item.category} • {item.stuff})</span>
                              </td>
                              <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                                {item.location}
                              </td>
                              <td className="py-4 px-4 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                {item.urgency}
                              </td>
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  {item.currentStock.toLocaleString()} pcs
                                </span>
                                <span className="text-slate-400 text-xs ml-1 font-mono">({item.percent}%)</span>
                              </td>
                              <td className="py-4 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const art = articles.find(a => a.articleNo === item.articleNo);
                                      if (art) setSelectedArticleDetail(art);
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                  >
                                    Ledger
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsNewPurchaseOpen(true)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer shadow-2xs"
                                  >
                                    Reorder
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        if (item.eventCategory === 'WASOOLI') {
                          return (
                            <tr key={item.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                              <td className="py-4 px-4 text-center text-slate-400 font-mono whitespace-nowrap">{rowNumber}</td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
                                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Wasooli Recv.</span>
                                </span>
                              </td>
                              <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {item.refNo}
                              </td>
                              <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                                {formatCustomerDisplayName(item.customerName)}
                                {item.notes && <span className="text-slate-400 font-normal block text-xs">{item.notes}</span>}
                              </td>
                              <td className="py-4 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {item.city || '—'}
                              </td>
                              <td className="py-4 px-4 font-mono text-slate-500 whitespace-nowrap">
                                {item.date}
                              </td>
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                  + Rs. {item.amount.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center w-[140px] mx-auto">
                                  <button
                                    type="button"
                                    onClick={() => openCustomerStatementByNameOrId(item.customerName, item.customerId)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer group"
                                    title="Open Customer Khata Statement"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Khata Statement</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        if (item.eventCategory === 'BILL') {
                          return (
                            <tr key={item.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                              <td className="py-4 px-4 text-center text-slate-400 font-mono whitespace-nowrap">{rowNumber}</td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800">
                                  <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span>Bill Dispatch</span>
                                </span>
                              </td>
                              <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                Bill #{item.challanNo}
                              </td>
                              <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                                {formatCustomerDisplayName(item.customerName)}
                                <span className="text-slate-400 font-normal block text-xs">
                                  {item.isWithoutStock ? 'Direct Sale (Bina Stock)' : `${item.quantity.toLocaleString()} pcs • ${item.articleName}`}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {item.city || '—'}
                              </td>
                              <td className="py-4 px-4 font-mono text-slate-500 whitespace-nowrap">
                                {item.date}
                              </td>
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                  Rs. {item.amount.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5 w-[140px] mx-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDispatchForBill(item.originalItem || item);
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
                                    title="View Bill Details"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Bill</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openCustomerStatementByNameOrId(item.customerName, item.customerId)}
                                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-all cursor-pointer"
                                    title="Open Customer Khata Statement"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>Khata</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return null;
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalItems={filteredTimeline.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="announcements"
            />
          </div>
        )}

      </div>

    </div>
  );
};
