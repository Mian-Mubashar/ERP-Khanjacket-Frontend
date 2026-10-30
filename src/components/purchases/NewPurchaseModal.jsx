import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2, AlertCircle, CheckCircle2, ShoppingBag, Shirt } from 'lucide-react';
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
    setIsAddCategoryOpen 
  } = useApp();

  const defaultCategories = ['Jacket', 'Hoodie', 'Zipper', 'Tracksuit', 'Trousers', 'Shirt', 'Windbreaker'];
  const availableCategories = categories && categories.length > 0 ? categories : defaultCategories;

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState(`CN-${Date.now().toString().slice(-4)}`);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [containerNo, setContainerNo] = useState('');
  const [extraExpenses, setExtraExpenses] = useState(0);
  const [expenseNote, setExpenseNote] = useState('Sea Freight & Custom Port Clearing');
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank TT / Wire Transfer');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dynamically track targeted row for newly created category
  const [categoryTargetRow, setCategoryTargetRow] = useState(null);
  const prevCategoriesRef = React.useRef(categories);

  // Dynamically initialize items row
  const [items, setItems] = useState([
    {
      articleNo: '',
      articleName: '',
      category: availableCategories[0] || 'Jacket',
      quantity: 100,
      unitCost: 1000
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

  // Synchronize supplierId when suppliers load, and auto-select newly registered supplier
  const prevSuppliersRef = React.useRef(suppliers);
  React.useEffect(() => {
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
    const prevSups = prevSuppliersRef.current;
    if (suppliers.length > prevSups.length) {
      const newlyAddedSup = suppliers.find(s => !prevSups.some(ps => ps.id === s.id)) || suppliers[suppliers.length - 1];
      if (newlyAddedSup) {
        setSupplierId(newlyAddedSup.id);
      }
    }
    prevSuppliersRef.current = suppliers;
  }, [suppliers, supplierId]);

  // Synchronize item row when articles load and item is unassigned
  React.useEffect(() => {
    if (articles.length > 0 && items.length === 1 && !items[0].articleNo) {
      setItems([{
        articleNo: articles[0].articleNo,
        articleName: articles[0].name,
        category: articles[0].category || availableCategories[0] || 'Jacket',
        quantity: 100,
        unitCost: articles[0].unitCost || 1000
      }]);
    }
  }, [articles]);

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
    const available = articles.find(a => !items.some(i => i.articleNo === a.articleNo)) || articles[0];
    setItems([
      ...items,
      {
        articleNo: available?.articleNo || '',
        articleName: available?.name || '',
        category: available?.category || availableCategories[0] || 'Jacket',
        quantity: 100,
        unitCost: available?.unitCost || 1000
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
    setError('');
    setSuccess('');

    if (!invoiceNo.trim()) {
      showError('Required Field', 'Invoice / Bill number is required.');
      setError('Invoice / Bill number is required.');
      return;
    }

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

    const cleanedItems = items.map(it => ({
      articleNo: it.articleNo.trim().toUpperCase(),
      articleName: it.articleName.trim(),
      category: it.category || categories[0] || 'Jacket',
      quantity: Number(it.quantity) || 1,
      unitCost: Number(it.unitCost) || 0
    }));

    const newPurchaseData = {
      invoiceNo: invoiceNo.trim().toUpperCase(),
      supplierId,
      supplierName: selSupplier.company,
      purchaseDate,
      containerNo: containerNo.trim() || 'N/A',
      items: cleanedItems,
      extraExpenses: Number(extraExpenses) || 0,
      expenseNote: expenseNote.trim() || 'Freight & Clearing',
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

    showToast(`Purchase Bill #${invoiceNo.toUpperCase()} recorded successfully!`, 'success');
    setIsNewPurchaseOpen(false);
    setInvoiceNo(`CN-${Date.now().toString().slice(-4)}`);
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                New China Purchase Bill
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-Article shipment invoice with automatic stock increment & ledger balance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNewPurchaseOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Top Row: Supplier, Date, Invoice No, Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  China Supplier <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(true)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer transition-colors"
                >
                  + Add Supplier
                </button>
              </div>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all cursor-pointer"
              >
                {suppliers.length === 0 ? (
                  <option value="">-- No Suppliers Yet (Add Supplier) --</option>
                ) : (
                  suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.company} ({s.name})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Invoice / Bill # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                placeholder="e.g. CN-8842-APEX"
                className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-blue-600 dark:text-blue-400 focus:border-blue-600 outline-hidden transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Purchase Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Container / Bilty #
              </label>
              <input
                type="text"
                value={containerNo}
                onChange={e => setContainerNo(e.target.value)}
                placeholder="e.g. COSCO-78491-GZ"
                className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:border-blue-600 outline-hidden transition-all uppercase"
              />
            </div>
          </div>

          {/* Multi-Item Articles Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Bill Articles (Multi-Item Consignment)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Include multiple articles in a single import bill with automated stock calculation
                </p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item Row</span>
              </button>
            </div>

            {/* Table of items */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse">
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
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Expense Description
                  </label>
                  <input
                    type="text"
                    value={expenseNote}
                    onChange={e => setExpenseNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  General Remarks / Port Gate Pass
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unloaded in Karachi central warehouse"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Right: Payment Calculation */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Bill Calculation & Supplier Payment
              </h3>

              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
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

                <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Bill Amount:</span>
                  <div className="text-right">
                    <span className="font-mono text-base text-blue-700 dark:text-blue-400 block">
                      Rs. {totalBill.toLocaleString()}
                    </span>
                    {totalBill > 0 && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block">
                        {formatLakhCrore(totalBill)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Amount Paid (Ada Shuda)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalBill}
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 outline-hidden transition-all"
                  />
                  {/* Quick Chips */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      0 (Udhaar)
                    </button>
                    {totalBill > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPaidAmount(Math.round(totalBill / 2))}
                          className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                        >
                          50% Half
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaidAmount(totalBill)}
                          className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                        >
                          Full Paid
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 outline-hidden cursor-pointer transition-all"
                  >
                    <option value="Bank TT / Wire Transfer">Bank TT / Wire</option>
                    <option value="Foreign Exchange LC">Letter of Credit (LC)</option>
                    <option value="Cash / Hawala">Cash / Hawala</option>
                    <option value="Unpaid / Credit">Unpaid (Credit)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Remaining Balance (Baqaya):</span>
                <div className="text-right">
                  <span className="font-mono text-rose-600 dark:text-rose-400 text-sm block">
                    Rs. {remaining.toLocaleString()}
                  </span>
                  {remaining > 0 && (
                    <span className="text-[10px] text-rose-500 font-bold block">
                      {formatLakhCrore(remaining)}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewPurchaseOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Purchase Bill
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
