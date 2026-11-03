import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, AlertCircle, ReceiptText, MapPin } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatLakhCrore } from '../../utils/formatters';
import { UGRAHI_ROUTES } from '../../constants/ugrahiRoutes';

export const AddCustomerModal = () => {
  const { isAddCustomerOpen, setIsAddCustomerOpen, cities, areas = [], addCustomer } = useApp();

  const [shopName, setShopName] = useState('');
  const [shopkeeperName, setShopkeeperName] = useState('');
  const [city, setCity] = useState(cities[0]?.name || 'Lahore');
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');
  const [marketAddress, setMarketAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [inUgrahi, setInUgrahi] = useState(false);
  const [ugrahiRoute, setUgrahiRoute] = useState('Lahore');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cityAreas = areas.filter(a => (a.cityName || '').toLowerCase() === (city || '').toLowerCase());

  if (!isAddCustomerOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!shopName.trim()) {
      showError('Required Field', 'Shop Name is required (e.g. Kashmir Traders, Al-Madina Garments).');
      setError('Shop Name is required (e.g. Kashmir Traders, Al-Madina Garments).');
      return;
    }

    if (!city) {
      showError('Required Field', 'Please select a Destination City / Branch.');
      setError('Please select a Destination City / Branch.');
      return;
    }

    const res = await addCustomer({
      shopName: shopName.trim(),
      shopkeeperName: (shopkeeperName.trim() || shopName.trim()),
      city,
      area: area.trim(),
      phone: phone.trim(),
      marketAddress: marketAddress.trim(),
      openingBalance: Number(openingBalance) || 0,
      notes: notes.trim(),
      inUgrahi,
      ugrahiRoute: inUgrahi ? ugrahiRoute : null
    });

    if (!res || !res.success) {
      showError('Cannot Add Customer', res?.message || 'Error registering customer in MySQL');
      setError(res?.message || 'Error registering customer in MySQL');
      return;
    }

    showToast(`Shopkeeper "${shopName}" registered successfully!${inUgrahi ? ` Added to Payment Collection (${ugrahiRoute}).` : ''}`, 'success');
    setIsAddCustomerOpen(false);
    setShopName('');
    setShopkeeperName('');
    setArea('');
    setPhone('');
    setMarketAddress('');
    setOpeningBalance('');
    setNotes('');
    setInUgrahi(false);
    setUgrahiRoute('Lahore');
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New Shopkeeper / Customer</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register wholesale shop, branch location, and initial khata
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
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

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
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
                  placeholder="e.g. Al-Madina Garments"
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
                  placeholder="e.g. Haji Rafiq, Bhai Akram"
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
                  onChange={(e) => {
                    setCity(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
                >
                  {cities.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
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
                    list="customer-add-areas-list"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Type or pick area..."
                    className="w-full px-3 py-2 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                  <datalist id="customer-add-areas-list">
                    {cityAreas.map((a, i) => (
                      <option key={a.id || i} value={a.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3 py-2 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Row 3: Shop / Market Address & Pehlay Ka Baqaya (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Shop / Market Address
                </label>
                <input
                  type="text"
                  value={marketAddress}
                  onChange={(e) => setMarketAddress(e.target.value)}
                  placeholder="e.g. Shop # 24, Raja Bazaar, Rawalpindi"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pehlay Ka Baqaya (Opening Balance)
                  </label>
                  {Number(openingBalance) > 0 && (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {formatLakhCrore(openingBalance)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0 (Optional)"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Row 4: Notes (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes / Transport (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Wholesale jacket buyer, transports via Goods Bilty"
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

          </div>

          {/* Fixed Footer Bar - ALWAYS visible outside the scrollable body */}
          <div className="shrink-0 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Customer</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
