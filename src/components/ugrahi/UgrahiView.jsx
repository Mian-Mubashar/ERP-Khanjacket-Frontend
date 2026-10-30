import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ReceiptText,
  Plus,
  Printer,
  Download,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Calendar,
  User,
  MapPin,
  Building2,
  FolderOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { showToast, confirmDelete, showError } from '../../utils/sweetalert';
import { downloadUgrahiSheetPDF } from '../../utils/pdfGenerator';

export const UgrahiView = () => {
  const { customers = [], cities = [], currentUser } = useApp();

  // Sheet Meta
  const [sheetTitle, setSheetTitle] = useState('Lahore Market Collection Sheet');
  const [sheetDate, setSheetDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectorName, setCollectorName] = useState(currentUser?.name || 'Tariq Mehmood');
  const [routeLocation, setRouteLocation] = useState('Lahore Wholesale Market');
  const [selectedCity, setSelectedCity] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  // Initial Rows Data
  const [rows, setRows] = useState(() => {
    const saved = localStorage.getItem('kc_active_collection_rows');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: 'row-1', name: 'Al-Madina Garments (Mian Zahid)', address: 'Anarkali Bazaar, Lahore', totalDue: 185000, wasool: '' },
      { id: 'row-2', name: 'Habib Clothes (Habib Ullah)', address: 'Thokar Niaz Baig, Lahore', totalDue: 140000, wasool: '' },
      { id: 'row-3', name: 'Khan Garments (Malik Tariq)', address: 'Raja Bazaar, Rawalpindi', totalDue: 260000, wasool: '' },
      { id: 'row-4', name: 'VIP Clothe House (Hanif)', address: 'Shahdra, Lahore', totalDue: 318000, wasool: '' }
    ];
  });

  // Saved Sheets Library
  const [savedSheets, setSavedSheets] = useState(() => {
    const saved = localStorage.getItem('kc_saved_collection_sheets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);

  // Persist active rows
  useEffect(() => {
    localStorage.setItem('kc_active_collection_rows', JSON.stringify(rows));
  }, [rows]);

  // Persist saved sheets library
  useEffect(() => {
    localStorage.setItem('kc_saved_collection_sheets', JSON.stringify(savedSheets));
  }, [savedSheets]);

  // Calculations
  const totalOutstanding = rows.reduce((s, r) => s + (Number(r.totalDue) || 0), 0);
  const totalCollected = rows.reduce((s, r) => s + (Number(r.wasool) || 0), 0);
  const remainingBalance = totalOutstanding - totalCollected;

  // Filtered rows for search
  const displayedRows = rows.filter(r => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return (
      (r.name || '').toLowerCase().includes(q) ||
      (r.address || '').toLowerCase().includes(q)
    );
  });

  // Add Empty Row
  const handleAddRow = () => {
    const newRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      address: '',
      totalDue: '',
      wasool: ''
    };
    setRows(prev => [...prev, newRow]);
  };

  // Update specific field in row
  const handleRowChange = (id, field, value) => {
    setRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        return { ...r, [field]: value };
      })
    );
  };

  // Select Customer from existing customer database
  const handleSelectCustomer = (id, customerId) => {
    const found = customers.find(c => c.id === customerId);
    if (!found) return;

    setRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        return {
          ...r,
          name: `${found.shopName} ${found.shopkeeperName ? `(${found.shopkeeperName})` : ''}`,
          address: found.marketAddress ? `${found.marketAddress}, ${found.city}` : found.city || '',
          totalDue: found.remainingBalance || 0,
          customerId: found.id
        };
      })
    );
  };

  // Remove Row
  const handleRemoveRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Auto-Load All Customers of a Selected City (e.g. Lahore, Rawalpindi)
  const handleLoadCityCustomers = (cityName) => {
    setSelectedCity(cityName);
    if (!cityName) return;

    const cityCustomers = customers.filter(
      c => (c.city || '').toLowerCase() === cityName.toLowerCase()
    );

    if (cityCustomers.length === 0) {
      showError('No Customers Found', `No registered customers found in ${cityName}.`);
      return;
    }

    const loadedRows = cityCustomers.map((c, i) => ({
      id: `city-cust-${c.id}-${i}-${Date.now()}`,
      name: `${c.shopName} ${c.shopkeeperName ? `(${c.shopkeeperName})` : ''}`,
      address: c.marketAddress ? `${c.marketAddress}, ${c.city}` : c.city || cityName,
      totalDue: c.remainingBalance || 0,
      wasool: '',
      customerId: c.id
    }));

    setRows(loadedRows);
    setSheetTitle(`${cityName} Collection Sheet`);
    setRouteLocation(`${cityName} Wholesale Market`);
    showToast(`Loaded ${loadedRows.length} customers from ${cityName}!`, 'success');
  };

  // Reset to New Fresh Sheet
  const handleNewSheet = async () => {
    const ok = await confirmDelete({
      title: 'Create New Blank Sheet?',
      text: 'This will reset the current table and start a new collection sheet.',
      confirmButtonText: 'Yes, New Sheet'
    });
    if (ok) {
      setRows([
        { id: `row-${Date.now()}-1`, name: '', address: '', totalDue: '', wasool: '' }
      ]);
      setSheetTitle('Daily Collection Sheet');
      setRouteLocation('City Market');
      setSelectedCity('');
      showToast('New blank sheet ready', 'info');
    }
  };

  // Save Current Sheet to History
  const handleSaveSheet = () => {
    if (rows.length === 0) {
      showError('Cannot Save', 'Please add at least one row to save this sheet.');
      return;
    }

    const newSaved = {
      id: `sheet-${Date.now()}`,
      title: sheetTitle,
      date: sheetDate,
      collector: collectorName,
      route: routeLocation,
      rows: rows,
      totalOutstanding,
      totalCollected,
      savedAt: new Date().toISOString()
    };

    setSavedSheets(prev => [newSaved, ...prev.filter(s => s.title !== sheetTitle)]);
    showToast(`Sheet "${sheetTitle}" saved successfully!`, 'success');
  };

  // Load a Saved Sheet
  const handleLoadSaved = (sheet) => {
    setSheetTitle(sheet.title);
    setSheetDate(sheet.date);
    setCollectorName(sheet.collector);
    setRouteLocation(sheet.route);
    setRows(sheet.rows || []);
    setIsSavedDrawerOpen(false);
    showToast(`Loaded "${sheet.title}"`, 'success');
  };

  // Delete a Saved Sheet
  const handleDeleteSaved = (sheetId) => {
    setSavedSheets(prev => prev.filter(s => s.id !== sheetId));
    showToast('Saved sheet deleted', 'info');
  };

  // Print Sheet (Clean A4 pad print)
  const handlePrint = () => {
    window.print();
  };

  // Download PDF
  const handleDownloadPDF = () => {
    downloadUgrahiSheetPDF({
      sheetTitle,
      sheetDate,
      recoveryAgent: collectorName,
      targetRoute: routeLocation,
      rows
    });
    showToast('Collection PDF downloaded!', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Print-Only Document Format (Clean 100% English A4 Pad Layout) */}
      <div className="hidden print:block font-sans text-black p-6 bg-white">
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                KHAN JACKET HOUSE
              </h1>
              <p className="text-xs text-slate-600">
                Wholesale Distribution & Central Warehouse Management
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-bold block">{sheetTitle}</span>
              <span className="text-xs text-slate-600 block">Date: {sheetDate}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-slate-300">
            <span><strong>Collector / Staff:</strong> {collectorName}</span>
            <span><strong>Location / Route:</strong> {routeLocation}</span>
            <span><strong>Total Accounts:</strong> {rows.length} Shops</span>
          </div>
        </div>

        <table className="w-full border-collapse border border-slate-800 text-left text-xs">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-800">
              <th className="border border-slate-800 p-2 text-center w-10">#</th>
              <th className="border border-slate-800 p-2">Customer / Shop Name</th>
              <th className="border border-slate-800 p-2">Location / Address</th>
              <th className="border border-slate-800 p-2 text-right w-32">Total Balance</th>
              <th className="border border-slate-800 p-2 text-right w-32">Amount Received</th>
              <th className="border border-slate-800 p-2 text-center w-28">Signature / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || idx} className="border-b border-slate-300">
                <td className="border border-slate-800 p-2 text-center font-bold">{idx + 1}</td>
                <td className="border border-slate-800 p-2 font-semibold">{row.name || '—'}</td>
                <td className="border border-slate-800 p-2">{row.address || '—'}</td>
                <td className="border border-slate-800 p-2 text-right font-mono font-bold">
                  {row.totalDue ? `Rs. ${Number(row.totalDue).toLocaleString()}` : '—'}
                </td>
                <td className="border border-slate-800 p-2 text-right font-mono font-bold">
                  {row.wasool ? `Rs. ${Number(row.wasool).toLocaleString()}` : ''}
                </td>
                <td className="border border-slate-800 p-2"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-sm">
              <td colSpan="3" className="border border-slate-800 p-2 text-right font-bold">
                Grand Total ({rows.length} Accounts):
              </td>
              <td className="border border-slate-800 p-2 text-right font-mono font-bold">
                Rs. {totalOutstanding.toLocaleString()}
              </td>
              <td className="border border-slate-800 p-2 text-right font-mono font-bold">
                Rs. {totalCollected.toLocaleString()}
              </td>
              <td className="border border-slate-800 p-2 text-center text-xs">
                Balance: Rs. {remainingBalance.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Signature Box */}
        <div className="flex justify-between items-end mt-16 pt-8 text-xs font-bold border-t border-slate-400">
          <div className="text-center w-48 border-t border-slate-800 pt-1">
            Collection Officer Signature
          </div>
          <div className="text-center w-48 border-t border-slate-800 pt-1">
            Verified By (Accounts / Munshi)
          </div>
          <div className="text-center w-48 border-t border-slate-800 pt-1">
            Authorized Signature (CEO)
          </div>
        </div>
      </div>

      {/* Screen View (Interactive App View) */}
      <div className="print:hidden space-y-6">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Payment Collection Sheets (Ugrahi)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {rows.length} Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Route-wise customer recovery lists, outstanding khata balances, and field payment collection
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
              title="Print standard collection pad"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
              title="Download PDF collection sheet"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSheet}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              title="Save sheet to history"
            >
              <Save className="w-4 h-4" />
              <span>Save Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSavedDrawerOpen(true)}
              className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-purple-500" />
              <span>Saved ({savedSheets.length})</span>
            </button>

            <button
              type="button"
              onClick={handleNewSheet}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Sheet</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-bold uppercase tracking-wider">Total Customers</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs text-slate-400 mb-2 font-medium">Shops listed in sheet</div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
              {rows.length} <span className="text-xs font-normal text-slate-400">Shops</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-bold uppercase tracking-wider text-rose-500">Total Outstanding</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ReceiptText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs text-slate-400 mb-2 font-medium">Total khata balance due</div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 truncate">
              Rs. {totalOutstanding.toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-bold uppercase tracking-wider text-emerald-500">Total Collected</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs text-slate-400 mb-2 font-medium">Payment received (wasooli)</div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
              Rs. {totalCollected.toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-bold uppercase tracking-wider text-blue-500">Remaining Balance</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs text-slate-400 mb-2 font-medium">Pending field balance</div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 truncate">
              Rs. {remainingBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Sheet Configuration Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Sheet Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sheet Title / Route Name
              </label>
              <input
                type="text"
                value={sheetTitle}
                onChange={e => setSheetTitle(e.target.value)}
                placeholder="e.g. Lahore Market Collection"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Collection Date</span>
              </label>
              <input
                type="date"
                value={sheetDate}
                onChange={e => setSheetDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Collector / Staff Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Collector / Officer Name</span>
              </label>
              <input
                type="text"
                value={collectorName}
                onChange={e => setCollectorName(e.target.value)}
                placeholder="e.g. Tariq Mehmood"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Auto-Load By City */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Auto-Load City Customers</span>
              </label>
              <select
                value={selectedCity}
                onChange={e => handleLoadCityCustomers(e.target.value)}
                className="w-full px-3.5 py-2 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-300 outline-hidden focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">-- Choose City to Load All (e.g. Lahore) --</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Collection Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          
          {/* Table Header Action Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                placeholder="Search customers or location in sheet..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-4 min-w-[260px]">Customer / Shop Name</th>
                  <th className="py-3 px-4 min-w-[220px]">Location / Address</th>
                  <th className="py-3 px-4 min-w-[160px] text-right">Total Balance (PKR)</th>
                  <th className="py-3 px-4 min-w-[160px] text-right">Collected Wasooli (PKR)</th>
                  <th className="py-3 px-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <ReceiptText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No customers in sheet</p>
                        <p className="text-xs text-slate-500">
                          Click "Add Row" or select a city above to auto-load customers.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Sr. No */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Customer Name */}
                      <td className="py-2 px-4">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={row.name}
                            onChange={e => handleRowChange(row.id, 'name', e.target.value)}
                            placeholder="Type customer or shop name..."
                            className="w-full px-3 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-hidden transition-all"
                          />
                          {customers.length > 0 && (
                            <select
                              value={row.customerId || ''}
                              onChange={e => handleSelectCustomer(row.id, e.target.value)}
                              className="w-full text-[11px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-transparent border-0 cursor-pointer outline-hidden"
                            >
                              <option value="">Choose from customer database...</option>
                              {customers.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.shopName} ({c.city}) — Balance: Rs. {(c.remainingBalance || 0).toLocaleString()}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Location / Address */}
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={row.address}
                          onChange={e => handleRowChange(row.id, 'address', e.target.value)}
                          placeholder="e.g. Anarkali, Thokar, Raja Bazaar"
                          className="w-full px-3 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-hidden transition-all"
                        />
                      </td>

                      {/* Total Balance */}
                      <td className="py-2 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.totalDue}
                          onChange={e => handleRowChange(row.id, 'totalDue', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs sm:text-sm font-mono font-bold text-right text-rose-600 dark:text-rose-400 outline-hidden transition-all"
                        />
                      </td>

                      {/* Collected Amount */}
                      <td className="py-2 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.wasool}
                          onChange={e => handleRowChange(row.id, 'wasool', e.target.value)}
                          placeholder="0 (or blank for print)"
                          className="w-full px-3 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs sm:text-sm font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 outline-hidden transition-all"
                        />
                      </td>

                      {/* Delete */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-md cursor-pointer opacity-30 group-hover:opacity-100"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm">
                    <td colSpan="3" className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                      Total Summary:
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                      Rs. {totalOutstanding.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Rs. {totalCollected.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Table Bottom Help Footer */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Print this sheet for your field recovery agent, or click Download PDF for records.
            </span>

            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Customer</span>
            </button>
          </div>

        </div>

      </div>

      {/* Saved Sheets History Modal */}
      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-purple-600" />
                  <span>Saved Collection Sheets</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Re-load, reprint, or manage past collection lists
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSavedDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {savedSheets.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <ReceiptText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No saved sheets yet</p>
                  <p className="mt-1">Click "Save Sheet" on any active collection sheet to store it here.</p>
                </div>
              ) : (
                savedSheets.map(s => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {s.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {s.date} • {s.rows?.length || 0} Shops • Balance: Rs. {(s.totalOutstanding || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadSaved(s)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Load Sheet
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete saved sheet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSavedDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
