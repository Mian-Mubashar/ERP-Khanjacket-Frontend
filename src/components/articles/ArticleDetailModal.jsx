import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Truck,
  Ship,
  Download,
  MapPin,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes
} from 'lucide-react';
import { Pagination } from '../common/Pagination';
import { downloadArticleStockPDF } from '../../utils/pdfGenerator';
import { confirmDelete, showToast, showError } from '../../utils/sweetalert';

export const ArticleDetailModal = () => {
  const {
    selectedArticleDetail,
    setSelectedArticleDetail,
    purchases = [],
    outward = [],
    setIsNewOutwardOpen,
    setSelectedArticleForOutward,
    setEditingArticle,
    setIsEditArticleOpen,
    deleteArticle
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary' | 'purchases' | 'outward'
  const [purPage, setPurPage] = useState(1);
  const [outPage, setOutPage] = useState(1);
  const pageSize = 10;

  if (!selectedArticleDetail) return null;

  const art = selectedArticleDetail;

  const handleDeleteArticle = async () => {
    const isConfirmed = await confirmDelete({
      title: `Delete Article ${art.articleNo}?`,
      text: `Are you sure you want to delete "${art.name}" (${art.articleNo})? This will permanently remove it from the warehouse catalog.`,
      confirmButtonText: 'Yes, Delete Article'
    });

    if (!isConfirmed) return;

    const res = await deleteArticle(art.articleNo);
    if (res?.success) {
      showToast(`Article "${art.articleNo}" deleted successfully!`, 'success');
      setSelectedArticleDetail(null);
    } else {
      showError('Cannot Delete Article', res?.message || 'Failed to delete article');
    }
  };

  // Find all purchase invoices that contain this article
  const articlePurchases = purchases.filter(p => 
    p.items && p.items.some(item => (item.articleNo || '').toUpperCase() === art.articleNo.toUpperCase())
  ).map(p => {
    const item = p.items.find(i => (i.articleNo || '').toUpperCase() === art.articleNo.toUpperCase());
    return {
      purchaseId: p.id,
      invoiceNo: p.invoiceNo,
      purchaseDate: p.purchaseDate,
      supplierName: p.supplierName,
      quantity: item.quantity,
      unitCost: item.unitCost,
      total: item.total,
      containerNo: p.containerNo
    };
  });

  // Find all outward dispatches for this article
  const articleOutward = outward.filter(o => 
    (o.articleNo || '').toUpperCase() === art.articleNo.toUpperCase()
  );

  // Combine inward and outward into a chronological stock timeline
  const timelineEvents = [
    ...articlePurchases.map(p => ({
      type: 'INWARD',
      date: p.purchaseDate,
      ref: `Invoice #${p.invoiceNo}`,
      party: p.supplierName,
      qty: p.quantity,
      unitPrice: p.unitCost,
      details: `Container: ${p.containerNo || 'Cargo'}`
    })),
    ...articleOutward.map(o => ({
      type: 'OUTWARD',
      date: o.date,
      ref: `Challan #${o.challanNo}`,
      party: `${o.customerName || 'Customer'} (${o.destination || 'City'})`,
      qty: o.quantity,
      unitPrice: o.unitSalePrice,
      details: `Gate Pass: ${o.gatePassNo || 'N/A'}`
    }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const totalValue = (Number(art.currentStock) || 0) * (Number(art.unitCost) || 0);

  const handleOpenDispatch = () => {
    if (setSelectedArticleForOutward) setSelectedArticleForOutward(art);
    setSelectedArticleDetail(null);
    setIsNewOutwardOpen(true);
  };

  const handleOpenEdit = () => {
    setEditingArticle(art);
    setIsEditArticleOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Simple & Clean */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 font-mono font-bold text-xs text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60">
                {art.articleNo}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {art.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Category: <strong>{art.category || 'Jacket'}</strong></span>
              <span>•</span>
              <span>Stuff: <strong>{art.stuff || 'Standard'}</strong></span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{art.warehouseLocation || 'General Storage'}</span>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              title="Edit Article Details"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteArticle}
              className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              title="Delete Article"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => downloadArticleStockPDF(art, articlePurchases, articleOutward)}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 font-medium shadow-2xs cursor-pointer"
              title="Download Stock Ledger PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedArticleDetail(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Core Highlight KPI Cards (Total Purchased, Total Out, Current Stock) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          
          {/* Total Purchased */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Inward Purchased
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {(Number(art.totalPurchased) || 0).toLocaleString()} pcs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Cost: Rs. {(Number(art.unitCost) || 0).toLocaleString()} / pc
            </div>
          </div>

          {/* Total Out */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Outward Dispatched
            </span>
            <div className="text-lg font-bold font-mono text-slate-600 dark:text-slate-300 mt-0.5">
              {(Number(art.totalOut) || 0).toLocaleString()} pcs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {articleOutward.length} Challan dispatches
            </div>
          </div>

          {/* Current Stock */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Available in Warehouse
            </span>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {(Number(art.currentStock) || 0).toLocaleString()} pcs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Valuation: Rs. {totalValue.toLocaleString()}
            </div>
          </div>

        </div>

        {/* Sub-tabs and Record Outward CTA */}
        <div className="px-6 pt-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex space-x-1 sm:space-x-2">
            {[
              { id: 'summary', label: 'Timeline & Movements', count: timelineEvents.length },
              { id: 'purchases', label: 'China Purchases', count: articlePurchases.length },
              { id: 'outward', label: 'Outward Dispatches', count: articleOutward.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleOpenDispatch}
            className="mb-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Dispatch Outward</span>
          </button>
        </div>

        {/* Tab Content Body - Flexible Scrollable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* 1. Combined Timeline */}
          {activeSubTab === 'summary' && (
            <div className="space-y-2.5">
              {timelineEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No stock movements recorded yet.
                </div>
              ) : (
                timelineEvents.map((evt, idx) => {
                  const isInward = evt.type === 'INWARD';
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isInward ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {isInward ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{evt.ref}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isInward ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {isInward ? 'China Inward' : 'Outward Dispatch'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {evt.party} • {evt.details}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-bold font-mono ${
                          isInward ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {isInward ? '+' : '-'}{evt.qty.toLocaleString()} pcs
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {evt.date}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. Purchases History */}
          {activeSubTab === 'purchases' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">China Vendor</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {articlePurchases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No China purchase invoices recorded for this article.
                        </td>
                      </tr>
                    ) : (
                      articlePurchases.slice((purPage - 1) * pageSize, purPage * pageSize).map((pur, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">{pur.purchaseDate}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{pur.invoiceNo}</td>
                          <td className="py-2.5 px-3 text-slate-900 dark:text-white font-medium">{pur.supplierName}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {pur.quantity.toLocaleString()} pcs
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            Rs. {pur.unitCost.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            Rs. {pur.total.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {articlePurchases.length > pageSize && (
                <Pagination
                  currentPage={purPage}
                  totalItems={articlePurchases.length}
                  pageSize={pageSize}
                  onPageChange={setPurPage}
                  itemLabel="purchases"
                />
              )}
            </div>
          )}

          {/* 3. Outward Dispatches */}
          {activeSubTab === 'outward' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Challan No</th>
                      <th className="py-2.5 px-3">Customer / Muqam</th>
                      <th className="py-2.5 px-3 text-right">Dispatched</th>
                      <th className="py-2.5 px-3 text-right">Gate Pass</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {articleOutward.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No outward dispatches recorded for this article.
                        </td>
                      </tr>
                    ) : (
                      articleOutward.slice((outPage - 1) * pageSize, outPage * pageSize).map((out, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">{out.date}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{out.challanNo}</td>
                          <td className="py-2.5 px-3 text-slate-900 dark:text-white">
                            <span className="font-semibold">{out.customerName}</span>
                            {out.destination && (
                              <span className="text-slate-400 text-[11px] ml-1.5">({out.destination})</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {out.quantity.toLocaleString()} pcs
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500 whitespace-nowrap">{out.gatePassNo || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {articleOutward.length > pageSize && (
                <Pagination
                  currentPage={outPage}
                  totalItems={articleOutward.length}
                  pageSize={pageSize}
                  onPageChange={setOutPage}
                  itemLabel="dispatches"
                />
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 dark:text-slate-400 font-mono">
            Purchased ({art.totalPurchased || 0}) − Dispatched ({art.totalOut || 0}) = Available Stock ({art.currentStock || 0} pcs)
          </div>
          <button
            type="button"
            onClick={() => setSelectedArticleDetail(null)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close Record
          </button>
        </div>

      </div>
    </div>
  );
};
