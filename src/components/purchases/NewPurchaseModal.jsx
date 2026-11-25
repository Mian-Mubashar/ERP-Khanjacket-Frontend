import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2, AlertCircle, CheckCircle2, ShoppingBag, Shirt, Search, Loader2 } from 'lucide-react';
import Swal, { showToast, showError } from '../../utils/sweetalert';
import { formatLakhCrore } from '../../utils/formatters';

export const NewPurchaseModal = () => {
  const { 
    isNewPurchaseOpen, 
    setIsNewPurchaseOpen, 
    suppliers, 
    articles, 
    categories = [],
    addCategory,
    addPurchase,
    setIsAddSupplierOpen,
    setIsAddArticleOpen,
    setIsAddCategoryOpen,
    selectedSupplierForBill,
    setSelectedSupplierForBill
  } = useApp();

  const defaultCategories = ['Jacket', 'Hoodie', 'Zipper', 'Tracksuit', 'Trousers', 'Shirt', 'Windbreaker'];
  const availableCategories = categories && categories.length > 0 ? categories : defaultCategories;

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [containerNo, setContainerNo] = useState('');
  const [extraExpenses, setExtraExpenses] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank TT / Wire Transfer');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Top China Supplier Quick Search State
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);
  const supplierSearchRef = useRef(null);

  // Dynamically track targeted row for newly created category
  const [categoryTargetRow, setCategoryTargetRow] = useState(null);
  const prevCategoriesRef = React.useRef(categories);

  // Dynamically initialize items row (clean blank row)
  const [items, setItems] = useState([
    {
      articleNo: '',
      articleName: '',
      category: availableCategories[0] || 'Jacket',
      quantity: '',
      unitCost: ''
    }
  ]);

  // Auto-select newly added category on the active/targeted row
  React.useEffect(() => {
    const prevCats = prevCategoriesRef.current;
    if (categories.length > prevCats.length) {
      const newlyAdded = categories.find(c => !prevCats.includes(c)) || categories[categories.length - 1];
      if (newlyAdded) {
        if (categoryTargetRow !== null && items[categoryTargetRow]) {
          const updated = [...items];
          updated[categoryTargetRow] = {
            ...updated[categoryTargetRow],
            category: newlyAdded
          };
          setItems(updated);
        } else if (items.length > 0) {
          const targetIdx = items.length - 1;
          const updated = [...items];
          updated[targetIdx] = {
            ...updated[targetIdx],
            category: newlyAdded
          };
          setItems(updated);
        }
      }
      setCategoryTargetRow(null);
    }
    prevCategoriesRef.current = categories;
  }, [categories, categoryTargetRow, items]);

  // Synchronize supplierId when suppliers load, and auto-select selectedSupplierForBill or newly registered supplier
  const prevSuppliersRef = React.useRef(suppliers);
  React.useEffect(() => {
    if (selectedSupplierForBill && selectedSupplierForBill.id) {
      setSupplierId(selectedSupplierForBill.id);
      setSupplierSearchQuery(`${selectedSupplierForBill.company} (${selectedSupplierForBill.name || ''})`);
    }
    const prevSups = prevSuppliersRef.current;
    if (suppliers.length > prevSups.length) {
      const newlyAddedSup = suppliers.find(s => !prevSups.some(ps => ps.id === s.id)) || suppliers[suppliers.length - 1];
      if (newlyAddedSup) {
        setSupplierId(newlyAddedSup.id);
        setSupplierSearchQuery(`${newlyAddedSup.company} (${newlyAddedSup.name || ''})`);
      }
    }
    prevSuppliersRef.current = suppliers;
  }, [suppliers, selectedSupplierForBill]);

  React.useEffect(() => {
    if (isNewPurchaseOpen) {
      setInvoiceNo('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setContainerNo('');
      setExtraExpenses('');
      setExpenseNote('');
      setPaidAmount('');
      setNotes('');
      setError('');
      setSuccess('');
      setItems([
        {
          articleNo: '',
          articleName: '',
          category: availableCategories[0] || 'Jacket',
          quantity: '',
          unitCost: ''
        }
      ]);

      if (selectedSupplierForBill && selectedSupplierForBill.id) {
        setSupplierId(selectedSupplierForBill.id);
        setSupplierSearchQuery(`${selectedSupplierForBill.company} (${selectedSupplierForBill.name || ''})`);
      } else {
        setSupplierId('');
        setSupplierSearchQuery('');
      }
      setIsSupplierSearchOpen(false);
    }
  }, [isNewPurchaseOpen, selectedSupplierForBill]);

  // Outside click listener for top vendor search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (supplierSearchRef.current && !supplierSearchRef.current.contains(e.target)) {
        setIsSupplierSearchOpen(false);
      }
    };
    if (isSupplierSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSupplierSearchOpen]);

  // Filtered suppliers for top search bar
  const filteredSearchSuppliers = (suppliers || []).filter(s => {
    if (!supplierSearchQuery.trim()) return true;
    const q = supplierSearchQuery.toLowerCase();
    return (
      (s.company && s.company.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.id && s.id.toLowerCase().includes(q))
    );
  }).slice(0, 10);

  const handleSelectSupplierFromTopSearch = (s) => {
    setSupplierId(s.id);
    setSupplierSearchQuery(`${s.company} (${s.name || ''})`);
    setIsSupplierSearchOpen(false);
  };

  if (!isNewPurchaseOpen) return null;

  // Quick category creation prompt with MySQL persistence
  const handleQuickAddCategory = async (rowIndex) => {
    const isDark = document.documentElement.classList.contains('dark');
    const { value: newCat } = await Swal.fire({
      title: 'Add New Category',
      text: 'Enter garment category name (e.g. Jacket, Hoodie, Tracksuit, Trousers):',
      input: 'text',
      inputPlaceholder: 'e.g. Puffer Jacket, Shalwar Kameez...',
      showCancelButton: true,
      confirmButtonText: 'Add Category',
      confirmButtonColor: '#2563eb',
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#64748b',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      inputValidator: (value) => {
        const trimmed = value?.trim();
        if (!trimmed) {
          return 'Category name is required!';
        }
        if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
          return `Category "${trimmed}" already exists in the catalog!`;
        }
      }
    });

    if (newCat && newCat.trim()) {
      const trimmed = newCat.trim();
      const res = await addCategory(trimmed);
      if (res?.success) {
        showToast(`Category "${trimmed}" added successfully!`, 'success');
        if (rowIndex !== null && rowIndex !== undefined && items[rowIndex]) {
          handleItemFieldChange(rowIndex, 'category', trimmed);
        }
      } else {
        showError('Cannot Add Category', res?.message || 'Error adding category');
      }
    }
  };

  const handleItemArticleChange = (index, selectedArticleNo) => {
    const matched = articles.find(a => a.articleNo === selectedArticleNo);
    const updated = [...items];
    if (matched) {
      updated[index] = {
        ...updated[index],
        articleNo: matched.articleNo,
        articleName: matched.name,
        category: matched.category,
        unitCost: matched.unitCost || 0
      };
    } else {
      updated[index].articleNo = selectedArticleNo;
    }
    setItems(updated);
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        articleNo: '',
        articleName: '',
        category: availableCategories[0] || 'Jacket',
        quantity: '',
        unitCost: ''
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) {
      setError('At least one article must be included in the bill.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitCost || 0)), 0);
  const totalBill = itemsSubtotal + Number(extraExpenses || 0);
  const remaining = totalBill - Number(paidAmount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    setError('');
    setSuccess('');

    const finalInvoiceNo = invoiceNo.trim() 
      ? invoiceNo.trim().toUpperCase() 
      : `CN-${Date.now().toString().slice(-4)}`;

    if (!supplierId) {
      showError('Supplier Required', 'Please register and select a China supplier.');
      setError('Please select a valid China supplier.');
      return;
    }

    const selSupplier = suppliers.find(s => s.id === supplierId);
    if (!selSupplier) {
      showError('Supplier Required', 'Please select a valid China supplier.');
      setError('Please select a valid China supplier.');
      return;
    }

    if (items.length === 0) {
      showError('Items Required', 'Please add at least one article item.');
      setError('Please add at least one article item.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].articleNo.trim()) {
        showError('Article Code Required', `Row #${i + 1}: Please enter or select an Article Code.`);
        setError(`Row #${i + 1}: Article Code is required.`);
        return;
      }
      if (!items[i].articleName.trim()) {
        showError('Article Name Required', `Row #${i + 1}: Please enter article description.`);
        setError(`Row #${i + 1}: Article Name is required.`);
        return;
      }
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const cleanedItems = items.map(it => ({
        articleNo: it.articleNo.trim().toUpperCase(),
        articleName: it.articleName.trim(),
        category: it.category || categories[0] || 'Jacket',
        quantity: Number(it.quantity) || 1,
        unitCost: Number(it.unitCost) || 0
      }));

      const newPurchaseData = {
        invoiceNo: finalInvoiceNo,
        supplierId,
        supplierName: selSupplier.company,
        purchaseDate,
        containerNo: containerNo.trim() || 'N/A',
        items: cleanedItems,
        extraExpenses: Number(extraExpenses) || 0,
        expenseNote: expenseNote.trim() || (Number(extraExpenses) > 0 ? 'Freight & Clearing' : ''),
        paidAmount: Number(paidAmount) || 0,
        paymentMethod,
        notes: notes.trim()
      };

      const res = await addPurchase(newPurchaseData);
      if (!res || !res.success) {
        showError('Purchase Failed', res?.message || 'Error recording purchase bill');
        setError(res?.message || 'Error recording purchase bill');
        return;
      }

      showToast(`Purchase Bill #${finalInvoiceNo} recorded successfully!`, 'success');
      setIsNewPurchaseOpen(false);
      if (setSelectedSupplierForBill) setSelectedSupplierForBill(null);
      setInvoiceNo('');
      setSuccess('');
    } catch (err) {
      console.error('Error recording purchase:', err);
      showError('Purchase Failed', err?.message || 'An unexpected error occurred.');
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsNewPurchaseOpen(false);
    if (setSelectedSupplierForBill) setSelectedSupplierForBill(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors my-auto sm:my-8">
        
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                New China Purchase Bill
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate sm:whitespace-normal">
                Multi-Article shipment invoice with automatic stock increment & ledger balance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(100dvh-5rem)] sm:max-h-[82vh] overflow-y-auto">
          
          {error && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Top Quick Search Bar for China Supplier (Full Width) */}
          <div className="relative">
            <div className="flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-2xs">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
              <input
                type="text"
                value={supplierSearchQuery}
                onChange={(e) => {
                  setSupplierSearchQuery(e.target.value);
                  setIsSupplierSearchOpen(true);
                }}
                onFocus={(e) => {
                  e.target.select();
                  setIsSupplierSearchOpen(true);
                }}
                placeholder="Search China Supplier by company, name, phone..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
              />
              {supplierSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSupplierSearchQuery('');
                    setSupplierId('');
                    setIsSupplierSearchOpen(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {isSupplierSearchOpen && (
              <div 
                ref={supplierSearchRef}
                className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100"
              >
                {filteredSearchSuppliers.length > 0 ? (
                  filteredSearchSuppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSupplierFromTopSearch(s)}
                      className="w-full text-left px-3.5 py-2 sm:py-2.5 text-xs hover:bg-blue-50/70 dark:hover:bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 cursor-pointer transition-colors"
                    >
                      <div className="truncate flex-1">
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {s.company}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          {s.name ? `Contact: ${s.name} • ` : ''}{s.phone || ''} {s.address ? `• ${s.address}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {s.id}
                        </span>
                        {Number(s.remainingBalance) > 0 && (
                          <span className="text-[9px] sm:text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200/60 dark:border-rose-900/60">
                            Due: Rs. {Number(s.remainingBalance).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
                    No supplier found matching "{supplierSearchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top Row: Supplier, Date, Invoice No, Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                  China Supplier <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(true)}
                  className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer transition-colors"
                >
                  + Add Supplier
                </button>
              </div>
              <select
                value={supplierId}
                onChange={e => {
                  setSupplierId(e.target.value);
                  const found = suppliers.find(s => s.id === e.target.value);
                  if (found) setSupplierSearchQuery(`${found.company} (${found.name || ''})`);
                  else setSupplierSearchQuery('');
                }}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all cursor-pointer"
              >
                <option value="">-- Select China Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.company} ({s.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
                Invoice / Bill # <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                placeholder="Leave blank to auto-generate (e.g. CN-9822)"
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-blue-600 dark:text-blue-400 focus:border-blue-600 outline-hidden transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
                Purchase Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
                Container / Bilty #
              </label>
              <input
                type="text"
                value={containerNo}
                onChange={e => setContainerNo(e.target.value)}
                placeholder="e.g. COSCO-78491-GZ"
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all uppercase"
              />
            </div>
          </div>

          {/* Multi-Item Articles Section */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Bill Articles (Multi-Item Consignment)
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  Include multiple articles in a single import bill with automated stock calculation
                </p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="self-start sm:self-auto px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item Row</span>
              </button>
            </div>

            {/* Table of items */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">Article Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 min-w-[150px]">
                      <div className="flex items-center justify-between gap-1">
                        <span>Category</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryTargetRow(0);
                            setIsAddCategoryOpen(true);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer capitalize font-sans"
                          title="Manage / Add Categories"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 w-28 text-right">Qty (Pcs)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Unit Cost (Rs)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total (PKR)</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {items.map((item, idx) => {
                    const rowTotal = Number(item.quantity || 0) * Number(item.unitCost || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {/* Article Code selector / datalist input */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            list={`art-list-${idx}`}
                            placeholder="e.g. BF411"
                            value={item.articleNo}
                            onChange={e => handleItemArticleChange(idx, e.target.value.toUpperCase())}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-blue-600 dark:text-blue-400 text-xs uppercase outline-hidden"
                          />
                          <datalist id={`art-list-${idx}`}>
                            {articles.map(art => (
                              <option key={art.articleNo} value={art.articleNo}>
                                {art.name} ({art.category})
                              </option>
                            ))}
                          </datalist>
                        </td>

                        {/* Name */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Article description"
                            value={item.articleName}
                            onChange={e => handleItemFieldChange(idx, 'articleName', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-hidden"
                          />
                        </td>

                        {/* Category */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1 min-w-[140px]">
                            <select
                              value={item.category}
                              onChange={e => {
                                if (e.target.value === '__QUICK_ADD__') {
                                  handleQuickAddCategory(idx);
                                } else if (e.target.value === '__MANAGE__') {
                                  setCategoryTargetRow(idx);
                                  setIsAddCategoryOpen(true);
                                } else {
                                  handleItemFieldChange(idx, 'category', e.target.value);
                                }
                              }}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-hidden font-medium"
                            >
                              {item.category && !availableCategories.includes(item.category) && (
                                <option value={item.category}>{item.category}</option>
                              )}
                              {availableCategories.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                              <option value="__QUICK_ADD__" className="text-blue-600 font-bold">
                                + Add New Category...
                              </option>
                              <option value="__MANAGE__" className="text-slate-500">
                                ⚙ Manage Categories...
                              </option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleQuickAddCategory(idx)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 hover:border-blue-300"
                              title="Quick Add Category"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleItemFieldChange(idx, 'quantity', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-right text-slate-900 dark:text-white outline-hidden"
                          />
                        </td>

                        {/* Unit Cost */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.unitCost}
                            onChange={e => handleItemFieldChange(idx, 'unitCost', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-right text-slate-900 dark:text-white outline-hidden"
                          />
                        </td>

                        {/* Total */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {rowTotal.toLocaleString()}
                        </td>

                        {/* Remove button */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expenses & Financial Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Left: Extra Expenses & Notes */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Additional Import Expenses (Freight / Duty)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Freight / Clearing Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={extraExpenses}
                    onChange={e => setExtraExpenses(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
                    Expense Description
                  </label>
                  <input
                    type="text"
                    value={expenseNote}
                    onChange={e => setExpenseNote(e.target.value)}
                    placeholder="e.g. Sea Freight & Custom Port"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
                  General Remarks / Port Gate Pass
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unloaded in Karachi central warehouse"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Right: Payment Calculation */}
            <div className="space-y-3 sm:space-y-3.5">
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Bill Calculation & Supplier Payment
              </h3>

              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Articles Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    Rs. {itemsSubtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Freight / Duty:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    + Rs. {Number(extraExpenses || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Bill Amount:</span>
                  <div className="text-right">
                    <span className="font-mono text-sm sm:text-base text-blue-700 dark:text-blue-400 block">
                      Rs. {totalBill.toLocaleString()}
                    </span>
                    {totalBill > 0 && (
                      <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-semibold block">
                        {formatLakhCrore(totalBill)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
                    Amount Paid (Ada Shuda)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalBill}
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 outline-hidden transition-all"
                  />
                  {/* Quick Chips */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className="px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      0 (Udhaar)
                    </button>
                    {totalBill > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPaidAmount(Math.round(totalBill / 2))}
                          className="px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                        >
                          50% Half
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaidAmount(totalBill)}
                          className="px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                        >
                          Full Paid
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 outline-hidden cursor-pointer transition-all"
                  >
                    <option value="Bank TT / Wire Transfer">Bank TT / Wire</option>
                    <option value="Foreign Exchange LC">Letter of Credit (LC)</option>
                    <option value="Cash / Hawala">Cash / Hawala</option>
                    <option value="Unpaid / Credit">Unpaid (Credit)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Remaining Balance:</span>
                <div className="text-right">
                  <span className="font-mono text-rose-600 dark:text-rose-400 text-xs sm:text-sm block">
                    Rs. {remaining.toLocaleString()}
                  </span>
                  {remaining > 0 && (
                    <span className="text-[9px] sm:text-[10px] text-rose-500 font-bold block">
                      {formatLakhCrore(remaining)}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Footer actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 sm:py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Purchase Bill...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Purchase Bill</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
