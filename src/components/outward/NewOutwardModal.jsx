import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ArrowUpRight, AlertCircle, CheckCircle2, MapPin, Building, Phone, Plus, Ship, Shirt } from 'lucide-react';
import { showToast, showError, showWarning } from '../../utils/sweetalert';
import { formatLakhCrore } from '../../utils/formatters';

export const NewOutwardModal = () => {
  const { 
    isNewOutwardOpen, 
    setIsNewOutwardOpen, 
    articles, 
    cities, 
    customers, 
    addOutward,
    setIsAddArticleOpen,
    setIsNewPurchaseOpen
  } = useApp();

  const [selectedArticleNo, setSelectedArticleNo] = useState(articles[0]?.articleNo || '');
  const [quantity, setQuantity] = useState(100);
  const [challanNo, setChallanNo] = useState(`CH-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCity, setSelectedCity] = useState(cities[0]?.name || 'Lahore');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [unitSalePrice, setUnitSalePrice] = useState('');
  const [gatePassNo, setGatePassNo] = useState(`GP-${Date.now().toString().slice(-3)}`);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    if (articles.length > 0 && !selectedArticleNo) {
      setSelectedArticleNo(articles[0].articleNo);
    }
  }, [articles, selectedArticleNo]);

  React.useEffect(() => {
    if (cities.length > 0 && !selectedCity) {
      setSelectedCity(cities[0].name);
    }
  }, [cities, selectedCity]);

  if (!isNewOutwardOpen) return null;

  const currentArticle = articles.find(a => a.articleNo === selectedArticleNo) || articles[0];
  const availableStock = currentArticle ? currentArticle.currentStock : 0;

  // Filter shopkeepers by chosen city
  const cityCustomers = customers.filter(c => c.city.toLowerCase() === selectedCity.toLowerCase());

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    setSelectedCustomerId('');
    setDestination(cityName);
  };

  const handleCustomerSelect = (custId) => {
    setSelectedCustomerId(custId);
    const found = customers.find(c => c.id === custId);
    if (found) {
      setCustomerName(`${found.shopName} (${found.shopkeeperName})`);
      setCustomerPhone(found.phone || '');
      setDestination(found.marketAddress || found.city);
    }
  };

  const handleArticleSelect = (code) => {
    setSelectedArticleNo(code);
    const found = articles.find(a => a.articleNo === code);
    if (found && found.unitCost) {
      setUnitSalePrice(Math.round(found.unitCost * 1.3)); // Suggested wholesale price
    }
  };

  const totalBillAmount = (Number(quantity) || 0) * (Number(unitSalePrice) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedArticleNo) {
      showError('Article Required', 'Please select an Article to dispatch.');
      setError('Please select an Article to dispatch.');
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

    if (numQty > availableStock) {
      showWarning('Insufficient Stock!', `Cannot dispatch ${numQty} pcs! Only ${availableStock} pcs currently available in warehouse for ${selectedArticleNo}.`);
      setError(`Cannot dispatch ${numQty} pcs! Only ${availableStock} pcs available.`);
      return;
    }

    const res = await addOutward({
      articleNo: selectedArticleNo.toUpperCase(),
      quantity: numQty,
      challanNo: challanNo.trim(),
      date,
      city: selectedCity,
      customerId: selectedCustomerId || null,
      customerName: finalCustomerName,
      customerPhone: customerPhone.trim(),
      destination: destination.trim() || selectedCity,
      unitSalePrice: Number(unitSalePrice) || 0,
      gatePassNo: gatePassNo.trim(),
      notes: notes.trim()
    });

    if (!res || !res.success) {
      showError('Dispatch Failed', res?.message || 'Error recording outward dispatch');
      setError(res?.message || 'Error recording outward dispatch');
      return;
    }

    showToast(`Challan #${challanNo}: ${numQty} pcs dispatched to ${finalCustomerName}!`, 'success');
    setIsNewOutwardOpen(false);
    setChallanNo(`CH-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`);
    setGatePassNo(`GP-${Date.now().toString().slice(-3)}`);
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header - Fixed & Always Visible */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Warehouse Stock Outward / Dispatch
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dispatch goods to city shopkeeper (Auto-updates stock & customer balance)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNewOutwardOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          
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

          {/* Article Selection with Live Stock Highlight */}
          {articles.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-2">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                ⚠️ Godam me koi garment article mojood nahi hai!
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-300">
                Maal rawana karne se pehlay godam me naya article darj karein ya China container ka bill enter karein:
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewOutwardOpen(false);
                    setIsAddArticleOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer"
                >
                  + Naya Article Darj Karein
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewOutwardOpen(false);
                    setIsNewPurchaseOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  + Container Bill Banayein
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Select Article (Garment Code) <span className="text-rose-500">*</span>
                </label>
                <div className="text-slate-500 dark:text-slate-400">
                  Godam Me Mojood:{' '}
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {availableStock.toLocaleString()} pcs
                  </span>
                </div>
              </div>

              <select
                value={selectedArticleNo}
                onChange={e => handleArticleSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-blue-700 dark:text-blue-300 focus:border-blue-500 outline-hidden"
              >
                {articles.map(a => (
                  <option key={a.articleNo} value={a.articleNo}>
                    {a.articleNo} — {a.name} ({a.stuff || a.category}) [Stock: {a.currentStock} pcs]
                  </option>
                ))}
              </select>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Rawana Hone Wali Quantity (Pieces) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Max: {availableStock.toLocaleString()} pcs
                  </span>
                </div>

                <input
                  type="number"
                  required
                  min="1"
                  max={availableStock}
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900 rounded-xl text-sm font-mono font-bold text-rose-600 dark:text-rose-400 focus:border-rose-500 outline-hidden"
                />

                {/* Quick Fill Chips for Quantity */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Asaan Buttons:</span>
                  {[50, 100, 200, 500].filter(q => q <= availableStock).map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        Number(quantity) === q
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {q} pcs
                    </button>
                  ))}
                  {availableStock > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(availableStock)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
                    >
                      Pura Stock ({availableStock} pcs)
                    </button>
                  )}
                </div>

                {/* Live 3-Stage Visual Calculation Card */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Pehlay Stock</span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {availableStock.toLocaleString()} pcs
                    </span>
                  </div>
                  <div className="border-x border-slate-100 dark:border-slate-700">
                    <span className="text-[9px] text-rose-500 block uppercase font-bold">(-) Dispatch</span>
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      -{Number(quantity || 0).toLocaleString()} pcs
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-600 block uppercase font-bold">(=) Naya Stock</span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.max(0, availableStock - Number(quantity || 0)).toLocaleString()} pcs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* City / Branch and Registered Shopkeeper Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Destination City / Branch <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCity}
                onChange={e => handleCityChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-hidden"
              >
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Shopkeeper in {selectedCity}
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-hidden"
              >
                <option value="">-- Choose or Enter Below --</option>
                {cityCustomers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.shopName} ({c.shopkeeperName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer / Wholesale Shop Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Customer / Shop Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Al-Madina Garments (Haji Rafiq)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Market / Delivery Location
              </label>
              <input
                type="text"
                placeholder="e.g. Raja Bazaar, Anarkali"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Challan # & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Challan #
              </label>
              <input
                type="text"
                value={challanNo}
                onChange={e => setChallanNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dispatch Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gate Pass #
              </label>
              <input
                type="text"
                value={gatePassNo}
                onChange={e => setGatePassNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 outline-hidden"
              />
            </div>
          </div>

          {/* Wholesale Rate & Auto Calculated Bill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unit Wholesale Sale Rate (PKR)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 3400"
                value={unitSalePrice}
                onChange={e => setUnitSalePrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Bill Amount (Auto-Calculated)
              </label>
              <div className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-mono font-bold text-blue-700 dark:text-blue-300 flex items-center justify-between">
                <span>Rs. {totalBillAmount.toLocaleString()}</span>
                {totalBillAmount > 0 && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {formatLakhCrore(totalBillAmount)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Phone & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Customer Phone
              </label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Transport / Bilty Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Sent via Goods Transport Bardan packaging"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-hidden"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 px-5 sm:px-6 py-3 mt-3 shadow-xs">
            <button
              type="button"
              onClick={() => setIsNewOutwardOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              Dispatch Stock
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
