import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Bell,
  GitFork,
  Users,
  Shirt,
  Ship,
  Truck,
  Building2,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Warehouse,
  ReceiptText,
  Anchor,
  User
} from 'lucide-react';
import iconLogoImg from '../../images/khan jacket icon logo.png';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { 
    articles, 
    suppliers, 
    purchases,
    clearances = [],
    cities,
    customers,
    sidebarCollapsed,
    securitySubTab,
    setSecuritySubTab,
    announcementsSubTab,
    setAnnouncementsSubTab
  } = useApp();

  // All menu sections are CLOSED by default as requested: "by default ya menu drop down na rhe means band rhe, click per dropdown ho"
  const [expandedSections, setExpandedSections] = useState({
    branches: false,
    customers: false,
    articles: false,
    purchases: false,
    clearance: false,
    outward: false,
    suppliers: false,
    reports: false,
    announcements: false,
    security: false,
    ugrahi: false
  });

  const toggleSection = (key) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const totalStock = articles.reduce((sum, a) => sum + (Number(a.currentStock) || 0), 0);

  const lowStockCount = articles.filter(a => {
    const init = Number(a.totalPurchased) > 0 
      ? Number(a.totalPurchased) 
      : ((Number(a.currentStock) || 0) + (Number(a.totalOut) || 0));
    const curr = Number(a.currentStock) || 0;
    const pct = init > 0 ? (curr / init) * 100 : 0;
    return pct <= 50;
  }).length;

  if (sidebarCollapsed) {
    return (
      <aside className="w-18 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] items-center py-4 space-y-2.5 transition-all">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="w-11 h-11 flex items-center justify-center mb-1 cursor-pointer hover:opacity-80 transition-opacity"
          title="Khan Jacket House"
        >
          <img src={iconLogoImg} alt="Khan Jacket House" className="w-auto h-9 object-contain" />
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'dashboard' 
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'branches' 
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Branches / Cities"
        >
          <GitFork className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'customers' 
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Customers / Shopkeepers"
        >
          <Users className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'articles' 
              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Articles & Stock (Jackets, Fabrics)"
        >
          <Shirt className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'purchases' 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="China Purchases & Invoices"
        >
          <Ship className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('clearance')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'clearance' 
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Khan Traders Clearance"
        >
          <Anchor className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('outward')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'outward' 
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Stock Outward Dispatches"
        >
          <Truck className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'suppliers' 
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="China Suppliers / Vendors"
        >
          <Building2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('payment-collection')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'payment-collection' || activeTab === 'ugrahi'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Payment Collection"
        >
          <ReceiptText className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'reports' 
              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Reports & Analytics"
        >
          <BarChart3 className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'announcements' 
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Announcements & Alerts"
        >
          <Bell className="w-5 h-5 text-amber-500" />
          {lowStockCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'security' 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Security & Mobile Devices"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'profile' 
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Profile"
        >
          <User className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] transition-colors">
      
      {/* Sidebar Top Section Label (Matches Reference Screenshot "DASHBOARD" style: clean, small, subtle) */}
      <div className="px-5 pt-5 pb-3">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
          DASHBOARD
        </span>
      </div>

      {/* Navigation List - Clean, elegant font weight (font-medium, not bold) */}
      <div className="px-3 space-y-1 flex-1 overflow-y-auto">
        
        {/* 1. Dashboard Overview */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer group ${
            activeTab === 'dashboard'
              ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium border border-blue-200/50 dark:border-blue-900/40 shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
          }`}
        >
          <LayoutDashboard className={`w-4.5 h-4.5 ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
          <span>Dashboard</span>
        </button>

        {/* 2. Branches / Cities (Matching reference screenshot: Branches with dropdown) */}
        <div>
          <button
            onClick={() => toggleSection('branches')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'branches'
                ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <GitFork className={`w-4.5 h-4.5 ${activeTab === 'branches' ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500'}`} />
              <span>Branches (Shehar)</span>
            </div>
            {expandedSections.branches ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.branches && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => setActiveTab('branches')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'branches'
                    ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>View All</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {cities.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Customers / Shopkeepers (With Ledgers & Payments) */}
        <div>
          <button
            onClick={() => toggleSection('customers')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'customers'
                ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500" />
              <span>Customers</span>
            </div>
            {expandedSections.customers ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.customers && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => setActiveTab('customers')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'customers'
                    ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Shopkeepers & Khata</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {customers.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 4. China Suppliers / Vendors */}
        <div>
          <button
            onClick={() => toggleSection('suppliers')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'suppliers'
                ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:text-amber-500" />
              <span>Vendors (China Factory)</span>
            </div>
            {expandedSections.suppliers ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.suppliers && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'suppliers'
                    ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Vendor Accounts</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {suppliers.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Items & Garment Articles (With Jacket Stuff management) */}
        <div>
          <button
            onClick={() => toggleSection('articles')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'articles'
                ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <Shirt className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:text-purple-500" />
              <span>Articles (Garments)</span>
            </div>
            {expandedSections.articles ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.articles && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => setActiveTab('articles')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'articles'
                    ? 'text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>Stock Register</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {articles.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 6. China Purchases */}
        <div>
          <button
            onClick={() => toggleSection('purchases')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'purchases'
                ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <Ship className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:text-emerald-500" />
              <span>China Purchases</span>
            </div>
            {expandedSections.purchases ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.purchases && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => setActiveTab('purchases')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'purchases'
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Import Invoices</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {purchases.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 7. Khan Traders Clearance */}
        <div>
          <button
            onClick={() => {
              toggleSection('clearance');
              setActiveTab('clearance');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'clearance'
                ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Anchor className={`w-4.5 h-4.5 shrink-0 ${activeTab === 'clearance' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-500'}`} />
              <span className="whitespace-nowrap truncate text-sm">Khan Traders Clearance</span>
            </div>
            {expandedSections.clearance ? (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.clearance && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => setActiveTab('clearance')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'clearance'
                    ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Duty & Clearance Bills</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {clearances.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 7. Stock Outward (Dispatches to Shops) */}
        <div>
          <button
            onClick={() => toggleSection('outward')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'outward'
                ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:text-rose-500" />
              <span>Outward (Maal Rawangi)</span>
            </div>
            {expandedSections.outward ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.outward && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => setActiveTab('outward')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'outward'
                    ? 'text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>All Dispatches</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 8. Payment Collection */}
        <div>
          <button
            onClick={() => toggleSection('ugrahi')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'payment-collection' || activeTab === 'ugrahi'
                ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <ReceiptText className={`w-4.5 h-4.5 ${(activeTab === 'payment-collection' || activeTab === 'ugrahi') ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-500'}`} />
              <span>Payment Collection</span>
            </div>

            {expandedSections.ugrahi ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.ugrahi && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => setActiveTab('payment-collection')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'payment-collection' || activeTab === 'ugrahi'
                    ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Collection Sheets</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 9. Reports & Analytics */}
        <div>
          <button
            onClick={() => toggleSection('reports')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'reports'
                ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:text-cyan-500" />
              <span>Reports (Hisaab Kitaab)</span>
            </div>
            {expandedSections.reports ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.reports && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'reports'
                    ? 'text-cyan-600 dark:text-cyan-400 font-medium bg-cyan-50 dark:bg-cyan-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>Stock & Balance Report</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 9B. Announcements & Alerts (2nd Last Menu Item with Submenu) */}
        <div>
          <button
            onClick={() => {
              toggleSection('announcements');
              setActiveTab('announcements');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'announcements'
                ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50/50 dark:bg-amber-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className={`w-4.5 h-4.5 ${activeTab === 'announcements' ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400 group-hover:text-amber-500'}`} />
              <span>Announcements</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white font-mono">
                  {lowStockCount}
                </span>
              )}
              {expandedSections.announcements ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {expandedSections.announcements && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => {
                  setAnnouncementsSubTab('WASOOLI_BILLS');
                  setActiveTab('announcements');
                }}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'announcements' && announcementsSubTab === 'WASOOLI_BILLS'
                    ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'announcements' && announcementsSubTab === 'WASOOLI_BILLS' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span>Wasooli & Bills</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setAnnouncementsSubTab('STOCK');
                  setActiveTab('announcements');
                }}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'announcements' && announcementsSubTab === 'STOCK'
                    ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'announcements' && announcementsSubTab === 'STOCK' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span>Stock Alerts (50% to 0%)</span>
                </div>
                {lowStockCount > 0 && (
                  <span className="text-[10px] font-bold text-amber-600 font-mono">
                    {lowStockCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setAnnouncementsSubTab('CUSTOMERS');
                  setActiveTab('announcements');
                }}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'announcements' && announcementsSubTab === 'CUSTOMERS'
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'announcements' && announcementsSubTab === 'CUSTOMERS' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span>Customers & Khata</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setAnnouncementsSubTab('ALL');
                  setActiveTab('announcements');
                }}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'announcements' && announcementsSubTab === 'ALL'
                    ? 'text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'announcements' && announcementsSubTab === 'ALL' ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span>All Announcements</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 10. Security & Access */}
        <div>
          <button
            onClick={() => {
              toggleSection('security');
              setActiveTab('security');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${
              activeTab === 'security'
                ? 'text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50/50 dark:bg-emerald-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-4.5 h-4.5 ${activeTab === 'security' ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-500'}`} />
              <span>Security (Mobiles)</span>
            </div>
            {expandedSections.security ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.security && (
            <div className="pl-9 pr-2 py-1 space-y-0.5">
              <button
                onClick={() => {
                  setSecuritySubTab('devices');
                  setActiveTab('security');
                }}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'security' && securitySubTab === 'devices'
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'security' && securitySubTab === 'devices' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span>Authorized Mobiles</span>
                </div>
              </button>
              <button
                onClick={() => {
                  setSecuritySubTab('audit');
                  setActiveTab('security');
                }}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'security' && securitySubTab === 'audit'
                    ? 'text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'security' && securitySubTab === 'audit' ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span>Audit Trail</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 13. Profile */}
        <div>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer group ${
              activeTab === 'profile'
                ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium border border-blue-200/50 dark:border-blue-900/40 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
            }`}
          >
            <div className="flex items-center gap-3">
              <User className={`w-4.5 h-4.5 ${activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600'}`} />
              <span>Profile</span>
            </div>
          </button>
        </div>

      </div>

      {/* Bottom Live Stock Summary */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">Total Stock</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              LIVE
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xl font-semibold font-mono text-slate-900 dark:text-white">
              {totalStock.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">Pcs in Stock</span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Khan Jacket House</span>
            <span className="font-mono text-slate-400">Warehouse ERP</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
