import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowUpRight,
  Plus,
  Search,
  Download,
  Calendar,
  Truck
} from 'lucide-react';
import { downloadOutwardLogPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';
import { formatLakhCrore } from '../../utils/formatters';

export const OutwardList = () => {
  const { outward, setIsNewOutwardOpen, setSelectedArticleDetail, articles } = useApp();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredOutward = outward.filter(item => {
    const matchesSearch =
      item.articleNo.toLowerCase().includes(search.toLowerCase()) ||
      item.articleName.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.destination.toLowerCase().includes(search.toLowerCase()) ||
      item.challanNo.toLowerCase().includes(search.toLowerCase());

    const matchesDate = !dateFilter || item.date === dateFilter;

    return matchesSearch && matchesDate;
  });

  const totalPiecesOut = filteredOutward.reduce((s, o) => s + (Number(o.quantity) || 0), 0);
  const totalAmountValue = filteredOutward.reduce((s, o) => s + (Number(o.totalSaleAmount) || 0), 0);

  // CSV Export
  const exportOutwardCSV = () => {
    const headers = ['Date,Challan No,Article Code,Article Name,Quantity Out,Customer,Destination,Gate Pass,Recorded By\n'];
    const rows = filteredOutward.map(o => 
      `"${o.date}","${o.challanNo}","${o.articleNo}","${o.articleName}",${o.quantity},"${o.customerName}","${o.destination}","${o.gatePassNo}","${o.recordedBy}"`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Khan_Clothes_Outward_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Warehouse Outward & Dispatch Log</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {outward.length} Dispatches
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log of stock leaving warehouse for wholesale customers, outlets, and challans
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadOutwardLogPDF(filteredOutward)}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            title="Download Professional PDF Dispatches Log"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={exportOutwardCSV}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsNewOutwardOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Stock Outward</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total Dispatched Pieces</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Stock reduced from warehouse</div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 truncate">
            {Math.round(totalPiecesOut).toLocaleString()} pcs
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Dispatch Challans</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Bilty / Gate pass vouchers</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {filteredOutward.length} Challans
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Wholesale Value (Approx)</span>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">Sale Rate</span>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Dispatched merchandise value</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white truncate" title={`Rs. ${Math.round(totalAmountValue).toLocaleString()}`}>
            Rs. {Math.round(totalAmountValue).toLocaleString()}
          </div>
          {totalAmountValue > 0 && (
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate mt-0.5">
              {formatLakhCrore(totalAmountValue)}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Article Code (e.g. BF411), Customer, Challan #, Market..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-hidden transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-hidden"
            />
            {dateFilter && (
              <button
                onClick={() => {
                  setDateFilter('');
                  setPage(1);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Outward Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Challan / Gate Pass</th>
                <th className="py-3 px-4">Article Code</th>
                <th className="py-3 px-4">Article Description</th>
                <th className="py-3 px-4 text-right">Quantity Out</th>
                <th className="py-3 px-4">Customer & Market</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredOutward.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-medium">
                    No outward dispatch entries found.
                  </td>
                </tr>
              ) : (
                filteredOutward.slice((page - 1) * pageSize, page * pageSize).map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                      {item.date}
                    </td>

                    {/* Challan & Gate Pass */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.challanNo}</div>
                      <div className="text-[10px] text-slate-400">Gate Pass: {item.gatePassNo}</div>
                    </td>

                    {/* Article Code */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          const art = articles.find(a => a.articleNo === item.articleNo);
                          if (art) setSelectedArticleDetail(art);
                        }}
                        className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white transition-colors"
                        title="Click to view full article ledger"
                      >
                        {item.articleNo}
                      </button>
                    </td>

                    {/* Article Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {item.articleName}
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    {/* Quantity Out */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                      -{item.quantity?.toLocaleString()} pcs
                    </td>

                    {/* Customer & Destination */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.customerName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.destination}</div>
                    </td>

                    {/* Unit Rate */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {item.unitSalePrice ? `Rs. ${item.unitSalePrice.toLocaleString()}` : '—'}
                    </td>

                    {/* Recorded By */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {item.recordedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 10-Item Pagination */}
        <Pagination
          currentPage={page}
          totalItems={filteredOutward.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="dispatches"
        />
      </div>

    </div>
  );
};
