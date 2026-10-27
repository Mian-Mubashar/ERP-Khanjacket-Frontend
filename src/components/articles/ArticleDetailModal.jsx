import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  DollarSign,
  Calendar,
  Download,
  Clock,
  Layers,
  ChevronRight,
  Ship,
  Truck,
  Shirt,
  Pencil,
  MapPin,
  Trash2
} from 'lucide-react';
import { downloadArticleStockPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';
import { confirmDelete, showToast, showError } from '../../utils/sweetalert';

export const ArticleDetailModal = () => {
  const { 
    selectedArticleDetail, 
    setSelectedArticleDetail, 
    setEditingArticle,
    setIsEditArticleOpen,
    purchases, 
    outward,
    setIsNewOutwardOpen,
    setIsNewPurchaseOpen,
    deleteArticle
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary' | 'purchases' | 'outward'
  const [purPage, setPurPage] = useState(1);
  const [outPage, setOutPage] = useState(1);
  const pageSize = 10;

  if (!selectedArticleDetail) return null;

  const art = selectedArticleDetail;

  const handleDeleteArticle = async () => {
    if (!art) return;
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
    p.items && p.items.some(item => item.articleNo.toUpperCase() === art.articleNo.toUpperCase())
  ).map(p => {
    const item = p.items.find(i => i.articleNo.toUpperCase() === art.articleNo.toUpperCase());
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
    o.articleNo.toUpperCase() === art.articleNo.toUpperCase()
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
      details: `Container: ${p.containerNo || 'Standard Cargo'}`
    })),
    ...articleOutward.map(o => ({
      type: 'OUTWARD',
      date: o.date,
      ref: `Challan #${o.challanNo}`,
      party: `${o.customerName} (${o.destination})`,
      qty: o.quantity,
      unitPrice: o.unitSalePrice,
      details: `Gate Pass: ${o.gatePassNo || 'N/A'}`
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalValue = (art.currentStock || 0) * (art.unitCost || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 font-mono font-bold text-xs tracking-wider text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                {art.articleNo}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {art.category}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {art.stuff || 'Standard Fabric'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span>{art.warehouseLocation || 'General Storage'}</span>
              </span>
              <span className="text-xs text-slate-400">
                Article Stock Register
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{art.name}</h2>
            {art.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">{art.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingArticle(art);
                setIsEditArticleOpen(true);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 font-medium cursor-pointer"
              title="Edit Article Name, Stuff, Cost & Alert Stock"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteArticle}
              className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-all flex items-center gap-1.5 font-medium cursor-pointer"
              title="Delete Article"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => downloadArticleStockPDF(art, articlePurchases, articleOutward)}
              className="px-3.5 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs font-medium cursor-pointer"
              title="Download Professional Stock Ledger PDF"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedArticleDetail(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Core Highlight KPI Cards (Strictly as specified by client) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          
          {/* Total Purchased */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Purchased</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Ship className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs text-slate-400 mb-2 font-medium">Bought from China</div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {art.totalPurchased?.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">pcs</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              Unit Cost: <strong className="text-slate-800 dark:text-slate-200 font-mono">Rs. {art.unitCost?.toLocaleString()}</strong>
            </div>
          </div>

          {/* Total Out */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Out</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs text-slate-400 mb-2 font-medium">Warehouse Dispatched</div>
            <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {art.totalOut?.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">pcs</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              Dispatched Ratio:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {art.totalPurchased > 0 ? Math.round((art.totalOut / art.totalPurchased) * 100) : 0}% of Inward
              </strong>
            </div>
          </div>

          {/* Current Stock */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-emerald-500/50 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Current Stock</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shirt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-500 mb-2 font-medium flex items-center justify-between">
              <span>Available in Warehouse</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                <MapPin className="w-2.5 h-2.5 text-amber-500" />
                {art.warehouseLocation || 'Main Godown - Hall A'}
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {art.currentStock?.toLocaleString()}{' '}
              <span className="text-xs font-normal text-emerald-600/70">pcs</span>
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px] text-slate-600 dark:text-slate-400 flex justify-between">
              <span>Stock Value:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono">
                Rs. {totalValue.toLocaleString()}
              </strong>
            </div>
          </div>

        </div>

        {/* Sub-tabs for History */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex space-x-2">
            {[
              { id: 'summary', label: 'Timeline & Movements', count: timelineEvents.length },
              { id: 'purchases', label: 'China Purchases', count: articlePurchases.length },
              { id: 'outward', label: 'Outward Dispatches', count: articleOutward.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
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

          <div className="hidden sm:flex items-center gap-2 pb-2">
            <button
              onClick={() => {
                setSelectedArticleDetail(null);
                setIsNewOutwardOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Record Outward</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-80 overflow-y-auto">
          
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
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isInward ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {isInward ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{evt.ref}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isInward ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              {isInward ? 'China Import' : 'Dispatch'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {evt.party} • {evt.details}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-bold font-mono ${
                          isInward ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5 font-semibold">Date</th>
                    <th className="pb-2.5 font-semibold">Invoice No</th>
                    <th className="pb-2.5 font-semibold">Supplier</th>
                    <th className="pb-2.5 font-semibold text-right">Quantity</th>
                    <th className="pb-2.5 font-semibold text-right">Unit Cost</th>
                    <th className="pb-2.5 font-semibold text-right">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {articlePurchases.slice((purPage - 1) * pageSize, purPage * pageSize).map((pur, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{pur.purchaseDate}</td>
                      <td className="py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{pur.invoiceNo}</td>
                      <td className="py-2.5 text-slate-900 dark:text-white font-medium">{pur.supplierName}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                        {pur.quantity.toLocaleString()} pcs
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        Rs. {pur.unitCost.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {pur.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                currentPage={purPage}
                totalItems={articlePurchases.length}
                pageSize={pageSize}
                onPageChange={setPurPage}
                itemLabel="purchases"
              />
            </div>
          )}

          {/* 3. Outward Dispatches */}
          {activeSubTab === 'outward' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5 font-semibold">Date</th>
                    <th className="pb-2.5 font-semibold">Challan No</th>
                    <th className="pb-2.5 font-semibold">Customer / Destination</th>
                    <th className="pb-2.5 font-semibold text-right">Quantity Out</th>
                    <th className="pb-2.5 font-semibold text-right">Gate Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {articleOutward.slice((outPage - 1) * pageSize, outPage * pageSize).map((out, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{out.date}</td>
                      <td className="py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">{out.challanNo}</td>
                      <td className="py-2.5 text-slate-900 dark:text-white">
                        <div className="font-medium">{out.customerName}</div>
                        <div className="text-[10px] text-slate-400">{out.destination}</div>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {out.quantity.toLocaleString()} pcs
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-500">{out.gatePassNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                currentPage={outPage}
                totalItems={articleOutward.length}
                pageSize={pageSize}
                onPageChange={setOutPage}
                itemLabel="dispatches"
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Calculation: Purchased ({art.totalPurchased}) − Out ({art.totalOut}) = Stock ({art.currentStock})
          </div>
          <button
            onClick={() => setSelectedArticleDetail(null)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Record
          </button>
        </div>

      </div>
    </div>
  );
};
