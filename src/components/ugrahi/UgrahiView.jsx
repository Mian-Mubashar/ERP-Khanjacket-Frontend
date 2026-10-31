import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  X,
  Filter,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import Swal, { showToast, confirmDelete, showError } from '../../utils/sweetalert';
import { downloadUgrahiSheetPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';
import logoImg from '../../images/khan jacket logo.png';

export const UgrahiView = () => {
  const { customers = [], cities = [], currentUser } = useApp();

  // Sheet Meta Information
  const [sheetTitle, setSheetTitle] = useState('All Cities Payment Collection Sheet');
  const [sheetDate, setSheetDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectorName, setCollectorName] = useState(currentUser?.name || 'Admin Khan');
  const [routeLocation, setRouteLocation] = useState('All Wholesale Markets');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [dueOnly, setDueOnly] = useState(false); // Toggle: Only show customers with balance > 0

  // 15-Item Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Export Dropdown State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  // 3-Dots dropdown state for Saved Sheets items
  const [activeSavedMenuId, setActiveSavedMenuId] = useState(null);

  // Outside click listener for Export dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
    };
    if (isExportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportOpen]);

  // Outside click listener for Saved Sheets item 3-dots menu
  useEffect(() => {
    const handleCloseSavedMenu = () => setActiveSavedMenuId(null);
    if (activeSavedMenuId) {
      document.addEventListener('click', handleCloseSavedMenu);
    }
    return () => {
      document.removeEventListener('click', handleCloseSavedMenu);
    };
  }, [activeSavedMenuId]);

  // Helper to map DB customers to collection sheet rows
  const mapCustomersToRows = (custList, filterDueOnly = false) => {
    let list = custList || [];
    if (filterDueOnly) {
      list = list.filter(c => Number(c.remainingBalance || 0) > 0);
    }
    return list.map((c) => ({
      id: `cust-${c.id}`,
      customerId: c.id,
      name: `${c.shopName} ${c.shopkeeperName ? `(${c.shopkeeperName})` : ''}`,
      address: c.marketAddress ? `${c.marketAddress}, ${c.city}` : c.city || '',
      city: c.city || '',
      totalDue: Number(c.remainingBalance) || 0,
      wasool: ''
    }));
  };

  // Compute shop count per city for fast pills & dropdown
  const cityCounts = useMemo(() => {
    const counts = {};
    customers.forEach(c => {
      const city = c.city || 'Other';
      counts[city] = (counts[city] || 0) + 1;
    });
    return counts;
  }, [customers]);

  // Active cities with count > 0 (filters out non-active cities like Islamabad (0))
  const activeCities = useMemo(() => {
    return cities.filter(c => (cityCounts[c.name] || 0) > 0);
  }, [cities, cityCounts]);

  // Initial Rows Data with LocalStorage fallback
  const [rows, setRows] = useState(() => {
    const saved = localStorage.getItem('kc_active_collection_rows');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Track if we have already auto-populated on first customer load
  const hasInitializedRef = useRef(false);

  // Auto-populate with ALL customers by default on initial mount (without noisy toast)
  useEffect(() => {
    if (customers.length > 0 && !hasInitializedRef.current) {
      const saved = localStorage.getItem('kc_active_collection_rows');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRows(parsed);
            hasInitializedRef.current = true;
            return;
          }
        } catch (e) {
          // ignore error
        }
      }

      // Default: Load all database customers
      const allRows = mapCustomersToRows(customers, dueOnly);
      setRows(allRows);
      setSelectedCity('ALL');
      setSheetTitle('All Cities Payment Collection Sheet');
      setRouteLocation('All Wholesale Markets');
      hasInitializedRef.current = true;
    }
  }, [customers, dueOnly]);

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

  // Persist active rows in localStorage
  useEffect(() => {
    localStorage.setItem('kc_active_collection_rows', JSON.stringify(rows));
  }, [rows]);

  // Persist saved sheets library in localStorage
  useEffect(() => {
    localStorage.setItem('kc_saved_collection_sheets', JSON.stringify(savedSheets));
  }, [savedSheets]);

  // Financial Summary Calculations
  const totalOutstanding = useMemo(() => {
    return rows.reduce((s, r) => s + (Number(r.totalDue) || 0), 0);
  }, [rows]);

  const totalCollected = useMemo(() => {
    return rows.reduce((s, r) => s + (Number(r.wasool) || 0), 0);
  }, [rows]);

  const remainingBalance = totalOutstanding - totalCollected;

  // Filtered rows for live in-table search
  const displayedRows = useMemo(() => {
    if (!tableSearch.trim()) return rows;
    const q = tableSearch.toLowerCase();
    return rows.filter(r => {
      return (
        (r.name || '').toLowerCase().includes(q) ||
        (r.address || '').toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q)
      );
    });
  }, [rows, tableSearch]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [tableSearch, selectedCity, dueOnly]);

  // Sliced rows for 12-item page limit
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayedRows.slice(start, start + pageSize);
  }, [displayedRows, page, pageSize]);

  // Add a Blank Custom Row
  const handleAddRow = () => {
    const newRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      address: '',
      city: selectedCity === 'ALL' ? '' : selectedCity,
      totalDue: '',
      wasool: ''
    };
    setRows(prev => [...prev, newRow]);
    const nextTotal = displayedRows.length + 1;
    setPage(Math.ceil(nextTotal / pageSize));
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

  // Handle typing or choosing customer from datalist
  const handleCustomerNameChange = (rowId, val) => {
    const matched = customers.find(c => {
      const fullLabel = `${c.shopName} ${c.shopkeeperName ? `(${c.shopkeeperName})` : ''}`.trim();
      return (
        fullLabel.toLowerCase() === val.trim().toLowerCase() ||
        c.shopName.toLowerCase() === val.trim().toLowerCase()
      );
    });

    if (matched) {
      setRows(prev =>
        prev.map(r => {
          if (r.id !== rowId) return r;
          return {
            ...r,
            name: `${matched.shopName} ${matched.shopkeeperName ? `(${matched.shopkeeperName})` : ''}`,
            address: matched.marketAddress ? `${matched.marketAddress}, ${matched.city}` : matched.city || '',
            city: matched.city || '',
            totalDue: matched.remainingBalance || 0,
            customerId: matched.id
          };
        })
      );
    } else {
      handleRowChange(rowId, 'name', val);
    }
  };

  // Remove Row
  const handleRemoveRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // City Filter Change Handler (Supports 'ALL' and specific cities)
  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    setTableSearch('');

    if (!cityName || cityName === 'ALL') {
      const allRows = mapCustomersToRows(customers, dueOnly);
      setRows(allRows);
      setSheetTitle('All Cities Payment Collection Sheet');
      setRouteLocation('All Wholesale Markets');
      return;
    }

    const cityCustomers = customers.filter(
      c => (c.city || '').toLowerCase() === cityName.toLowerCase()
    );

    if (cityCustomers.length === 0) {
      setRows([]);
      setSheetTitle(`${cityName} Collection Sheet`);
      setRouteLocation(`${cityName} Wholesale Market`);
      return;
    }

    const cityRows = mapCustomersToRows(cityCustomers, dueOnly);
    setRows(cityRows);
    setSheetTitle(`${cityName} Collection Sheet`);
    setRouteLocation(`${cityName} Wholesale Market`);
  };

  // Toggle "Only Baqaya Due" filter
  const handleToggleDueOnly = () => {
    const nextDue = !dueOnly;
    setDueOnly(nextDue);

    let source = customers;
    if (selectedCity && selectedCity !== 'ALL') {
      source = customers.filter(c => (c.city || '').toLowerCase() === selectedCity.toLowerCase());
    }

    const updated = mapCustomersToRows(source, nextDue);
    setRows(updated);
  };

  // Reset / Load All Customers Button
  const handleResetToAll = () => {
    if (customers.length === 0) {
      showError('No Customers', 'No customers found in database.');
      return;
    }
    const allRows = mapCustomersToRows(customers, dueOnly);
    setRows(allRows);
    setSelectedCity('ALL');
    setSheetTitle('All Cities Payment Collection Sheet');
    setRouteLocation('All Wholesale Markets');
    setTableSearch('');
    showToast(`Loaded ${allRows.length} customers!`, 'success');
  };

  // Reset to New Fresh Blank Sheet
  const handleNewSheet = async () => {
    const ok = await confirmDelete({
      title: 'Create Blank Collection Sheet?',
      text: 'This will clear the table for custom manual entry. (Click "Reset" anytime to reload database customers).',
      confirmButtonText: 'Yes, New Blank Sheet'
    });
    if (ok) {
      setRows([
        { id: `row-${Date.now()}-1`, name: '', address: '', city: '', totalDue: '', wasool: '' }
      ]);
      setSheetTitle('Daily Collection Sheet');
      setRouteLocation('City Market');
      setSelectedCity('ALL');
      setTableSearch('');
      showToast('Blank sheet ready', 'info');
    }
  };

  // Save Current Sheet to History Library with Name Prompt
  const handleSaveSheet = async () => {
    if (rows.length === 0) {
      showError('Cannot Save', 'Sheet has 0 customers. Please add or load customers first.');
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const defaultName = `${sheetTitle} (${sheetDate})`;

    const { value: customName, isConfirmed } = await Swal.fire({
      title: 'Save Collection Sheet',
      text: 'Enter a name for this collection sheet to store it in your saved history:',
      input: 'text',
      inputValue: defaultName,
      inputPlaceholder: 'e.g. Lahore Sunday Recovery List',
      showCancelButton: true,
      confirmButtonText: 'Save Sheet',
      cancelButtonText: 'Cancel',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      inputValidator: (val) => {
        if (!val || !val.trim()) return 'Sheet name cannot be empty!';
      }
    });

    if (!isConfirmed || !customName) return;

    const newSaved = {
      id: `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: customName.trim(),
      date: sheetDate,
      collector: collectorName,
      route: routeLocation,
      city: selectedCity,
      rows: JSON.parse(JSON.stringify(rows)),
      totalOutstanding,
      totalCollected,
      savedAt: new Date().toISOString()
    };

    setSavedSheets(prev => [newSaved, ...prev.filter(s => s.title !== newSaved.title)]);
    showToast(`Sheet "${customName.trim()}" saved to library!`, 'success');
  };

  // Load a Saved Sheet into Active Table
  const handleLoadSaved = (sheet) => {
    setSheetTitle(sheet.title || 'Collection Sheet');
    setSheetDate(sheet.date || new Date().toISOString().split('T')[0]);
    setCollectorName(sheet.collector || 'Admin Khan');
    setRouteLocation(sheet.route || 'Wholesale Market');
    setSelectedCity(sheet.city || 'ALL');
    setRows(sheet.rows || []);
    setIsSavedDrawerOpen(false);
    showToast(`Loaded "${sheet.title}" (${sheet.rows?.length || 0} shops)!`, 'success');
  };

  // Print a specific saved sheet directly
  const handlePrintSaved = (sheet) => {
    handleLoadSaved(sheet);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Delete a Saved Sheet from Library
  const handleDeleteSaved = async (sheetId) => {
    const ok = await confirmDelete({
      title: 'Delete Saved Sheet?',
      text: 'Are you sure you want to delete this sheet from your saved library?',
      confirmButtonText: 'Yes, Delete'
    });
    if (ok) {
      setSavedSheets(prev => prev.filter(s => s.id !== sheetId));
      showToast('Saved sheet deleted from library', 'info');
    }
  };

  // Print Active Sheet (Clean A4 pad print)
  const handlePrint = () => {
    window.print();
  };

  // Download PDF of Active Sheet
  const handleDownloadPDF = () => {
    downloadUgrahiSheetPDF({
      sheetTitle,
      sheetDate,
      recoveryAgent: collectorName,
      targetRoute: routeLocation,
      rows
    });
    showToast('Collection PDF downloaded successfully!', 'success');
  };

  return (
    <div className="space-y-4">
      
      {/* ========================================================= */}
      {/* PRINT-ONLY VIEW (Clean A4 Collection Pad Layout)           */}
      {/* ========================================================= */}
      <div className="hidden print:block font-sans text-black p-6 bg-white">
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3.5">
              <img src={logoImg} alt="Khan Jacket House" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  KHAN JACKET HOUSE
                </h1>
                <p className="text-xs text-slate-600">
                  Wholesale Distribution & Central Warehouse Management
                </p>
              </div>
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
              <th className="border border-slate-800 p-2 text-right w-36">Total Balance</th>
              <th className="border border-slate-800 p-2 text-right w-36">Amount Received</th>
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

      {/* ========================================================= */}
      {/* SCREEN VIEW (Executive Interactive App View)              */}
      {/* ========================================================= */}
      <div className="print:hidden space-y-4">
        
        {/* Top Action Bar: Merged into 2 Primary Clean Groups */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          {/* Left Group: Title & New Sheet */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Payment Collection Sheets
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {rows.length} Accounts
                </span>
              </div>
            </div>
          </div>

          {/* Right Group: Left = New Sheet + Reset | Right = Saved, Export, Save */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* + New Sheet */}
            <button
              type="button"
              onClick={handleNewSheet}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Start a fresh blank collection sheet"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>+ New Sheet</span>
            </button>

            {/* Reset / Load All */}
            <button
              type="button"
              onClick={handleResetToAll}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              title="Reset & Load All Customers from Database"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* Saved Sheets Library */}
            <button
              type="button"
              onClick={() => setIsSavedDrawerOpen(true)}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="View saved collection sheets"
            >
              <FolderOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Saved ({savedSheets.length})</span>
            </button>

            {/* Export Dropdown (Print / Download PDF) */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                type="button"
                onClick={() => setIsExportOpen(prev => !prev)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Export options: Print or Download PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportOpen(false);
                      handlePrint();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4 text-slate-400" />
                    <span>Print Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportOpen(false);
                      handleDownloadPDF();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Download PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary Accent Save Button */}
            <button
              type="button"
              onClick={handleSaveSheet}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Save current sheet to library"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Sheet</span>
            </button>

          </div>
        </div>

        {/* 4 Clean Standard KPI Cards (Title -> Bold Value, subtle tooltip) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Total Customers */}
          <div 
            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
            title="Total shops listed in active collection sheet"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px]">Total Customers</span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight truncate">
              {rows.length} <span className="text-xs font-normal text-slate-400 font-sans">Shops</span>
            </div>
          </div>

          {/* 2. Total Outstanding */}
          <div 
            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
            title="Total outstanding khata balance due across listed shops"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-rose-500">Total Outstanding</span>
              <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ReceiptText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight truncate">
              Rs. {Math.round(totalOutstanding).toLocaleString()}
            </div>
          </div>

          {/* 3. Total Collected */}
          <div 
            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
            title="Total wasooli / cash payments received during collection"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-500">Total Collected</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
              Rs. {Math.round(totalCollected).toLocaleString()}
            </div>
          </div>

          {/* 4. Remaining Balance */}
          <div 
            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
            title="Net remaining field balance pending after collected wasooli"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-blue-500">Remaining Balance</span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-blue-600 dark:text-blue-400 tracking-tight truncate">
              Rs. {Math.round(remainingBalance).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Streamlined Single Horizontal Filter & Config Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
          {/* Single Row: Title, Date, Collector, City Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Sheet Title */}
            <div>
              <input
                type="text"
                value={sheetTitle}
                onChange={e => setSheetTitle(e.target.value)}
                placeholder="Sheet Title / Route..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-colors"
                title="Sheet Title"
              />
            </div>

            {/* Date */}
            <div>
              <input
                type="date"
                value={sheetDate}
                onChange={e => setSheetDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-colors"
                title="Collection Date"
              />
            </div>

            {/* Collector */}
            <div>
              <input
                type="text"
                value={collectorName}
                onChange={e => setCollectorName(e.target.value)}
                placeholder="Collector / Officer Name..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-colors"
                title="Collector Name"
              />
            </div>

            {/* City Dropdown Filter */}
            <div>
              <select
                value={selectedCity}
                onChange={e => handleCityChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-800 dark:text-blue-300 outline-hidden focus:border-blue-500 transition-colors cursor-pointer"
                title="Filter by City / Route"
              >
                <option value="ALL">All Cities ({customers.length} Shops)</option>
                {activeCities.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({cityCounts[c.name] || 0} Shops)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Cities Chips Bar (Only Cities with Count > 0) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Cities:</span>
            </span>

            {/* All Cities Chip */}
            <button
              type="button"
              onClick={() => handleCityChange('ALL')}
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                selectedCity === 'ALL' || !selectedCity
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Cities ({customers.length})
            </button>

            {/* Active Cities Only (count > 0, non-active hidden) */}
            {activeCities.map(c => {
              const count = cityCounts[c.name] || 0;
              const isSelected = selectedCity?.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCityChange(c.name)}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.name} ({count})
                </button>
              );
            })}

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            {/* Only Baqaya Due Toggle */}
            <button
              type="button"
              onClick={handleToggleDueOnly}
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                dueOnly
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Only Baqaya Due</span>
              {dueOnly && <span className="text-[9px] bg-white/25 px-1 rounded font-bold">Active</span>}
            </button>
          </div>
        </div>

        {/* Collection Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          
          {/* Table Header Action Bar */}
          <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                placeholder="Search customer, location or city in sheet..."
                className="w-full pl-8.5 pr-8 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium mr-1">
                Showing {displayedRows.length === 0 ? 0 : `${(page - 1) * pageSize + 1} - ${Math.min(displayedRows.length, page * pageSize)}`} of {displayedRows.length} accounts
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
            </div>
          </div>

          {/* Datalist for fast customer autocomplete on custom row */}
          <datalist id="db-customer-list">
            {customers.map(c => (
              <option 
                key={c.id} 
                value={`${c.shopName} ${c.shopkeeperName ? `(${c.shopkeeperName})` : ''}`}
              />
            ))}
          </datalist>

          {/* Table with Compact Rows & Alignment */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-center w-10">#</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Customer / Shop Name</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Location / Address</th>
                  <th className="py-2.5 px-3 min-w-[150px] text-right">Total Balance (PKR)</th>
                  <th className="py-2.5 px-3 min-w-[150px] text-right">Collected Wasooli (PKR)</th>
                  <th className="py-2.5 px-2 text-center w-12 text-[10px] text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-2.5 py-2 text-center">
                        <ReceiptText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {tableSearch ? `No customers matching "${tableSearch}"` : 'No customers in sheet'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Click below to load registered database customers or add a custom row.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={handleResetToAll}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Load All Customers ({customers.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAddRow}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Row</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const srNo = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={row.id || idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Sr. No */}
                        <td className="py-1.5 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                          {srNo}
                        </td>

                      {/* Customer Name (Single Clean Input, Zero Duplicate Sub-Text) */}
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          list="db-customer-list"
                          value={row.name}
                          onChange={e => handleCustomerNameChange(row.id, e.target.value)}
                          placeholder="Shop / Customer Name..."
                          className="w-full px-2.5 py-1 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-hidden transition-all"
                        />
                      </td>

                      {/* Location / Address */}
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={row.address}
                          onChange={e => handleRowChange(row.id, 'address', e.target.value)}
                          placeholder="e.g. Anarkali, Thokar, Raja Bazaar"
                          className="w-full px-2.5 py-1 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-hidden transition-all"
                        />
                      </td>

                      {/* Total Balance (Right Aligned Number) */}
                      <td className="py-1.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.totalDue}
                          onChange={e => handleRowChange(row.id, 'totalDue', e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs font-mono font-bold text-right text-rose-600 dark:text-rose-400 outline-hidden transition-all"
                        />
                      </td>

                      {/* Collected Amount (Right Aligned Number, Simplified Placeholder) */}
                      <td className="py-1.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.wasool}
                          onChange={e => handleRowChange(row.id, 'wasool', e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 outline-hidden transition-all"
                        />
                      </td>

                      {/* Delete Row Button */}
                      <td className="py-1.5 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Delete row from sheet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-xs">
                    <td colSpan="3" className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      Total Summary:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                      Rs. {Math.round(totalOutstanding).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Rs. {Math.round(totalCollected).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* 15-Item Pagination Component */}
          <Pagination
            currentPage={page}
            totalItems={displayedRows.length}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="accounts"
          />

          {/* Table Bottom Help Footer */}
          <div className="px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Print this sheet for your field recovery agent, or click Export &gt; Download PDF for records.
            </span>

            <button
              type="button"
              onClick={handleAddRow}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Customer</span>
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* SAVED SHEETS MODAL (History Library)                       */}
      {/* ========================================================= */}
      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-purple-600" />
                  <span>Saved Collection Sheets Library</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Open past sheets, download their PDF, or reprint anytime
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

            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2 flex-1">
              {savedSheets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <ReceiptText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No saved sheets yet</p>
                  <p className="mt-1">Click "Save Sheet" on any active collection sheet to store it here.</p>
                </div>
              ) : (
                savedSheets.map(s => (
                  <div
                    key={s.id}
                    className="p-2.5 sm:p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Clean Title */}
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {s.title}
                      </h4>

                      {/* Secondary Info: Date, Collector, Shops Badge, Baqaya Soft Red Highlight */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span>{s.date}</span>
                        <span>•</span>
                        <span>{s.collector || 'N/A'}</span>
                        <span>•</span>

                        {/* Clean Shops Badge */}
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                          {s.rows?.length || 0} Shops
                        </span>

                        {/* Soft Red Baqaya Highlight */}
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-mono font-bold bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/60">
                          Baqaya: Rs. {(s.totalOutstanding || 0).toLocaleString()}
                        </span>

                        {Number(s.totalCollected) > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60">
                            Wasool: Rs. {Number(s.totalCollected).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Single Primary Action [Open Sheet] + 3-Dots Dropdown */}
                    <div className="flex items-center gap-1.5 shrink-0 relative">
                      <button
                        type="button"
                        onClick={() => handleLoadSaved(s)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        title="Open and edit this sheet in active table"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Open Sheet</span>
                      </button>

                      {/* 3-Dots Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSavedMenuId(activeSavedMenuId === s.id ? null : s.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          activeSavedMenuId === s.id
                            ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title="More options (PDF, Print, Delete)"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* 3-Dots Dropdown Menu */}
                      {activeSavedMenuId === s.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-38 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSavedMenuId(null);
                              downloadUgrahiSheetPDF({
                                sheetTitle: s.title,
                                sheetDate: s.date,
                                recoveryAgent: s.collector,
                                targetRoute: s.route,
                                rows: s.rows
                              });
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>Download PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSavedMenuId(null);
                              handlePrintSaved(s);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-400" />
                            <span>Print Sheet</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSavedMenuId(null);
                              handleDeleteSaved(s.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Sheet</span>
                          </button>
                        </div>
                      )}
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
