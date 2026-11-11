import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Package, 
  AlertCircle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { showToast } from '../../utils/sweetalert';
import { SearchableSelect } from '../common/SearchableSelect';

const getTodayDate = () => new Date().toISOString().split('T')[0];
const generateReturnSlipNo = () => `SR-${Date.now().toString().slice(-4)}`;

export const RecordMaalWapsiModal = () => {
  const {
    isRecordMaalWapsiOpen,
    setIsRecordMaalWapsiOpen,
    customers = [],
    articles = [],
    selectedCustomerForWapsi,
    setSelectedCustomerForWapsi,
    recordCustomerReturn
  } = useApp();

  const [customerId, setCustomerId] = useState('');
  const [articleNo, setArticleNo] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [reason, setReason] = useState('Unsold / Stock Return');
  const [restoreStock, setRestoreStock] = useState(true);
  const [date, setDate] = useState(getTodayDate);
  const [returnSlipNo, setReturnSlipNo] = useState(generateReturnSlipNo);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync when modal opens or customer is preselected
  useEffect(() => {
    if (isRecordMaalWapsiOpen) {
      setReturnSlipNo(generateReturnSlipNo());
      setDate(getTodayDate());
      setErrorMsg('');
      setQuantity(1);
      setRestoreStock(true);
      setReason('Unsold / Stock Return');
      setNotes('');

      if (selectedCustomerForWapsi) {
        setCustomerId(selectedCustomerForWapsi.id);
      } else if (customers.length > 0) {
        setCustomerId(prev => prev || customers[0].id);
      }

      if (articles.length > 0 && !articleNo) {
        setArticleNo(articles[0].articleNo);
        setUnitPrice(articles[0].unitSalePrice || articles[0].unitCost || 0);
      }
    }
  }, [isRecordMaalWapsiOpen, selectedCustomerForWapsi, customers, articles]);

  // When article changes, set default unit price
  const handleArticleChange = (selectedNo) => {
    setArticleNo(selectedNo);
    const art = articles.find(a => a.articleNo === selectedNo);
    if (art) {
      setUnitPrice(art.unitSalePrice || art.unitCost || 0);
    }
  };

  if (!isRecordMaalWapsiOpen) return null;

  const currentCustomer = customers.find(c => c.id === customerId) || customers[0];
  const currentArticle = articles.find(a => a.articleNo === articleNo);

  const oldBalance = Number(currentCustomer?.remainingBalance || 0);
  const qtyNum = Math.max(1, parseInt(quantity, 10) || 1);
  const priceNum = Math.max(0, Number(unitPrice) || 0);
  const totalReturnAmount = qtyNum * priceNum;
  const newBalance = oldBalance - totalReturnAmount;

  // Options for SearchableSelect
  const customerOptions = customers.map(c => ({
    value: c.id,
    label: `${c.shopName} ${c.shopkeeperName ? `(${c.shopkeeperName})` : ''} - ${c.city || ''} [Balance: Rs. ${Number(c.remainingBalance || 0).toLocaleString()}]`
  }));

  const articleOptions = articles.map(a => ({
    value: a.articleNo,
    label: `${a.articleNo} — ${a.name} (${a.category || 'General'}) [Stock: ${a.currentStock || 0} pcs]`
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerId) {
      setErrorMsg('Please select a customer / shopkeeper.');
      return;
    }

    if (!articleNo) {
      setErrorMsg('Please select an article / garment model.');
      return;
    }

    if (qtyNum <= 0) {
      setErrorMsg('Quantity must be at least 1 piece.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await recordCustomerReturn({
        customerId,
        articleNo,
        quantity: qtyNum,
        unitPrice: priceNum,
        reason,
        restoreStock,
        date,
        returnSlipNo,
        notes: notes.trim() || null
      });

      if (res?.success) {
        showToast(
          `Sales return recorded! Rs. ${totalReturnAmount.toLocaleString()} credited to ${currentCustomer?.shopName || 'Customer'} khata.`,
          'success'
        );
        handleClose();
      } else {
        setErrorMsg(res?.message || 'Failed to record sales return');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving sales return');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsRecordMaalWapsiOpen(false);
    setSelectedCustomerForWapsi(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Clean, professional, exact same style as Add Customer Modal */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Sales Return (Credit Note)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record returned goods, deduct from customer khata balance, and restock warehouse
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          {/* Scrollable Form Body with comfortable vertical spacing */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Row 1: Customer Select & Garment Article Select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Shopkeeper / Customer <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={customerOptions}
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Select or search customer..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Garment Article <span className="text-rose-500">*</span>
                  </label>
                  {currentArticle && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      In Stock: <strong className="text-slate-700 dark:text-slate-200">{currentArticle.currentStock || 0} pcs</strong>
                    </span>
                  )}
                </div>
                <SearchableSelect
                  options={articleOptions}
                  value={articleNo}
                  onChange={handleArticleChange}
                  placeholder="Select or search garment article..."
                />
              </div>
            </div>

            {/* Row 2: Quantity & Unit Return Rate (Rs.) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Return Quantity (Pieces) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Pieces
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Unit Return Rate (Price / Dar) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={unitPrice}
                    onChange={e => setUnitPrice(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Return Reason & Return Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Return Reason
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                >
                  <option value="Unsold / Stock Return">Unsold / Overstock Return</option>
                  <option value="Defective / Damaged Goods">Defective / Damaged Goods</option>
                  <option value="Size / Fitting Mismatch">Size / Fitting Mismatch</option>
                  <option value="Color / Design Exchange">Color / Design Exchange</option>
                  <option value="Order Cancelled">Order Cancelled</option>
                  <option value="Other">Other / Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Return Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Row 4: Return Slip # & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Return Slip / Reference #
                </label>
                <input
                  type="text"
                  value={returnSlipNo}
                  onChange={e => setReturnSlipNo(e.target.value)}
                  placeholder="e.g. SR-1042"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Wholesale return credited to customer account"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Row 5: Clean Highlighted Card for Restock & Live Balance Adjustment */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    Total Return Credit
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                    Rs. {totalReturnAmount.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    Customer Khata Balance
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-slate-400 line-through">Rs. {oldBalance.toLocaleString()}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                    <span className={`font-bold ${newBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      Rs. {Math.max(0, newBalance).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    Warehouse Inventory
                  </span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    <span>{restoreStock ? `+${qtyNum} Pcs (${articleNo || 'Garment'})` : 'No Stock Change'}</span>
                  </span>
                </div>
              </div>

              {/* Restock Toggle */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={restoreStock}
                    onChange={e => setRestoreStock(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Restock returned pieces into warehouse inventory
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Automatically adds {qtyNum} pcs back to {articleNo || 'the selected article'} stock count
                    </span>
                  </div>
                </label>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  restoreStock 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {restoreStock ? '✓ Stock Restored' : 'Khata Only'}
                </span>
              </div>
            </div>

          </div>

          {/* Fixed Footer Bar - ALWAYS visible outside the scrollable body */}
          <div className="shrink-0 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Return...' : 'Save Sales Return'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
