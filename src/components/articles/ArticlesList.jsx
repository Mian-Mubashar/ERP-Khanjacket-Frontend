import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shirt,
  Search,
  Plus,
  Truck,
  Download,
  Eye,
  Tag,
  Layers,
  ArrowUpRight,
  Pencil,
  MapPin,
  Warehouse
} from 'lucide-react';
import { Pagination } from '../common/Pagination';

export const ArticlesList = () => {
  const { 
    articles, 
    setSelectedArticleDetail, 
    setIsAddArticleOpen, 
    setEditingArticle,
    setIsEditArticleOpen,
    setIsNewOutwardOpen,
    categories,
    stuffs,
    setIsAddStuffOpen,
    setIsAddLocationOpen
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStuff, setSelectedStuff] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK'

  // 10-Item Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedStuff, stockFilter]);

  const filteredArticles = articles.filter(art => {
    const matchesSearch = 
      art.articleNo.toLowerCase().includes(search.toLowerCase()) ||
      art.name.toLowerCase().includes(search.toLowerCase()) ||
      art.category.toLowerCase().includes(search.toLowerCase()) ||
      (art.stuff && art.stuff.toLowerCase().includes(search.toLowerCase())) ||
      (art.warehouseLocation && art.warehouseLocation.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || art.category === selectedCategory;
    const matchesStuff = selectedStuff === 'ALL' || (art.stuff && art.stuff.toLowerCase() === selectedStuff.toLowerCase());
    
    let matchesStock = true;
    if (stockFilter === 'IN_STOCK') matchesStock = art.currentStock > 0;
    if (stockFilter === 'LOW_STOCK') matchesStock = art.currentStock <= (art.minAlertStock || 200);

    return matchesSearch && matchesCategory && matchesStuff && matchesStock;
  });

  const totalWarehouseStock = filteredArticles.reduce((s, a) => s + (Number(a.currentStock) || 0), 0);
  const totalStockValue = filteredArticles.reduce((s, a) => s + ((Number(a.currentStock) || 0) * (Number(a.unitCost) || 0)), 0);

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Article Code,Article Name,Category,Fabric Stuff,Warehouse Location,Total Purchased,Total Out,Current Stock,Unit Cost,Total Value\n'];
    const rows = filteredArticles.map(a => 
      `"${a.articleNo}","${a.name}","${a.category}","${a.stuff || 'Standard'}","${a.warehouseLocation || 'General'}",${a.totalPurchased},${a.totalOut},${a.currentStock},${a.unitCost},${a.currentStock * a.unitCost}`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Khan_Clothes_Stock_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header (Clean, professional typography, non-bold headers) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
              ARTICLES & STOCK REGISTER
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {articles.length} Active Codes
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Central warehouse inventory, jacket fabrics/stuffs, and unique article stock
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddLocationOpen(true)}
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Warehouse className="w-4 h-4 text-amber-500" />
            <span>Manage Locations</span>
          </button>

          <button
            onClick={() => setIsAddStuffOpen(true)}
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-xl border border-purple-200 dark:border-purple-800/60 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-purple-500" />
            <span>Manage Stuffs</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddArticleOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Article</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between overflow-hidden">
          <div className="min-w-0">
            <span className="text-xs text-slate-400">Filtered Articles</span>
            <div className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1 truncate">
              {filteredArticles.length} Codes
            </div>
          </div>
          <Shirt className="w-7 h-7 text-purple-500/30 shrink-0 ml-2" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between overflow-hidden">
          <div className="min-w-0">
            <span className="text-xs text-slate-400">Available Stock</span>
            <div className="text-xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {totalWarehouseStock.toLocaleString()} pcs
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 shrink-0 ml-2">In Warehouse</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between overflow-hidden">
          <div className="min-w-0">
            <span className="text-xs text-slate-400">Total Stock Value</span>
            <div className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1 truncate">
              Rs. {Math.round(totalStockValue).toLocaleString()}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 shrink-0 ml-2">Cost Valuation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Article Code (e.g. BF411), Description, Fabric..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-hidden transition-all"
            />
          </div>

          {/* Stuff / Fabric Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Stuff:</span>
            <select
              value={selectedStuff}
              onChange={e => setSelectedStuff(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="ALL">All Fabrics / Stuffs</option>
              {stuffs.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Stock' },
              { id: 'IN_STOCK', label: 'In Stock (>0)' },
              { id: 'LOW_STOCK', label: 'Low Stock Alert' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setStockFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  stockFilter === pill.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mr-1">
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                <th className="py-3.5 px-4">Article Code</th>
                <th className="py-3.5 px-4">Article Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Stuff / Fabric</th>
                <th className="py-3.5 px-4">Warehouse Location</th>
                <th className="py-3.5 px-4 text-right">Total Purchased</th>
                <th className="py-3.5 px-4 text-right">Total Out</th>
                <th className="py-3.5 px-4 text-right">Current Stock</th>
                <th className="py-3.5 px-4 text-right">Unit Cost</th>
                <th className="py-3.5 px-4 text-right">Total Value</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-400">
                    No articles found matching filters.
                  </td>
                </tr>
              ) : (
                filteredArticles.slice((page - 1) * pageSize, page * pageSize).map((art) => {
                  const isLow = art.currentStock <= (art.minAlertStock || 200);
                  const isOut = art.currentStock <= 0;

                  return (
                    <tr
                      key={art.articleNo}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedArticleDetail(art)}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {art.articleNo}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {art.name}
                        {art.description && (
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                            {art.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                          {art.category}
                        </span>
                      </td>

                      {/* Stuff / Fabric (New) */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] border border-purple-200/50 dark:border-purple-800/50">
                          <Tag className="w-2.5 h-2.5 text-purple-500" />
                          {art.stuff || 'Standard'}
                        </span>
                      </td>

                      {/* Warehouse Location / Rack */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-medium border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{art.warehouseLocation || 'General'}</span>
                        </span>
                      </td>

                      {/* Total Purchased */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        {art.totalPurchased?.toLocaleString()} pcs
                      </td>

                      {/* Total Out */}
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                        {art.totalOut?.toLocaleString()} pcs
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-mono font-semibold ${
                          isOut ? 'text-red-600' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {art.currentStock?.toLocaleString()} pcs
                        </span>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        Rs. {art.unitCost?.toLocaleString()}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-900 dark:text-white font-medium">
                        Rs. {((art.currentStock || 0) * (art.unitCost || 0)).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingArticle(art);
                              setIsEditArticleOpen(true);
                            }}
                            className="w-8 h-8 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 hover:bg-blue-100/80 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Edit Article Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedArticleDetail(art)}
                            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700 hover:bg-slate-100 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="View Stock Ledger"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedArticleDetail(null);
                              setIsNewOutwardOpen(true);
                            }}
                            className="w-8 h-8 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 hover:bg-rose-100/80 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Dispatch Outward"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
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

        {/* 10-Item Pagination */}
        <Pagination
          currentPage={page}
          totalItems={filteredArticles.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="articles"
        />
      </div>

    </div>
  );
};
