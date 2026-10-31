import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Truck, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { showToast, showError, showWarning } from '../../utils/sweetalert';
import { formatLakhCrore } from '../../utils/formatters';

const getTodayDate = () => new Date().toISOString().split('T')[0];
const generateChallan = () => `CH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
const generateGatePass = () => `GP-${Date.now().toString().slice(-4)}`;

export const NewOutwardModal = () => {
  const { 
    isNewOutwardOpen, 
    setIsNewOutwardOpen, 
    articles, 
    cities, 
    customers, 
    addOutward,
    selectedCustomerForBill,
    setSelectedCustomerForBill,
    selectedArticleForOutward,
    setSelectedArticleForOutward
  } = useApp();

  const [selectedArticleNo, setSelectedArticleNo] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [challanNo, setChallanNo] = useState(generateChallan);
  const [date, setDate] = useState(getTodayDate);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [unitSalePrice, setUnitSalePrice] = useState('');
  const [gatePassNo, setGatePassNo] = useState(generateGatePass);
  const [notes, setNotes] = useState('');

  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isCustomArticle, setIsCustomArticle] = useState(false);
  const [customArticleNo, setCustomArticleNo] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Top Customer Quick Search Bar State
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);

  // Initialize or reset defaults when modal opens
  useEffect(() => {
    if (isNewOutwardOpen) {
      setChallanNo(generateChallan());
      setGatePassNo(generateGatePass());
      setDate(getTodayDate());
      setError('');
      setSuccess('');

      if (selectedCustomerForBill) {
        if (selectedCustomerForBill.city) setSelectedCity(selectedCustomerForBill.city);
        setSelectedCustomerId(selectedCustomerForBill.id || '');
        setCustomerName(`${selectedCustomerForBill.shopName} (${selectedCustomerForBill.shopkeeperName || ''})`);
        setCustomerPhone(selectedCustomerForBill.phone || '');
        setDestination(selectedCustomerForBill.marketAddress || selectedCustomerForBill.city || '');
      } else if (cities.length > 0) {
        setSelectedCity(prev => prev || cities[0].name);
      }

      if (selectedArticleForOutward) {
        setIsCustomArticle(false);
        setSelectedArticleNo(selectedArticleForOutward.articleNo);
        if (selectedArticleForOutward.unitCost) {
          setUnitSalePrice(Math.round(selectedArticleForOutward.unitCost * 1.3));
        }
      } else if (articles.length > 0) {
        setSelectedArticleNo(prev => prev || articles[0].articleNo);
        if (articles[0].unitCost) {
          setUnitSalePrice(prev => prev || Math.round(articles[0].unitCost * 1.3));
        }
      }
    }
  }, [isNewOutwardOpen, selectedCustomerForBill, selectedArticleForOutward, cities, articles]);

  // Outside click listener for top customer search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    if (isSearchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchDropdownOpen]);

  // Synchronize top search bar when modal opens or customer selected
  useEffect(() => {
    if (isNewOutwardOpen) {
      if (selectedCustomerForBill) {
        setCustomerSearchQuery(`${selectedCustomerForBill.shopName} (${selectedCustomerForBill.shopkeeperName || ''}) - ${selectedCustomerForBill.city || ''}`);
      } else {
        setCustomerSearchQuery('');
      }
      setIsSearchDropdownOpen(false);
    }
  }, [isNewOutwardOpen, selectedCustomerForBill]);

  if (!isNewOutwardOpen) return null;

  const currentArticle = articles.find(a => a.articleNo === selectedArticleNo) || articles[0];
  const availableStock = currentArticle ? currentArticle.currentStock : 0;
  const cityCustomers = customers
    .filter(c => c.city.toLowerCase() === (selectedCity || '').toLowerCase())
    .sort((a, b) => (a.shopName || '').localeCompare(b.shopName || '', undefined, { sensitivity: 'base' }));

  // Live filtered customers for top search bar
  const filteredSearchCustomers = (customers || []).filter(c => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase();
    return (
      (c.shopName && c.shopName.toLowerCase().includes(q)) ||
      (c.shopkeeperName && c.shopkeeperName.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.marketAddress && c.marketAddress.toLowerCase().includes(q))
    );
  }).slice(0, 10);

  const handleSelectCustomerFromTopSearch = (c) => {
    setSelectedCustomerId(c.id);
    if (c.city) {
      const matchCity = cities.find(ct => ct.name.toLowerCase() === c.city.toLowerCase());
      setSelectedCity(matchCity ? matchCity.name : c.city);
    }
    setCustomerName(`${c.shopName} (${c.shopkeeperName || ''})`);
    setCustomerPhone(c.phone || '');
    setDestination(c.marketAddress || c.city || '');
    setCustomerSearchQuery(`${c.shopName} (${c.shopkeeperName || ''}) - ${c.city}`);
    setIsSearchDropdownOpen(false);
  };

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    setSelectedCustomerId('');
    setDestination(cityName);
  };

  const handleCustomerSelect = (custId, opt) => {
    setSelectedCustomerId(custId);
    const found = opt || customers.find(c => c.id === custId);
    if (found) {
      if (found.city) setSelectedCity(found.city);
      setCustomerName(`${found.shopName} (${found.shopkeeperName || ''})`);
      setCustomerPhone(found.phone || '');
      setDestination(found.marketAddress || found.city);
      setCustomerSearchQuery(`${found.shopName} (${found.shopkeeperName || ''}) - ${found.city}`);
    } else {
      setCustomerSearchQuery('');
    }
  };

  const handleArticleSelect = (code) => {
    if (code === '__NEW__') {
      setIsCustomArticle(true);
      return;
    }
    setIsCustomArticle(false);
    setSelectedArticleNo(code);
    const found = articles.find(a => a.articleNo === code);
    if (found && found.unitCost) {
      setUnitSalePrice(Math.round(found.unitCost * 1.3));
    }
  };

  const handleClose = () => {
    setIsNewOutwardOpen(false);
    if (setSelectedCustomerForBill) setSelectedCustomerForBill(null);
    if (setSelectedArticleForOutward) setSelectedArticleForOutward(null);
    setError('');
    setSuccess('');
  };

  const activeArticleCode = isCustomArticle ? customArticleNo.trim().toUpperCase() : selectedArticleNo;
  const totalBillAmount = (Number(quantity) || 0) * (Number(unitSalePrice) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!activeArticleCode) {
      showError('Article Required', 'Please select or enter an Article Code to dispatch.');
      setError('Please select or enter an Article Code to dispatch.');
      return;
    }

    const finalCustomerName = customerName.trim();
    if (!finalCustomerName) {
      showError('Customer Required', 'Customer / Shop Name is required.');
      setError('Customer / Shop Name is required.');
      return;
    }

    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      showError('Invalid Quantity', 'Quantity must be greater than zero.');
      setError('Quantity must be greater than zero.');
      return;
    }

    if (!isCustomArticle && numQty > availableStock) {
      showWarning('Stock Alert', `Dispatching ${numQty} pcs. Warehouse recorded stock is ${availableStock} pcs.`);
    }

    const res = await addOutward({
      articleNo: activeArticleCode,
      quantity: numQty,
      challanNo: challanNo.trim(),
      date,
      city: selectedCity,
      customerId: selectedCustomerId || null,
      customerName: finalCustomerName,
      customerPhone: customerPhone.trim(),
      destination: destination.trim() || selectedCity,
      unitSalePrice: Number(unitSalePrice) || 0,
      paidAmount: Number(paidAmount) || 0,
      paymentMethod,
      gatePassNo: gatePassNo.trim(),
      notes: notes.trim()
    });

    if (!res || !res.success) {
      showError('Dispatch Failed', res?.message || 'Error recording outward dispatch');
      setError(res?.message || 'Error recording outward dispatch');
      return;
    }

    const paidNotice = Number(paidAmount) > 0 ? ` [Wasooli Rs. ${Number(paidAmount).toLocaleString()}]` : '';
    showToast(`Challan #${challanNo}: ${numQty} pcs dispatched to ${finalCustomerName}!${paidNotice}`, 'success');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                New Bill / Dispatch Challan
              </h2>
              {selectedCustomerForBill && (
                <span className="text-xs text-slate-400">•</span>
              )}
              {selectedCustomerForBill && (
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {selectedCustomerForBill.shopName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create outward bill & update customer khata balance
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

        {/* Form Body - Wide, Balanced & Compact */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Top Customer Live Search Bar (Full Width, Right Above Customer & Destination) */}
          <div className="relative">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-2xs">
              <Search className="w-4 h-4 text-blue-500 shrink-0" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={(e) => {
                  e.target.select();
                  setIsSearchDropdownOpen(true);
                }}
                placeholder="Search Customer / Shopkeeper (Type Shop Name, Dukandar, City, or Phone)..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
              />
              {customerSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearchQuery('');
                    setSelectedCustomerId('');
                    setCustomerName('');
                    setCustomerPhone('');
                    setDestination(selectedCity || '');
                    setIsSearchDropdownOpen(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Filter Autocomplete Dropdown */}
            {isSearchDropdownOpen && (
              <div 
                ref={searchDropdownRef}
                className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100"
              >
                {filteredSearchCustomers.length > 0 ? (
                  filteredSearchCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomerFromTopSearch(c)}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50/70 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="truncate flex-1">
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {c.shopName}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {c.shopkeeperName ? `${c.shopkeeperName} • ` : ''}{c.phone || ''} {c.marketAddress ? `• ${c.marketAddress}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                          {c.city}
                        </span>
                        {Number(c.remainingBalance) > 0 && (
                          <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-900/60">
                            Baqaya: Rs. {Number(c.remainingBalance).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
                    No customer found matching "{customerSearchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer Selection / Pre-filled Info Bar */}
          {selectedCustomerForBill ? (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Customer
                </span>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedCustomerForBill.shopName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                    {selectedCustomerForBill.shopkeeperName ? `(${selectedCustomerForBill.shopkeeperName})` : ''} • {selectedCustomerForBill.city} {selectedCustomerForBill.phone ? `• ${selectedCustomerForBill.phone}` : ''} {selectedCustomerForBill.marketAddress ? `• ${selectedCustomerForBill.marketAddress}` : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerForBill(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer shrink-0"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Customer & Destination
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    City / Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedCity}
                    onChange={e => handleCityChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {cities.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Customer
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => handleCustomerSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Choose or Type Below --</option>
                    {cityCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.shopName} ({c.shopkeeperName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Customer / Shop Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Madina Garments"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Delivery Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Raja Bazaar"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main 2-Column Grid: Left = Goods & Quantity | Right = Financials & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            
            {/* LEFT COLUMN: Article Selection & Quantity */}
            <div className="space-y-3.5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Garment & Stock
                </h3>

                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Article / Garment Code <span className="text-rose-500">*</span>
                  </label>
                  {!isCustomArticle && (
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      Godam Stock: <strong className="text-slate-800 dark:text-slate-200">{availableStock.toLocaleString()}</strong> pcs
                    </span>
                  )}
                </div>

                {!isCustomArticle ? (
                  <select
                    value={selectedArticleNo}
                    onChange={e => handleArticleSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-hidden transition-all cursor-pointer"
                  >
                    {articles.map(a => (
                      <option key={a.articleNo} value={a.articleNo}>
                        {a.articleNo} — {a.name} ({a.currentStock} pcs stock)
                      </option>
                    ))}
                    <option value="__NEW__">+ Custom Article Code...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. JK-2026"
                      value={customArticleNo}
                      onChange={e => setCustomArticleNo(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomArticle(false)}
                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      List
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Quantity (Pieces) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-hidden transition-all"
                />
              </div>

              {/* Quick Fill Pills & Stock Preview */}
              <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-slate-400">Quick:</span>
                  {[50, 100, 200, 500].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        Number(quantity) === q
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                  {availableStock > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(availableStock)}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      All ({availableStock})
                    </button>
                  )}
                </div>

                {!isCustomArticle && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Remaining: <strong className="font-mono text-slate-700 dark:text-slate-200">{Math.max(0, availableStock - Number(quantity || 0)).toLocaleString()} pcs</strong>
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Rate, Total Bill & Upfront Payment */}
            <div className="space-y-3.5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Pricing & Khata
                </h3>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Rate per Piece (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 3400"
                      value={unitSalePrice}
                      onChange={e => setUnitSalePrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Total Bill Amount
                    </label>
                    <div className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white flex items-center">
                      <span>Rs. {totalBillAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upfront Payment Fields */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Received (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 (if unpaid)"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-hidden cursor-pointer transition-all"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online / Easypaisa</option>
                  </select>
                </div>
              </div>

              {/* Live Khata Balance Strip */}
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400 font-sans text-xs">
                  Bill: <strong className="font-mono text-slate-800 dark:text-slate-200">Rs. {totalBillAmount.toLocaleString()}</strong>
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-sans text-xs">
                  Received: <strong className="font-mono text-slate-800 dark:text-slate-200">Rs. {(Number(paidAmount) || 0).toLocaleString()}</strong>
                </span>
                <span className="text-slate-700 dark:text-slate-200 font-sans text-xs">
                  Baqaya Khata: <strong className="font-mono text-slate-900 dark:text-white">Rs. {Math.max(0, totalBillAmount - (Number(paidAmount) || 0)).toLocaleString()}</strong>
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Logistics Row (Challan #, Date, Gate Pass, Transport Notes) in 4 neat columns */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Logistics & Documentation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Challan #
                </label>
                <input
                  type="text"
                  value={challanNo}
                  onChange={e => setChallanNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-800 dark:text-slate-200 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dispatch Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gate Pass # <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={gatePassNo}
                  onChange={e => setGatePassNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-800 dark:text-slate-200 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Transport / Remarks <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Goods Transport"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 outline-hidden transition-all"
                />
              </div>
            </div>
          </div>

        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Bill: <strong className="font-mono text-slate-900 dark:text-white">Rs. {totalBillAmount.toLocaleString()}</strong>
            {Number(paidAmount) > 0 && (
              <span className="ml-2 text-slate-400">
                • Net Baqaya: <strong className="font-mono text-slate-800 dark:text-slate-200">Rs. {Math.max(0, totalBillAmount - (Number(paidAmount) || 0)).toLocaleString()}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Dispatch & Generate Bill</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
