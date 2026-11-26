import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  Warehouse,
  ShoppingBag,
  Search,
  Calendar,
  Download,
  ReceiptText,
  Boxes,
  Truck,
  RotateCcw,
  Pencil,
  Trash2,
  BookOpen,
  AlertCircle,
  Loader2,
  Check,
  X,
  MoreVertical,
  FileText
} from 'lucide-react';
import { formatCleanBillNo, downloadShopStockFlowPDF } from '../../utils/pdfGenerator';
import { Pagination } from '../common/Pagination';
import { formatLakhCrore } from '../../utils/formatters';
import { confirmDelete, showToast, showError } from '../../utils/sweetalert';

const SHOPS = [
  {
    id: 'khan',
    name: 'Khan Jacket House',
    code: 'KJH',
    description: 'Main outlet and jacket wholesale shop',
    match: ['khan jacket', 'khan jacket house', 'khan jkt', 'khan jkt house', 'kj house', 'k.j house', 'k j house', 'khan jacket shop']
  },
  {
    id: 'mk',
    name: 'MK Collection',
    code: 'MKC',
    description: 'Secondary retail and branch collection store',
    match: ['mk collection', 'mk-collection', 'mkcollection', 'mk coll']
  }
];

function isRecordMatchingShop(record, shopId) {
  if (!record) return false;
  const custName = (record.customerName || '').trim().toLowerCase();
  const dest = (record.destination || '').trim().toLowerCase();
  const nts = (record.notes || '').trim().toLowerCase();

  if (shopId === 'khan') {
    const isShopDest = dest.includes('khan jacket house outlet') || dest.includes('khan jacket outlet') || dest === 'khan jacket house' || dest === 'khan jacket';
    const isShopTransferNote = nts.includes('warehouse to khan jacket') || nts.includes('stock transfer to khan jacket') || (nts.includes('stock transfer') && custName.includes('khan'));
    const isExactCustomer = (custName === 'khan jacket house' || custName === 'khan jacket' || custName === 'khan jacket shop') && (!record.customerId || record.customerId === 'SHOP_KHAN');
    return isShopDest || isShopTransferNote || isExactCustomer;
  }

  if (shopId === 'mk') {
    const isShopDest = dest.includes('mk collection outlet') || dest.includes('mk outlet') || dest === 'mk collection';
    const isShopTransferNote = nts.includes('warehouse to mk collection') || nts.includes('stock transfer to mk') || (nts.includes('stock transfer') && custName.includes('mk'));
    const isExactCustomer = (custName === 'mk collection' || custName === 'mk-collection' || custName === 'mkcollection') && (!record.customerId || record.customerId === 'SHOP_MK');
    return isShopDest || isShopTransferNote || isExactCustomer;
  }

  return false;
}

// Helper to classify record movement direction
function getRecordMovement(record, shopId) {
  return {
    type: 'INWARD',
    label: 'Warehouse Transfer',
    badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  };
}

export const ShopStockFlowView = () => {
  const {
    outward = [],
    customers = [],
    updateOutward,
    deleteOutward,
    canEdit,
    canDelete,
    isViewer,
    setSelectedDispatchForBill,
    setSelectedCustomerKhata,
    setIsRecordMaalWapsiOpen,
    setSelectedCustomerForWapsi
  } = useApp();

  // Selected Shop Radio ('khan' | 'mk') - Default to Khan Jacket House
  const [selectedShop, setSelectedShop] = useState('khan');

  // Movement Filter ('ALL' | 'INWARD' | 'SALE')
  const [movementFilter, setMovementFilter] = useState('ALL');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 3-Dots Dropdown State
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close active dropdown on scroll, window resize, or click outside
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
    const dropdownHeight = 170;
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = rect.bottom + 6;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      top = rect.top - dropdownHeight - 6;
    }
    const width = 180;
    const left = Math.max(10, rect.right - width);
    setActiveDropdown({ id: item.id, item, top, left });
  };

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

  const currentShopInfo = SHOPS.find(s => s.id === selectedShop) || SHOPS[0];

  // Filter raw outward records for the currently selected shop
  const shopRecords = useMemo(() => {
    return outward.filter(item => {
      // 1. Must match selected shop keywords
      if (!isRecordMatchingShop(item, selectedShop)) return false;

      // 2. Movement filter
      if (movementFilter !== 'ALL') {
        const mov = getRecordMovement(item, selectedShop);
        if (mov.type !== movementFilter) return false;
      }

      // 3. Date filters
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;

      return true;
    });
  }, [outward, selectedShop, movementFilter, dateFrom, dateTo]);

  // Search filter
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return shopRecords;
    const q = search.toLowerCase();
    return shopRecords.filter(item => 
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.articleNo && item.articleNo.toLowerCase().includes(q)) ||
      (item.articleName && item.articleName.toLowerCase().includes(q)) ||
      (item.challanNo && String(item.challanNo).toLowerCase().includes(q)) ||
      (item.destination && item.destination.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  }, [shopRecords, search]);

  // Aggregate KPI summary for the selected shop (all records without movement filter)
  const kpis = useMemo(() => {
    let totalPcs = 0;
    let totalAmount = 0;
    let inwardPcs = 0;
    let inwardAmount = 0;
    let salePcs = 0;
    let saleAmount = 0;
    const customerSet = new Set();
    const articleSet = new Set();

    // Check against all records for this shop within date range
    const allShopRecords = outward.filter(item => {
      if (!isRecordMatchingShop(item, selectedShop)) return false;
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      return true;
    });

    allShopRecords.forEach(item => {
      const pcs = Number(item.quantity) || 0;
      const amt = Number(item.totalSaleAmount) || 0;
      totalPcs += pcs;
      totalAmount += amt;

      const mov = getRecordMovement(item, selectedShop);
      if (mov.type === 'INWARD') {
        inwardPcs += pcs;
        inwardAmount += amt;
      } else {
        salePcs += pcs;
        saleAmount += amt;
      }

      if (item.customerName) customerSet.add(item.customerName.trim());
      if (item.articleNo) articleSet.add(item.articleNo.trim());
    });

    return {
      totalBills: allShopRecords.length,
      totalPcs,
      totalAmount,
      inwardPcs,
      inwardAmount,
      salePcs,
      saleAmount,
      totalCustomers: customerSet.size,
      totalArticles: articleSet.size
    };
  }, [outward, selectedShop, dateFrom, dateTo]);

  // Handle Opening Customer Khata Statement
  const handleOpenCustomerKhata = (item) => {
    if (!item) return;
    const found = (customers || []).find(c => 
      (item.customerId && String(c.id) === String(item.customerId)) ||
      (item.customerName && c.shopName && c.shopName.toLowerCase() === item.customerName.toLowerCase()) ||
      (item.customerName && c.shopkeeperName && item.customerName.toLowerCase().includes(c.shopkeeperName.toLowerCase()))
    );

    if (found) {
      setSelectedCustomerKhata(found);
    } else {
      setSelectedCustomerKhata({
        id: item.customerId || `cust-${Date.now()}`,
        shopName: item.customerName || 'Customer Khata',
        shopkeeperName: item.customerName || 'Customer',
        city: item.destination || item.city || '—',
        phone: item.customerPhone || ''
      });
    }
  };

  // Start Edit Modal
  const handleStartEdit = (item) => {
    setEditError('');
    setEditForm({
      date: item.date ? String(item.date).substring(0, 10) : '',
      challanNo: item.challanNo || '',
      gatePassNo: item.gatePassNo || '',
      quantity: item.quantity || 0,
      unitSalePrice: item.unitSalePrice || 0,
      destination: item.destination || '',
      notes: item.notes || ''
    });
    setEditingItem(item);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    const qty = Number(editForm.quantity);
    if (isNaN(qty) || qty < 0) {
      setEditError('Please enter a valid quantity');
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
        showToast(`Bill #${editForm.challanNo} updated successfully!`, 'success');
        setEditingItem(null);
      } else {
        setEditError(res?.message || 'Failed to update record');
      }
    } catch (err) {
      setEditError(err.message || 'Error updating record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (item) => {
    const ok = await confirmDelete({
      title: 'Delete Dispatch Bill?',
      text: `Are you sure you want to delete Bill #${item.challanNo} (${item.quantity} pcs)? Customer khata balance and stock will be safely reconciled.`,
      confirmButtonText: 'Yes, Delete Bill'
    });

    if (ok) {
      const res = await deleteOutward(item.id);
      if (res?.success) {
        showToast(`Bill #${item.challanNo} deleted successfully!`, 'success');
      } else {
        showError(res?.message || 'Failed to delete bill');
      }
    }
  };

  // Export PDF for currently selected shop
  const exportShopPDF = () => {
    downloadShopStockFlowPDF({
      shopName: currentShopInfo.name,
      shopCode: currentShopInfo.code,
      records: filteredRecords,
      kpis
    });
  };

  // Open Return Modal to return stock from shop back to warehouse
  const handleOpenReturnModal = (item = null) => {
    if (item) {
      const found = (customers || []).find(c => 
        (item.customerId && String(c.id) === String(item.customerId)) ||
        (item.customerName && c.shopName && c.shopName.toLowerCase() === item.customerName.toLowerCase()) ||
        (item.customerName && c.shopkeeperName && item.customerName.toLowerCase().includes(c.shopkeeperName.toLowerCase()))
      );
      if (found) {
        setSelectedCustomerForWapsi(found);
      } else {
        const matchedShopCustomer = (customers || []).find(c =>
          c.shopName && currentShopInfo.match.some(m => c.shopName.toLowerCase().includes(m))
        );
        if (matchedShopCustomer) {
          setSelectedCustomerForWapsi(matchedShopCustomer);
        } else if (customers && customers.length > 0) {
          setSelectedCustomerForWapsi(customers[0]);
        }
      }
    } else {
      // Header button click: find matching shop as customer or first customer
      const matchedShopCustomer = (customers || []).find(c =>
        c.shopName && currentShopInfo.match.some(m => c.shopName.toLowerCase().includes(m))
      );
      if (matchedShopCustomer) {
        setSelectedCustomerForWapsi(matchedShopCustomer);
      } else if (customers && customers.length > 0) {
        setSelectedCustomerForWapsi(customers[0]);
      }
    }
    setIsRecordMaalWapsiOpen(true);
  };

  // Export CSV for currently selected shop
  const exportShopCSV = () => {
    const headers = ['Date,Bill #,Customer Name,Destination,Article Code,Article Description,Quantity,Unit Rate,Total Amount,Notes\n'];
    const rows = filteredRecords.map(item => {
      const q = item.quantity || 0;
      return `${item.date || ''},${item.challanNo || ''},"${item.customerName || ''}","${item.destination || ''}",${item.articleNo || ''},"${item.articleName || ''}",${q},${item.unitSalePrice || 0},${item.totalSaleAmount || 0},"${item.notes || ''}"\n`;
    });

    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentShopInfo.name.replace(/\s+/g, '_')}_Stock_Table.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Shop Stock Flow</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {currentShopInfo.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track stock movements, customer sales, and dispatch bills for each shop
          </p>
        </div>

        {/* Action Buttons: Return to Warehouse, Download PDF, Export CSV */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && !isViewer && (
            <button
              onClick={() => handleOpenReturnModal()}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-xl border border-purple-200 dark:border-purple-800 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
              title="Return stock from shop back to warehouse"
            >
              <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Return to Warehouse</span>
            </button>
          )}

          <button
            onClick={exportShopPDF}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            title="Download PDF report for this shop"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={exportShopCSV}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            title="Export CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Radio Button Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Select Shop to View Table
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Radio 1: Khan Jacket House */}
          <label
            onClick={() => {
              setSelectedShop('khan');
              setPage(1);
            }}
            className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
              selectedShop === 'khan'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <input
              type="radio"
              name="shop_selector"
              checked={selectedShop === 'khan'}
              onChange={() => {
                setSelectedShop('khan');
                setPage(1);
              }}
              className="w-4 h-4 text-blue-600 cursor-pointer accent-blue-600"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold truncate ${
                  selectedShop === 'khan' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                }`}>
                  Khan Jacket House
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  KJH
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Main outlet and jacket wholesale shop records
              </div>
            </div>
          </label>

          {/* Radio 2: MK Collection */}
          <label
            onClick={() => {
              setSelectedShop('mk');
              setPage(1);
            }}
            className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
              selectedShop === 'mk'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <input
              type="radio"
              name="shop_selector"
              checked={selectedShop === 'mk'}
              onChange={() => {
                setSelectedShop('mk');
                setPage(1);
              }}
              className="w-4 h-4 text-blue-600 cursor-pointer accent-blue-600"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold truncate ${
                  selectedShop === 'mk' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                }`}>
                  MK Collection
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  MKC
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Branch collection and customer dispatch records
              </div>
            </div>
          </label>

        </div>
      </div>

      {/* KPI Cards for the Selected Shop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Warehouse Inward Stock (Stock received from warehouse) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Warehouse Stock In</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Received from warehouse</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {kpis.inwardPcs.toLocaleString()} pcs
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate mt-0.5">
            Rs. {Math.round(kpis.inwardAmount).toLocaleString()} transferred
          </div>
        </div>

        {/* Card 2: Customer Sales (Stock sold to customers) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Customer Sales Out</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Sold from this shop</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
            Rs. {Math.round(kpis.saleAmount).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            {kpis.salePcs > 0 ? `${kpis.salePcs.toLocaleString()} pcs • ` : ''}Sales generated
          </div>
        </div>

        {/* Card 3: Total Transactions / Bills */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Total Bills / Challans</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Vouchers & gate passes</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {kpis.totalBills} Bills
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium truncate mt-0.5">
            Total records for {currentShopInfo.code}
          </div>
        </div>

        {/* Card 4: Customers / Parties */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Active Customers</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-2 font-medium">Distinct parties served</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {kpis.totalCustomers} Parties
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            Wholesale & retail clients
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${currentShopInfo.name} bills, customer, article...`}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-hidden transition-all"
          />
        </div>

        {/* Movement Tabs & Date Range */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Movement Filter (All vs Inward vs Sales) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setMovementFilter('ALL');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                movementFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Records
            </button>
            <button
              type="button"
              onClick={() => {
                setMovementFilter('INWARD');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                movementFilter === 'INWARD'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Warehouse Inward
            </button>
            <button
              type="button"
              onClick={() => {
                setMovementFilter('SALE');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                movementFilter === 'SALE'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Customer Sales
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-600"
            />
            <span>—</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-600"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN DATA TABLE FOR THE SELECTED SHOP */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {currentShopInfo.name} — Stock & Sales Table
            </h2>
            <span className="text-xs text-slate-400">
              ({filteredRecords.length} records found)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[90px]">Date</th>
                <th className="py-3 px-4 min-w-[130px]">Movement Type</th>
                <th className="py-3 px-4 min-w-[130px]">Bill # / Challan</th>
                <th className="py-3 px-4 min-w-[120px]">Article Code</th>
                <th className="py-3 px-4 min-w-[160px]">Article Description</th>
                <th className="py-3 px-4 text-right min-w-[110px]">Quantity</th>
                <th className="py-3 px-4 min-w-[180px]">Customer / Market</th>
                <th className="py-3 px-4 text-right min-w-[100px]">Unit Rate</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Total Amount</th>
                <th className="py-3 px-4 text-center min-w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No entries found for {currentShopInfo.name}.
                  </td>
                </tr>
              ) : (
                filteredRecords.slice((page - 1) * pageSize, page * pageSize).map((item) => {
                  const mov = getRecordMovement(item, selectedShop);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {item.date ? String(item.date).substring(0, 10) : '—'}
                      </td>

                      {/* Movement Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${mov.badge}`}>
                          {mov.type === 'INWARD' ? (
                            <>
                              <Warehouse className="w-3 h-3 text-blue-500" />
                              <span>Inward Transfer</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3 h-3 text-emerald-500" />
                              <span>Customer Sale</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Bill # */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            Bill #{formatCleanBillNo(item.challanNo)}
                          </span>
                          {item.isWithoutStock && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80">
                              Direct
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">Gate Pass: {item.gatePassNo || '—'}</div>
                      </td>

                    {/* Article Code */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        {item.articleNo || 'DIRECT'}
                      </span>
                    </td>

                    {/* Article Description */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.articleName || 'Direct Sale'}
                      </div>
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.notes}</div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                      {item.isWithoutStock && (!item.quantity || Number(item.quantity) === 0) ? (
                        <span className="text-slate-400 font-normal text-[11px]">Direct Bill</span>
                      ) : (
                        `${Number(item.quantity || 0).toLocaleString()} pcs`
                      )}
                    </td>

                    {/* Customer & Market (Clickable to open Khata) */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenCustomerKhata(item)}
                        className="text-left font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer transition-colors group flex items-center gap-1.5"
                        title="Click to view Customer Khata Statement"
                      >
                        <span className="truncate max-w-[150px]">{item.customerName || '—'}</span>
                        <BookOpen className="w-3 h-3 text-purple-500 opacity-60 group-hover:opacity-100 shrink-0" />
                      </button>
                      <div className="text-[11px] text-slate-500">{item.destination || item.city || '—'}</div>
                    </td>

                    {/* Unit Rate */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {item.unitSalePrice ? `Rs. ${Number(item.unitSalePrice).toLocaleString()}` : '—'}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      Rs. {Math.round(Number(item.totalSaleAmount || 0)).toLocaleString()}
                    </td>

                    {/* Actions: Clean Centered 3-Dots Button */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
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
                );
              })
            )}
          </tbody>
          {filteredRecords.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                <td colSpan={5} className="py-3 px-4 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Total for {currentShopInfo.name}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-white">
                  {kpis.totalPcs.toLocaleString()} pcs
                </td>
                <td colSpan={2} className="py-3 px-4 text-slate-500 text-right">
                  {filteredRecords.length} Bills
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  Rs. {Math.round(kpis.totalAmount).toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
          </table>
        </div>

        {/* 10-Item Pagination */}
        {filteredRecords.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="bills"
          />
        )}
      </div>

      {/* Floating 3-Dots Action Dropdown Menu */}
      {activeDropdown && (
        <div
          style={{
            position: 'fixed',
            top: `${activeDropdown.top}px`,
            left: `${activeDropdown.left}px`,
            width: '185px',
            zIndex: 99999
          }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl py-1.5 text-left outward-action-menu animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
            Bill #{formatCleanBillNo(activeDropdown.item.challanNo)}
          </div>

          {/* 1. Show Bill Voucher */}
          <button
            type="button"
            onClick={() => {
              setSelectedDispatchForBill && setSelectedDispatchForBill(activeDropdown.item);
              setActiveDropdown(null);
            }}
            className="w-full px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800"
          >
            <ReceiptText className="w-3.5 h-3.5 text-blue-500" />
            <span>Show Bill (Parcha)</span>
          </button>

          {/* 2. Customer Khata */}
          <button
            type="button"
            onClick={() => {
              handleOpenCustomerKhata(activeDropdown.item);
              setActiveDropdown(null);
            }}
            className="w-full px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
            <span>Customer Khata</span>
          </button>

          {/* 3. Return Item to Warehouse */}
          {canEdit && !isViewer && (
            <button
              type="button"
              onClick={() => {
                handleOpenReturnModal(activeDropdown.item);
                setActiveDropdown(null);
              }}
              className="w-full px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>Return to Warehouse</span>
            </button>
          )}

          {/* 4. Edit Bill */}
          {canEdit && !isViewer && (
            <button
              type="button"
              onClick={() => {
                handleStartEdit(activeDropdown.item);
                setActiveDropdown(null);
              }}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-500" />
              <span>Edit Bill</span>
            </button>
          )}

          {/* 5. Delete Bill */}
          {canDelete && !isViewer && (
            <button
              type="button"
              onClick={() => {
                handleDelete(activeDropdown.item);
                setActiveDropdown(null);
              }}
              className="w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Bill</span>
            </button>
          )}
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
                    Edit Dispatch Bill
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
                    min="0"
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
                    Destination / Market
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
                  {editingItem?.isWithoutStock
                    ? 'Direct Bill: Stock unchanged, khata will reconcile'
                    : 'Warehouse stock & customer balance will auto-reconcile'}
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
