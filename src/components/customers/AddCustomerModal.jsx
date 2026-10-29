import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';
import { formatLakhCrore } from '../../utils/formatters';

export const AddCustomerModal = () => {
  const { isAddCustomerOpen, setIsAddCustomerOpen, cities, addCustomer } = useApp();

  const [shopName, setShopName] = useState('');
  const [shopkeeperName, setShopkeeperName] = useState('');
  const [city, setCity] = useState(cities[0]?.name || 'Lahore');
  const [phone, setPhone] = useState('');
  const [marketAddress, setMarketAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      phone: phone.trim(),
      marketAddress: marketAddress.trim(),
      openingBalance: Number(openingBalance) || 0,
      notes: notes.trim()
    });

    if (!res || !res.success) {
      showError('Cannot Add Customer', res?.message || 'Error registering customer in MySQL');
      setError(res?.message || 'Error registering customer in MySQL');
      return;
    }

    showToast(`Shopkeeper "${shopName}" registered successfully for ${city}!`, 'success');
    setIsAddCustomerOpen(false);
    setShopName('');
    setShopkeeperName('');
    setPhone('');
    setMarketAddress('');
    setOpeningBalance('');
    setNotes('');
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

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
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

          {/* Shop Name & Shopkeeper */}
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

          {/* City / Branch & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                City / Branch <span className="text-rose-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all cursor-pointer"
              >
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
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
                className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Market Address */}
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

          {/* Opening Khata Balance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pehlay Ka Baqaya Khata (Opening Balance)
              </label>
              {Number(openingBalance) > 0 && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {formatLakhCrore(openingBalance)}
                </span>
              )}
            </div>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0 (agar pehlay se hisaab baqi hai)"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Agar is dukandar ke zimmay pehlay se koi raqam baqi hai to likhein, warna 0 rehne dein.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Wholesale jacket buyer, transports via Goods Bilty"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 sticky bottom-0 bg-white dark:bg-slate-900 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 px-5 sm:px-6 py-3 mt-2 shadow-xs">
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Save Customer
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
