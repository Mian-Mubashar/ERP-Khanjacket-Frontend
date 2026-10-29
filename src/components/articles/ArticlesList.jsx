import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Plus,
  Truck,
  Download,
  Eye,
  Layers,
  ArrowUpRight,
  Pencil,
  MapPin,
  Warehouse,
  Trash2,
  X,
  RotateCcw,
  MoreVertical,
  Boxes,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Pagination } from '../common/Pagination';
import { confirmDelete, showToast, showError } from '../../utils/sweetalert';

export const ArticlesList = () => {
  const { 
    articles = [], 
    setSelectedArticleDetail, 
    setIsAddArticleOpen, 
    setEditingArticle,
    setIsEditArticleOpen,
    setIsNewOutwardOpen,
    setSelectedArticleForOutward,
    categories = [],
    stuffs = [],
    setIsAddStuffOpen,
    setIsAddLocationOpen,
    deleteArticle
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStuff, setSelectedStuff] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK'
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [activeDropdown, setActiveDropdown] = useState(null); // { id, art, top, left }

  // Close 3-dots action dropdown on outside click, window resize, or scroll
  useEffect(() => {
    const handleClose = (e) => {
      if (e?.target?.closest?.('.article-action-menu')) return;
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

  const handleToggleDropdown = (e, art) => {
    e.stopPropagation();
    if (activeDropdown?.id === art.articleNo) {
      setActiveDropdown(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 190;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top = rect.bottom + 6;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      top = rect.top - dropdownHeight - 6;
    }

    const width = 210;
    const left = Math.max(10, rect.right - width);

    setActiveDropdown({
      id: art.articleNo,
      art,
      top,
      left
    });
  };

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedStuff, stockFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    setSelectedStuff('ALL');
    setStockFilter('ALL');
    setPage(1);
  };

  const isFiltered = search.trim() !== '' || selectedCategory !== 'ALL' || selectedStuff !== 'ALL' || stockFilter !== 'ALL';

  const filteredArticles = articles.filter(art => {
    if (!art) return false;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || (
      (art.articleNo || '').toLowerCase().includes(term) ||
      (art.name || '').toLowerCase().includes(term) ||
      (art.category || '').toLowerCase().includes(term) ||
      (art.stuff && art.stuff.toLowerCase().includes(term)) ||
      (art.warehouseLocation && art.warehouseLocation.toLowerCase().includes(term)) ||
      (art.description && art.description.toLowerCase().includes(term))
    );

    const matchesCategory = selectedCategory === 'ALL' || (art.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchesStuff = selectedStuff === 'ALL' || (art.stuff && art.stuff.toLowerCase() === selectedStuff.toLowerCase());
    
    let matchesStock = true;
    const curStock = Number(art.currentStock) || 0;
    const alertStock = Number(art.minAlertStock) || 200;
    if (stockFilter === 'IN_STOCK') matchesStock = curStock > 0;
    if (stockFilter === 'LOW_STOCK') matchesStock = curStock <= alertStock;

    return matchesSearch && matchesCategory && matchesStuff && matchesStock;
  });

  const totalWarehouseStock = filteredArticles.reduce((s, a) => s + (Number(a.currentStock) || 0), 0);
  const totalStockValue = filteredArticles.reduce((s, a) => s + ((Number(a.currentStock) || 0) * (Number(a.unitCost) || 0)), 0);

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Article Code,Article Name,Category,Fabric Stuff,Warehouse Location,Total Purchased,Total Out,Current Stock,Unit Cost,Total Value\n'];
    const rows = filteredArticles.map(a => 
      `"${a.articleNo}","${a.name}","${a.category}","${a.stuff || 'Standard'}","${a.warehouseLocation || 'General'}",${a.totalPurchased || 0},${a.totalOut || 0},${a.currentStock || 0},${a.unitCost || 0},${(a.currentStock || 0) * (a.unitCost || 0)}`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Khan_Jacket_Stock_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteArticle = async (art) => {
    const isConfirmed = await confirmDelete({
      title: `Delete Article ${art.articleNo}?`,
      text: `Are you sure you want to delete "${art.name}" (${art.articleNo})? This will permanently remove it from the warehouse catalog.`,
      confirmButtonText: 'Yes, Delete Article'
    });

    if (!isConfirmed) return;

    const res = await deleteArticle(art.articleNo);
    if (res?.success) {
      showToast(`Article "${art.articleNo}" deleted successfully!`, 'success');
    } else {
      showError('Cannot Delete Article', res?.message || 'Failed to delete article');
    }
  };

  const handleOpenDispatch = (art) => {
    if (setSelectedArticleForOutward) setSelectedArticleForOutward(art);
    setIsNewOutwardOpen(true);
  };

  const handleOpenEdit = (art) => {
    setEditingArticle(art);
    setIsEditArticleOpen(true);
  };

  const handleOpenDetail = (art) => {
    setSelectedArticleDetail(art);
  };

  const paginatedArticles = filteredArticles.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Articles & Stock Register
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {articles.length} Active Codes
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Central warehouse inventory, jacket fabrics, warehouse rack locations & valuations
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddLocationOpen(true)}
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Warehouse className="w-4 h-4 text-slate-400" />
            <span>Manage Locations</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddStuffOpen(true)}
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Manage Stuffs</span>
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddArticleOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Article</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between overflow-hidden">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Filtered Articles</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
              {filteredArticles.length} Codes
            </div>
            <span className="text-[10px] text-slate-400">Active garment styles</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between overflow-hidden">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Stock</span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {totalWarehouseStock.toLocaleString()} pcs
            </div>
            <span className="text-[10px] text-slate-400">In central warehouse</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between overflow-hidden">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Stock Value</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
              Rs. {Math.round(totalStockValue).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Landing cost valuation</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Unified Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Article Code (e.g. JK-005), Name, Stuff, Location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-hidden transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns & Stock Pills */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-hidden font-medium"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Stuff / Fabric Dropdown */}
          <select
            value={selectedStuff}
            onChange={e => setSelectedStuff(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-hidden font-medium"
          >
            <option value="ALL">All Stuffs / Fabrics</option>
            {stuffs.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Stock Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setStockFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Stock
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              In Stock
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                stockFilter === 'LOW_STOCK'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Low Alert</span>
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
            Showing {filteredArticles.length} of {articles.length}
          </div>

        </div>

      </div>

      {/* High-End Enterprise Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Article Code</th>
                <th className="py-3 px-4">Article Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stuff / Fabric</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Purchased</th>
                <th className="py-3 px-4 text-right">Outward</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedArticles.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Boxes className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400">No articles found</span>
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
                paginatedArticles.map((art) => {
                  const curStock = Number(art.currentStock) || 0;
                  const alertStock = Number(art.minAlertStock) || 200;
                  const isOut = curStock <= 0;
                  const isLow = !isOut && curStock <= alertStock;

                  return (
                    <tr
                      key={art.articleNo}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Article Code */}
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        <span 
                          onClick={() => handleOpenDetail(art)}
                          className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-200/80 dark:border-blue-800/60 cursor-pointer hover:bg-blue-600 hover:text-white transition-colors"
                          title="View Article History"
                        >
                          {art.articleNo}
                        </span>
                      </td>

                      {/* 2. Name & Description */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => handleOpenDetail(art)}
                          className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          {art.name}
                        </div>
                        {art.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={art.description}>
                            {art.description}
                          </div>
                        )}
                      </td>

                      {/* 3. Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {art.category || 'Jacket'}
                        </span>
                      </td>

                      {/* 4. Stuff / Fabric */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700">
                          {art.stuff || 'Standard'}
                        </span>
                      </td>

                      {/* 5. Warehouse Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{art.warehouseLocation || 'General'}</span>
                        </span>
                      </td>

                      {/* 6. Total Purchased */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {(Number(art.totalPurchased) || 0).toLocaleString()} pcs
                      </td>

                      {/* 7. Total Out */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                        {(Number(art.totalOut) || 0).toLocaleString()} pcs
                      </td>

                      {/* 8. Current Stock */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            0 pcs (Out)
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                            {curStock.toLocaleString()} pcs
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {curStock.toLocaleString()} pcs
                          </span>
                        )}
                      </td>

                      {/* 9. Unit Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        Rs. {(Number(art.unitCost) || 0).toLocaleString()}
                      </td>

                      {/* 10. Total Value */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        Rs. {((Number(art.currentStock) || 0) * (Number(art.unitCost) || 0)).toLocaleString()}
                      </td>

                      {/* 11. Actions (Quick Dispatch & 3-Dots Menu) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Quick Dispatch Outward Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDispatch(art)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200/80 dark:border-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Dispatch Outward (Challan)"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Dispatch</span>
                          </button>

                          {/* Quick View Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(art)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Stock History / Ledger"
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>Ledger</span>
                          </button>

                          {/* 3-Dots Dropdown Trigger */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleDropdown(e, art)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              activeDropdown?.id === art.articleNo
                                ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 text-slate-900 dark:text-white'
                                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title="More actions"
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
          className="article-action-menu fixed z-[999] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${activeDropdown.top}px`, left: `${activeDropdown.left}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Article Code</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
              {activeDropdown.art.articleNo} — {activeDropdown.art.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const a = activeDropdown.art;
              setActiveDropdown(null);
              handleOpenDispatch(a);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Dispatch Outward (Challan)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const a = activeDropdown.art;
              setActiveDropdown(null);
              handleOpenDetail(a);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>View Stock History</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const a = activeDropdown.art;
              setActiveDropdown(null);
              handleOpenEdit(a);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-500" />
            <span>Edit Article Details</span>
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

          <button
            type="button"
            onClick={() => {
              const a = activeDropdown.art;
              setActiveDropdown(null);
              handleDeleteArticle(a);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Article</span>
          </button>
        </div>
      )}

      {/* 10-Item Pagination */}
      <Pagination
        currentPage={page}
        totalItems={filteredArticles.length}
        pageSize={pageSize}
        onPageChange={setPage}
        itemLabel="articles"
      />

    </div>
  );
};
