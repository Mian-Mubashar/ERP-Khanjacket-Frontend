import React, { useState, useMemo } from 'react';
import {
  X,
  Truck,
  Package,
  Users,
  Search,
  Filter,
  FileText,
  Eye,
  Calendar,
  Building2,
  Phone,
  ChevronDown,
  ChevronUp,
  Receipt,
  Download
} from 'lucide-react';

export const ChallansBreakdownModal = ({
  isOpen,
  onClose,
  timeframeLabel = 'All-Time',
  challansList = [],
  customers = [],
  onSelectDispatchForBill,
  onSelectCustomerKhata
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('ALL_CHALLANS'); // 'ALL_CHALLANS' or 'BY_CUSTOMER'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [expandedCustId, setExpandedCustId] = useState(null);

  // Customer Map for rapid enrichment
  const custMap = useMemo(() => {
    return new Map((customers || []).map(c => [c.id, c]));
  }, [customers]);

  // Enriched Challan Entries
  const enrichedChallans = useMemo(() => {
    return (challansList || []).map((ch, idx) => {
      const cust = ch.customerId ? custMap.get(ch.customerId) : null;
      const displayName = cust
        ? (cust.shopName ? `${cust.shopName}${cust.shopkeeperName ? ` (${cust.shopkeeperName})` : ''}` : cust.shopkeeperName)
        : (ch.customerName || 'Customer');
      const city = cust?.city || ch.city || ch.destination || '—';
      const phone = cust?.phone || ch.phone || '';
      const totalAmount = Number(ch.totalSaleAmount) || ((Number(ch.quantity) || 0) * (Number(ch.unitSalePrice) || 0));
      const paidAmt = Number(ch.paidAmount) || 0;
      const remainingDue = Math.max(0, totalAmount - paidAmt);

      return {
        ...ch,
        sn: idx + 1,
        displayName,
        shopName: cust?.shopName || ch.customerName || 'Customer',
        shopkeeperName: cust?.shopkeeperName || '',
        city,
        phone,
        calculatedTotal: totalAmount,
        paidAmt,
        remainingDue,
        customerObj: cust
      };
    });
  }, [challansList, custMap]);

  // Available Cities
  const availableCities = useMemo(() => {
    const set = new Set();
    enrichedChallans.forEach(ch => {
      if (ch.city && ch.city !== '—') set.add(ch.city.trim());
    });
    return Array.from(set).sort();
  }, [enrichedChallans]);

  // Filtered Challans
  const filteredChallans = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return enrichedChallans.filter(ch => {
      if (selectedCity !== 'ALL' && ch.city?.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      const matchChallan = String(ch.challanNo || '').toLowerCase().includes(q);
      const matchGatePass = String(ch.gatePassNo || '').toLowerCase().includes(q);
      const matchName = ch.displayName?.toLowerCase().includes(q);
      const matchCity = ch.city?.toLowerCase().includes(q);
      const matchArticle = (ch.articleNo || ch.articleName || '').toLowerCase().includes(q);
      const matchNotes = (ch.notes || '').toLowerCase().includes(q);
      return matchChallan || matchGatePass || matchName || matchCity || matchArticle || matchNotes;
    });
  }, [enrichedChallans, searchTerm, selectedCity]);

  // Grouped by Customer (Bandon ke Hisaab se)
  const customerSummary = useMemo(() => {
    const groups = {};

    filteredChallans.forEach(ch => {
      const key = ch.customerId ? `id-${ch.customerId}` : `name-${ch.displayName}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          customerId: ch.customerId,
          customerObj: ch.customerObj,
          displayName: ch.displayName,
          shopName: ch.shopName,
          shopkeeperName: ch.shopkeeperName,
          city: ch.city,
          phone: ch.phone,
          totalPieces: 0,
          totalBill: 0,
          totalPaid: 0,
          challansCount: 0,
          challans: [],
          lastDate: ch.date
        };
      }
      groups[key].totalPieces += Number(ch.quantity) || 0;
      groups[key].totalBill += Number(ch.calculatedTotal) || 0;
      groups[key].totalPaid += Number(ch.paidAmt) || 0;
      groups[key].challansCount += 1;
      groups[key].challans.push(ch);
      if (!groups[key].lastDate || new Date(ch.date) > new Date(groups[key].lastDate)) {
        groups[key].lastDate = ch.date;
      }
    });

    return Object.values(groups).sort((a, b) => b.totalBill - a.totalBill);
  }, [filteredChallans]);

  // Totals
  const totalChallansCount = filteredChallans.length;
  const totalPiecesSent = filteredChallans.reduce((sum, ch) => sum + (Number(ch.quantity) || 0), 0);
  const totalBilledAmount = filteredChallans.reduce((sum, ch) => sum + (Number(ch.calculatedTotal) || 0), 0);
  const uniqueBuyersCount = customerSummary.length;

  const toggleExpand = (key) => {
    setExpandedCustId(prev => (prev === key ? null : key));
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
              <Truck className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Maal Rawangi & Challans Breakdown
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {timeframeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kitna maal bheja gaya hai aur kitne challan kis customer k naam banay hain
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Top Metric KPI Cards */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            {/* KPI 1: Challans Count */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kitne Challan Howay
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                {totalChallansCount} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans">Challans</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Total gate passes & dispatches
              </span>
            </div>

            {/* KPI 2: Total Pieces */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kul Maal (Pieces Sent)
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {Math.round(totalPiecesSent).toLocaleString('en-US')} <span className="text-sm font-semibold text-slate-500 font-sans">pcs</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Warehouse stock reduced
              </span>
            </div>

            {/* KPI 3: Total Billed */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kul Billed Sale (PKR)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                Rs. {Math.round(totalBilledAmount).toLocaleString('en-US')}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Total wholesale bill value
              </span>
            </div>

            {/* KPI 4: Customers Count */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kitne Bandon Ko Maal Bheja
              </span>
              <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                {uniqueBuyersCount} <span className="text-sm font-semibold text-slate-500 font-sans">Shops</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Unique buyers in this period
              </span>
            </div>
          </div>
        </div>

        {/* 3. Filter Bar & Tab Navigation */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('ALL_CHALLANS')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ALL_CHALLANS'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tamam Challans List</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {totalChallansCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BY_CUSTOMER')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'BY_CUSTOMER'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bando Ke Hisaab Se</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                {uniqueBuyersCount}
              </span>
            </button>
          </div>

          {/* Search & City Filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search challan #, customer, city, article..."
                className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {availableCities.length > 1 && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Cities ({availableCities.length})</option>
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 4. Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredChallans.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Truck className="w-10 h-10 mx-auto mb-2.5 opacity-40" />
              <p className="text-sm font-semibold">Koi Challan Record Nahi Mila</p>
              <p className="text-xs mt-0.5">Is timeframe ya search filter k mutabiq koi dispatch record nahi hai.</p>
            </div>
          ) : activeTab === 'ALL_CHALLANS' ? (
            /* TAB 1: Tamam Challans List */
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">#</th>
                    <th className="py-3 px-3.5">Challan #</th>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5">Customer / Shop Name</th>
                    <th className="py-3 px-3.5">City</th>
                    <th className="py-3 px-3.5">Article / Maal</th>
                    <th className="py-3 px-3.5 text-right">Quantity</th>
                    <th className="py-3 px-3.5 text-right">Total Bill</th>
                    <th className="py-3 px-3.5 text-right">Paid</th>
                    <th className="py-3 px-3.5 text-right">Remaining Due</th>
                    <th className="py-3 px-3.5 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredChallans.map((ch, idx) => (
                    <tr
                      key={ch.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        #{ch.challanNo || ch.id}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {ch.date || '—'}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        {ch.displayName}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {ch.city || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {ch.articleNo || '—'}
                        </span>
                        {ch.articleName && ch.articleName !== ch.articleNo && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                            {ch.articleName}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {ch.quantity?.toLocaleString() || 0} pcs
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        Rs. {Math.round(ch.calculatedTotal).toLocaleString('en-US')}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {ch.paidAmt > 0 ? `Rs. ${Math.round(ch.paidAmt).toLocaleString('en-US')}` : '—'}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {ch.remainingDue > 0 ? `Rs. ${Math.round(ch.remainingDue).toLocaleString('en-US')}` : 'Settled'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {typeof onSelectDispatchForBill === 'function' && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectDispatchForBill(ch);
                                onClose();
                              }}
                              className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold rounded-md border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              title="Challan ka mukammal Bill voucher dekhein"
                            >
                              Bill
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td colSpan="6" className="py-3 px-3.5 text-right text-slate-900 dark:text-white">
                      Grand Total ({filteredChallans.length} Challans):
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-900 dark:text-white">
                      {Math.round(totalPiecesSent).toLocaleString('en-US')} pcs
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      Rs. {Math.round(totalBilledAmount).toLocaleString('en-US')}
                    </td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* TAB 2: Bandon Ke Hisaab Se */
            <div className="space-y-3">
              {customerSummary.map((group, idx) => {
                const isExpanded = expandedCustId === group.key;

                return (
                  <div
                    key={group.key}
                    className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
                  >
                    {/* Header Row */}
                    <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {group.displayName}
                            </span>
                            {group.city && group.city !== '—' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {group.city}
                              </span>
                            )}
                            {group.phone && (
                              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {group.phone}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{group.challansCount} Challan{group.challansCount > 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {Math.round(group.totalPieces).toLocaleString('en-US')} pcs maal
                            </span>
                            <span>•</span>
                            <span>Aakhri Challan: {group.lastDate || '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                            Kul Billed Maal
                          </span>
                          <span className="text-base sm:text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                            Rs. {Math.round(group.totalBill).toLocaleString('en-US')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {group.customerObj && typeof onSelectCustomerKhata === 'function' && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectCustomerKhata(group.customerObj);
                                onClose();
                              }}
                              className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg border border-blue-200/80 dark:border-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Customer ka mukammal Khata / Statement kholein"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Khata</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleExpand(group.key)}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Tafseel ({group.challansCount})</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Challan Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 p-3 sm:p-4">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          {group.displayName} Ke Tamam Challans:
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                                <th className="pb-2">Challan #</th>
                                <th className="pb-2">Date</th>
                                <th className="pb-2">Article / Maal</th>
                                <th className="pb-2 text-right">Quantity</th>
                                <th className="pb-2 text-right">Total Bill</th>
                                <th className="pb-2 text-right">Paid</th>
                                <th className="pb-2 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {group.challans.map((ch, cIdx) => (
                                <tr key={ch.id || cIdx} className="text-slate-700 dark:text-slate-300">
                                  <td className="py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    #{ch.challanNo || ch.id}
                                  </td>
                                  <td className="py-2 font-mono">{ch.date || '—'}</td>
                                  <td className="py-2 font-semibold">
                                    {ch.articleNo || '—'}
                                  </td>
                                  <td className="py-2 text-right font-mono font-bold">
                                    {ch.quantity?.toLocaleString() || 0} pcs
                                  </td>
                                  <td className="py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    Rs. {Math.round(ch.calculatedTotal).toLocaleString('en-US')}
                                  </td>
                                  <td className="py-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {ch.paidAmt > 0 ? `Rs. ${Math.round(ch.paidAmt).toLocaleString('en-US')}` : '—'}
                                  </td>
                                  <td className="py-2 text-center">
                                    {typeof onSelectDispatchForBill === 'function' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onSelectDispatchForBill(ch);
                                          onClose();
                                        }}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold text-[11px] cursor-pointer"
                                      >
                                        View Bill
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredChallans.length} challans across {uniqueBuyersCount} buyer accounts
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

