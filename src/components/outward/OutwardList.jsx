import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowUpRight,
  Plus,
  Search,
  Download,
  Calendar,
  Truck,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { downloadOutwardLogPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';
import { formatLakhCrore } from '../../utils/formatters';
import { confirmDelete, showToast, showError } from '../../utils/sweetalert';

export const OutwardList = () => {
  const { outward, setIsNewOutwardOpen, setSelectedArticleDetail, articles, updateOutward, deleteOutward } = useApp();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 3-Dots Dropdown State
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    date: '',
    challanNo: '',
    gatePassNo: '',
    quantity: 0,
    unitSalePrice: 0,
    destination: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Close active dropdown on scroll or click outside
  useEffect(() => {
    const handleClose = () => setActiveDropdown(null);
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

  const handleToggleDropdown = (e, item) => {
    e.stopPropagation();
    if (activeDropdown?.id === item.id) {
      setActiveDropdown(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = rect.bottom + 6;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      top = rect.top - dropdownHeight - 6;
    }
    const width = 175;
    const left = Math.max(10, rect.right - width);

    setActiveDropdown({
      id: item.id,
      item,
      top,
      left
    });
  };

  const handleStartEdit = (item) => {
    setActiveDropdown(null);
    setEditError('');
    setEditForm({
      date: item.date || '',
      challanNo: item.challanNo || '',
      gatePassNo: item.gatePassNo || '',
      quantity: item.quantity || 0,
      unitSalePrice: item.unitSalePrice || 0,
      destination: item.destination || '',
      notes: item.notes || ''
    });
    setEditingItem(item);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    const qty = Number(editForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      setEditError('Please enter a valid quantity greater than 0');
      return;
    }
    const rate = Number(editForm.unitSalePrice);
    if (isNaN(rate) || rate < 0) {
      setEditError('Please enter a valid unit rate');
      return;
    }

    setIsSubmitting(true);
    setEditError('');
    try {
      const res = await updateOutward(editingItem.id, {
        date: editForm.date,
        challanNo: editForm.challanNo,
        gatePassNo: editForm.gatePassNo,
        quantity: qty,
        unitSalePrice: rate,
        destination: editForm.destination,
        notes: editForm.notes
      });

      if (res?.success) {
        showToast(`Challan #${editForm.challanNo} updated successfully!`, 'success');
        setEditingItem(null);
      } else {
        setEditError(res?.message || 'Failed to update dispatch record');
      }
    } catch (err) {
      setEditError(err.message || 'Error updating dispatch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    setActiveDropdown(null);
    const ok = await confirmDelete({
      title: 'Delete Outward Dispatch?',
      text: `Are you sure you want to delete Challan #${item.challanNo} (${item.quantity} pcs)? Warehouse godam stock will be restored and customer khata balance will be reverted.`,
      confirmButtonText: 'Yes, Delete Dispatch'
    });

    if (ok) {
      const res = await deleteOutward(item.id);
      if (res?.success) {
        showToast(`Challan #${item.challanNo} deleted & stock restored!`, 'success');
      } else {
        showError(res?.message || 'Failed to delete dispatch');
      }
    }
  };

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
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredOutward.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
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

                    {/* Actions Column: Clean Centered 3-Dots Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleDropdown(e, item)}
                        className={`w-8 h-8 rounded-lg border transition-all inline-flex items-center justify-center shadow-2xs cursor-pointer ${
                          activeDropdown?.id === item.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Actions Menu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
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

      {/* Floating 3-Dots Action Dropdown Menu (Fixed Viewport-Aware, Never Clipped) */}
      {activeDropdown && (
        <div
          style={{
            position: 'fixed',
            top: `${activeDropdown.top}px`,
            left: `${activeDropdown.left}px`,
            width: '180px',
            zIndex: 99999
          }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl py-1.5 text-left outward-action-menu animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
            Challan #{activeDropdown.item.challanNo}
          </div>

          <button
            type="button"
            onClick={() => handleStartEdit(activeDropdown.item)}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => handleDelete(activeDropdown.item)}
            className="w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete Dispatch</span>
          </button>
        </div>
      )}

      {/* Edit Outward Dispatch Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Dispatch Challan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingItem.articleNo} ({editingItem.articleName}) • {editingItem.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Challan #
                  </label>
                  <input
                    type="text"
                    value={editForm.challanNo}
                    onChange={e => setEditForm(prev => ({ ...prev, challanNo: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Quantity Out (Pcs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.quantity}
                    onChange={e => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Unit Rate (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.unitSalePrice}
                    onChange={e => setEditForm(prev => ({ ...prev, unitSalePrice: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Gate Pass # (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.gatePassNo}
                    onChange={e => setEditForm(prev => ({ ...prev, gatePassNo: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Delivery Destination / Market
                  </label>
                  <input
                    type="text"
                    value={editForm.destination}
                    onChange={e => setEditForm(prev => ({ ...prev, destination: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Transport Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Sent via Faisal Goods, Bilty #123"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-blue-600"
                />
              </div>

              {/* Live Calculation Box */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Calculated Total Bill</span>
                  <span className="text-sm font-bold font-mono text-blue-700 dark:text-blue-400">
                    Rs. {(Math.max(0, Number(editForm.quantity) || 0) * Math.max(0, Number(editForm.unitSalePrice) || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 text-right max-w-[200px]">
                  Warehouse stock & customer balance will auto-reconcile
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
