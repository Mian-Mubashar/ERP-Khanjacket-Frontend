import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle, Save, ReceiptText, MapPin } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatLakhCrore } from '../../utils/formatters';
import { UGRAHI_ROUTES } from '../../constants/ugrahiRoutes';

export const EditCustomerModal = () => {
  const { 
    isEditCustomerOpen, 
    setIsEditCustomerOpen, 
    editingCustomer, 
    setEditingCustomer, 
    cities, 
    areas = [],
    updateCustomer,
    selectedCustomerKhata,
    setSelectedCustomerKhata,
    outward = []
  } = useApp();

  const [shopName, setShopName] = useState('');
  const [shopkeeperName, setShopkeeperName] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');
  const [marketAddress, setMarketAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [inUgrahi, setInUgrahi] = useState(false);
  const [ugrahiRoute, setUgrahiRoute] = useState('Lahore');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cityAreas = areas.filter(a => (a.cityName || '').toLowerCase() === (city || '').toLowerCase());

  // Synchronize state whenever a customer is selected for edit
  useEffect(() => {
    if (editingCustomer && isEditCustomerOpen) {
      setShopName(editingCustomer.shopName || '');
      setShopkeeperName(editingCustomer.shopkeeperName || '');
      setCity(editingCustomer.city || (cities[0]?.name || 'Lahore'));
      setArea(editingCustomer.area || '');
      setPhone(editingCustomer.phone || '');
      setMarketAddress(editingCustomer.marketAddress || '');
      setNotes(editingCustomer.notes || '');
      setInUgrahi(Boolean(editingCustomer.inUgrahi));
      setUgrahiRoute(editingCustomer.ugrahiRoute || (UGRAHI_ROUTES.includes(editingCustomer.city) ? editingCustomer.city : 'Lahore'));

      // Calculate current opening balance
      const currentShopLower = (editingCustomer.shopName || '').toLowerCase();
      const customerDispatches = (outward || []).filter(o => 
        (o.customerId && o.customerId === editingCustomer.id) ||
        (o.customerName && currentShopLower && o.customerName.toLowerCase() === currentShopLower)
      );
      const totalBilled = customerDispatches.reduce((s, d) => s + (Number(d.totalSaleAmount) || 0), 0);
      const recordedTotalBill = Number(editingCustomer.totalBill) || 0;
      const calcOpening = Math.max(0, recordedTotalBill - totalBilled);
      setOpeningBalance(calcOpening > 0 ? calcOpening : '');
      setError('');
    }
  }, [editingCustomer, isEditCustomerOpen, cities, outward]);

  if (!isEditCustomerOpen || !editingCustomer) return null;

  const handleClose = () => {
    setIsEditCustomerOpen(false);
    setEditingCustomer(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!shopName.trim()) {
      showError('Zaroori Field', 'Shop Name is required (e.g. Al-Madina Garments, Khalid Fabric).');
      setError('Shop Name is required.');
      return;
    }

    if (!city) {
      showError('Zaroori Field', 'Please select a Destination City / Branch.');
      setError('Please select a Destination City / Branch.');
      return;
    }

    setIsSubmitting(true);
    try {
      const numOpening = Number(openingBalance) || 0;
      const res = await updateCustomer(editingCustomer.id, {
        shopName: shopName.trim(),
        shopkeeperName: shopkeeperName.trim() || '',
        city,
        area: area.trim(),
        phone: phone.trim(),
        marketAddress: marketAddress.trim(),
        openingBalance: numOpening,
        notes: notes.trim(),
        inUgrahi,
        ugrahiRoute: inUgrahi ? ugrahiRoute : null
      });

      if (!res || !res.success) {
        showError('Update Failed', res?.message || 'Error updating customer profile in MySQL');
        setError(res?.message || 'Error updating customer in MySQL');
        setIsSubmitting(false);
        return;
      }

      // Sync active statement modal if open for this customer
      if (selectedCustomerKhata && selectedCustomerKhata.id === editingCustomer.id) {
        const currentShopLower = shopName.trim().toLowerCase();
        const customerDispatches = (outward || []).filter(o => 
          (o.customerId && o.customerId === editingCustomer.id) ||
          (o.customerName && currentShopLower && o.customerName.toLowerCase() === currentShopLower)
        );
        const totalBilled = customerDispatches.reduce((s, d) => s + (Number(d.totalSaleAmount) || 0), 0);
        const newTotalBill = totalBilled + numOpening;
        const totalPaid = Number(editingCustomer.totalPaid || 0);

        setSelectedCustomerKhata(prev => ({
          ...prev,
          shopName: shopName.trim(),
          shopkeeperName: (shopkeeperName.trim() || shopName.trim()),
          city,
          phone: phone.trim(),
          marketAddress: marketAddress.trim(),
          notes: notes.trim(),
          totalBill: newTotalBill,
          remainingBalance: newTotalBill - totalPaid
        }));
      }

      showToast(`Shopkeeper "${shopName.trim()}" updated successfully!`, 'success');
      handleClose();
    } catch (err) {
      showError('Update Error', err.message || 'Server error occurred');
      setError(err.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = Number(editingCustomer.remainingBalance) || 0;
  const isPending = remaining > 0;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Shopkeeper Details</h2>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                {editingCustomer.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Shop name, owner name, phone, address and branch update
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

        {/* Live Khata Summary Banner (Read-only financial status) */}
        <div className="bg-slate-50/70 dark:bg-slate-800/40 px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Current Khata:</span>
            <span className={`font-mono font-semibold ${isPending ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              Rs. {remaining.toLocaleString()}
            </span>
            {remaining >= 100000 && (
              <span className="text-[10px] text-slate-400 font-mono">
                ({formatLakhCrore(remaining)})
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Mal Dispatched: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{Number(editingCustomer.totalPiecesReceived || 0).toLocaleString()} pcs</span>
          </div>
        </div>

        {/* Form - Flex Column Layout */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          {/* Scrollable Form Body */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Row 1: Shop Name & Shopkeeper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Shop / Firm Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Khalid Fabric, Al-Madina"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Owner / Shopkeeper Name
                </label>
                <input
                  type="text"
                  value={shopkeeperName}
                  onChange={(e) => setShopkeeperName(e.target.value)}
                  placeholder="e.g. Khalid, Bhai Akram"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Row 2: City / Branch, Area & Phone (3 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  City / Branch <span className="text-rose-500">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                >
                  {cities.map(c => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Area / Locality</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. Shahdara, Cantt</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="customer-edit-areas-list"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Type or pick area..."
                    className="w-full px-3 py-2 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                  <datalist id="customer-edit-areas-list">
                    {cityAreas.map((a, i) => (
                      <option key={a.id || i} value={a.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0334-9730227"
                  className="w-full px-3 py-2 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Row 3: Market / Shop Address & Sabqa Baqaya (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Market / Shop Address (Dukaan ka Pata)
                </label>
                <input
                  type="text"
                  value={marketAddress}
                  onChange={(e) => setMarketAddress(e.target.value)}
                  placeholder="e.g. Shop # 14, Main Cloth Market, Shahdara"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sabqa Baqaya / Opening Balance (PKR)
                  </label>
                  {Number(openingBalance) > 0 && (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {formatLakhCrore(Number(openingBalance))}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-medium text-slate-400 font-mono">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0"
                    className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Khata Notes / Special Terms (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Payment terms, cargo service name, delivery instructions..."
                className="w-full px-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
              />
            </div>

            {/* Row 5: Ugrahi (Payment Collection) Integration - Clean Highlighted Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              inUgrahi
                ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-2xs'
                : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inUgrahi}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setInUgrahi(checked);
                      if (checked && UGRAHI_ROUTES.includes(city)) {
                        setUgrahiRoute(city);
                      }
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ReceiptText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Include in Payment Collection List?</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Assign this customer to scheduled collection route
                    </span>
                  </div>
                </label>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  inUgrahi 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {inUgrahi ? '✓ In Payment Collection' : 'Not Included'}
                </span>
              </div>

              {inUgrahi && (
                <div className="mt-3 pt-3 border-t border-blue-200/80 dark:border-blue-800/70 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Select Collection Route / City <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Selected: <b className="text-blue-600 dark:text-blue-400 font-bold underline">{ugrahiRoute}</b>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {UGRAHI_ROUTES.map(route => {
                      const isSelected = ugrahiRoute === route;
                      return (
                        <button
                          key={route}
                          type="button"
                          onClick={() => setUgrahiRoute(route)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-[1.02]'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                          }`}
                        >
                          <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          <span>{route}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    ✓ This customer will be included in the <b>"{ugrahiRoute}"</b> route on the Payment Collection page.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                💡 <b>Khata Note:</b> Naam ya pata badalney sa pichli tamam Rawangi (Outward) aur Wasooli (Payments) ki receipts par naya naam khud ba khud lag jae ga.
              </p>
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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving to Database...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
