import React, { useState, useMemo } from 'react';
import {
  X,
  Wallet,
  Users,
  Receipt,
  Search,
  Filter,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Building2,
  Phone,
  CheckCircle2,
  Download,
  CreditCard,
  Banknote,
  DollarSign
} from 'lucide-react';

export const WasooliBreakdownModal = ({
  isOpen,
  onClose,
  timeframeLabel = 'All-Time',
  incomeEntries = [],
  customers = [],
  onSelectCustomerKhata
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('CUSTOMERS'); // 'CUSTOMERS' or 'ALL_ENTRIES'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [expandedCustId, setExpandedCustId] = useState(null);

  // Customer Map for rapid info enrichment
  const custMap = useMemo(() => {
    return new Map((customers || []).map(c => [c.id, c]));
  }, [customers]);

  // Enriched Income Entries
  const enrichedEntries = useMemo(() => {
    return (incomeEntries || []).map((entry, idx) => {
      const cust = entry.customerId ? custMap.get(entry.customerId) : null;
      const displayName = cust
        ? (cust.shopName ? `${cust.shopName}${cust.shopkeeperName ? ` (${cust.shopkeeperName})` : ''}` : cust.shopkeeperName)
        : (entry.customerName || 'Customer');
      const city = cust?.city || entry.city || '—';
      const phone = cust?.phone || entry.phone || '';

      return {
        ...entry,
        sn: idx + 1,
        displayName,
        shopName: cust?.shopName || entry.customerName || 'Customer',
        shopkeeperName: cust?.shopkeeperName || '',
        city,
        phone,
        customerObj: cust
      };
    });
  }, [incomeEntries, custMap]);

  // Distinct cities for filter dropdown
  const availableCities = useMemo(() => {
    const set = new Set();
    enrichedEntries.forEach(e => {
      if (e.city && e.city !== '—') set.add(e.city.trim());
    });
    return Array.from(set).sort();
  }, [enrichedEntries]);

  // Filtered by Search & City
  const filteredEntries = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return enrichedEntries.filter(e => {
      if (selectedCity !== 'ALL' && e.city?.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      const matchName = e.displayName?.toLowerCase().includes(q);
      const matchCity = e.city?.toLowerCase().includes(q);
      const matchRef = e.refNo?.toLowerCase().includes(q);
      const matchMethod = e.paymentMethod?.toLowerCase().includes(q);
      const matchNotes = e.notes?.toLowerCase().includes(q);
      const matchAmount = String(e.amount).includes(q);
      return matchName || matchCity || matchRef || matchMethod || matchNotes || matchAmount;
    });
  }, [enrichedEntries, searchTerm, selectedCity]);

  // Grouped by Customer (Bandon ke Hisaab se)
  const customerSummary = useMemo(() => {
    const groups = {};

    filteredEntries.forEach(entry => {
      const key = entry.customerId ? `id-${entry.customerId}` : `name-${entry.displayName}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          customerId: entry.customerId,
          customerObj: entry.customerObj,
          displayName: entry.displayName,
          shopName: entry.shopName,
          shopkeeperName: entry.shopkeeperName,
          city: entry.city,
          phone: entry.phone,
          totalAmount: 0,
          entriesCount: 0,
          entries: [],
          lastDate: entry.date
        };
      }
      groups[key].totalAmount += Number(entry.amount) || 0;
      groups[key].entriesCount += 1;
      groups[key].entries.push(entry);
      if (!groups[key].lastDate || new Date(entry.date) > new Date(groups[key].lastDate)) {
        groups[key].lastDate = entry.date;
      }
    });

    return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredEntries]);

  // Overall Financial Totals
  const totalIncome = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredEntries]);

  const uniquePersonsCount = customerSummary.length;
  const totalReceiptsCount = filteredEntries.length;

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
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
              <Wallet className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Wasooli & Income Breakdown
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {timeframeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kis kis bande / dukan se kitni wasooli aayi hai uski mukammal tafseel
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* KPI 1: Kul Wasooli */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kul Wasooli (Total Income)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                Rs. {Math.round(totalIncome).toLocaleString('en-US')}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Cash, Bank & Advance Received
              </span>
            </div>

            {/* KPI 2: Bandon Ki Tadaad */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Kitne Bando Se Wasooli Hui
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                {uniquePersonsCount} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans">Buyers / Shops</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Different accounts paying in this period
              </span>
            </div>

            {/* KPI 3: Receipts Count */}
            <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kul Wasooli Receipts
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {totalReceiptsCount} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans">Entries</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Avg. Rs. {uniquePersonsCount > 0 ? Math.round(totalIncome / uniquePersonsCount).toLocaleString() : 0} per buyer
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
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bando Ke Hisaab Se (Summary)</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {uniquePersonsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALL_ENTRIES')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ALL_ENTRIES'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Mukammal Wasooli List</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                {totalReceiptsCount}
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
                placeholder="Search customer, shop, receipt #..."
                className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Wallet className="w-10 h-10 mx-auto mb-2.5 opacity-40" />
              <p className="text-sm font-semibold">Koi Wasooli Record Nahi Mila</p>
              <p className="text-xs mt-0.5">Is muddat ya search filter k mutabiq koi payment entry nahi hai.</p>
            </div>
          ) : activeTab === 'CUSTOMERS' ? (
            /* TAB 1: Bandon Ke Hisaab Se */
            <div className="space-y-3">
              {customerSummary.map((group, idx) => {
                const isExpanded = expandedCustId === group.key;

                return (
                  <div
                    key={group.key}
                    className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
                  >
                    {/* Customer Row Header */}
                    <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
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
                            <span>{group.entriesCount} Wasooli Receipt{group.entriesCount > 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>Aakhri Wasooli: {group.lastDate || '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                            Kul Wasool Shuda
                          </span>
                          <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            Rs. {Math.round(group.totalAmount).toLocaleString('en-US')}
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
                            <span>View Challans ({group.entriesCount})</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Receipt Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 p-3 sm:p-4">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          {group.displayName} Ki Tamam Wasooli Entries:
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                                <th className="pb-2">Date</th>
                                <th className="pb-2">Receipt / Ref #</th>
                                <th className="pb-2">Payment Method</th>
                                <th className="pb-2">Notes / Remarks</th>
                                <th className="pb-2 text-right">Amount (PKR)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {group.entries.map((ent, rIdx) => (
                                <tr key={ent.id || rIdx} className="text-slate-700 dark:text-slate-300">
                                  <td className="py-2 font-mono">{ent.date || '—'}</td>
                                  <td className="py-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {ent.refNo || `REC-${ent.id}`}
                                  </td>
                                  <td className="py-2">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                      {ent.paymentMethod || 'Cash'}
                                    </span>
                                  </td>
                                  <td className="py-2 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                    {ent.notes || '—'}
                                  </td>
                                  <td className="py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    Rs. {Math.round(ent.amount).toLocaleString('en-US')}
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
          ) : (
            /* TAB 2: Mukammal Wasooli List */
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">#</th>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5">Receipt #</th>
                    <th className="py-3 px-3.5">Customer / Shop Name</th>
                    <th className="py-3 px-3.5">City</th>
                    <th className="py-3 px-3.5">Method</th>
                    <th className="py-3 px-3.5">Notes</th>
                    <th className="py-3 px-3.5 text-right">Amount (PKR)</th>
                    <th className="py-3 px-3.5 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredEntries.map((ent, idx) => (
                    <tr
                      key={ent.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {ent.date || '—'}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {ent.refNo || `REC-${ent.id}`}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        {ent.displayName}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {ent.city || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {ent.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {ent.notes || '—'}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        Rs. {Math.round(ent.amount).toLocaleString('en-US')}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {ent.customerObj && typeof onSelectCustomerKhata === 'function' ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCustomerKhata(ent.customerObj);
                              onClose();
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-semibold text-[11px] cursor-pointer"
                          >
                            Khata
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td colSpan="7" className="py-3 px-3.5 text-right text-slate-900 dark:text-white">
                      Grand Total ({filteredEntries.length} Receipts):
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      Rs. {Math.round(totalIncome).toLocaleString('en-US')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* 5. Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredEntries.length} entries across {uniquePersonsCount} buyer accounts
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

