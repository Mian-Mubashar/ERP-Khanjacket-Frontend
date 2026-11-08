import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  FileText, 
  Anchor, 
  Truck, 
  Calculator, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Ship,
  Sparkles
} from 'lucide-react';
import { showToast, showError } from '../../utils/sweetalert';

export const NewClearanceModal = ({ isOpen, onClose, editingClearance = null }) => {
  const { addClearance, updateClearance, purchases = [] } = useApp();

  const getDefaultForm = (item) => ({
    invoiceNo: item?.invoiceNo || '',
    clearingAgent: item?.clearingAgent || 'BARCA TRADERS',
    consignee: item?.consignee || 'GUL TRADER',
    party: item?.party || 'TOOR HAJI',
    agency: item?.agency || 'ABASEEN',
    port: item?.port || 'AKDP',
    weight: item?.weight || '22 MT',
    containerSize: item?.containerSize || '40 FT',
    gdNo: item?.gdNo || '',
    blNumber: item?.blNumber || '',
    containerNumber: item?.containerNumber || '',
    openDate: item?.openDate || '',
    goDate: item?.goDate || '',
    billDate: item?.billDate || new Date().toISOString().split('T')[0],
    purchaseId: item?.purchaseId || '',
    applyToPurchaseCost: item?.applyToPurchaseCost !== undefined ? item.applyToPurchaseCost : true,

    // Itemized charges
    customDuty: item ? Number(item.customDuty || 0) : 0,
    dryPortExpenses: item ? Number(item.dryPortExpenses || 0) : 0,
    serviceCharges: item ? Number(item.serviceCharges || 0) : 0,
    agencyFee: item ? Number(item.agencyFee || 0) : 0,
    insCharges: item ? Number(item.insCharges || 0) : 0,
    roadTransport: item ? Number(item.roadTransport || 0) : 0,
    driver: item ? Number(item.driver || 0) : 0,
    consigneeCharges: item ? Number(item.consigneeCharges || 0) : 0,
    craneLabour: item ? Number(item.craneLabour || 0) : 0,
    railway: item ? Number(item.railway || 0) : 0,
    otherExpenses: item ? Number(item.otherExpenses || 0) : 0,

    paidAmount: item ? Number(item.paidAmount || 0) : 0,
    contactPhone: item?.contactPhone || '03349191961',
    notes: item?.notes || ''
  });

  const [form, setForm] = useState(() => getDefaultForm(editingClearance));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(getDefaultForm(editingClearance));
      setErrorMsg('');
    }
  }, [isOpen, editingClearance]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Calculations
  const customDuty = Number(form.customDuty) || 0;
  const portExpenses = (
    (Number(form.dryPortExpenses) || 0) +
    (Number(form.serviceCharges) || 0) +
    (Number(form.agencyFee) || 0) +
    (Number(form.insCharges) || 0) +
    (Number(form.roadTransport) || 0) +
    (Number(form.driver) || 0) +
    (Number(form.consigneeCharges) || 0) +
    (Number(form.craneLabour) || 0) +
    (Number(form.railway) || 0) +
    (Number(form.otherExpenses) || 0)
  );

  const grandTotal = customDuty + portExpenses;
  const paidAmount = Number(form.paidAmount) || 0;
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.containerNumber?.trim()) {
      setErrorMsg('Please enter container number (e.g. BMOU4084980).');
      return;
    }
    if (!form.invoiceNo?.trim()) {
      setErrorMsg('Please enter invoice # (e.g. 1110).');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingClearance?.id) {
        const res = await updateClearance(editingClearance.id, form);
        if (res.success) {
          showToast('Container clearance bill updated successfully!', 'success');
          onClose();
        } else {
          setErrorMsg(res.message || 'Failed to update clearance bill.');
        }
      } else {
        const res = await addClearance(form);
        if (res.success) {
          showToast(`Clearance Bill #${form.invoiceNo} (${form.clearingAgent}) recorded successfully!`, 'success');
          onClose();
        } else {
          setErrorMsg(res.message || 'Failed to record clearance bill.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{editingClearance ? 'Edit' : 'Record'} Container Clearance & Duty Bill</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Customs Port Voucher
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customs Duty, DryPort clearance expenses, crane, railway and clearing agent breakdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Header Information (Consignee, Party, Container #, GD #, BL #) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Ship className="w-3.5 h-3.5 text-amber-500" />
              <span>Container & Consignment Identification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clearing Agent / Trader *
                </label>
                <input
                  type="text"
                  required
                  value={form.clearingAgent}
                  onChange={e => handleChange('clearingAgent', e.target.value)}
                  placeholder="e.g. BARCA TRADERS"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white uppercase focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice / Bill # *
                </label>
                <input
                  type="text"
                  required
                  value={form.invoiceNo}
                  onChange={e => handleChange('invoiceNo', e.target.value)}
                  placeholder="e.g. 1110"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Container # *
                </label>
                <input
                  type="text"
                  required
                  value={form.containerNumber}
                  onChange={e => handleChange('containerNumber', e.target.value)}
                  placeholder="e.g. BMOU4084980"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bill Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.billDate}
                  onChange={e => handleChange('billDate', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Consignee
                </label>
                <input
                  type="text"
                  value={form.consignee}
                  onChange={e => handleChange('consignee', e.target.value)}
                  placeholder="e.g. GUL TRADER"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white uppercase focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Party
                </label>
                <input
                  type="text"
                  value={form.party}
                  onChange={e => handleChange('party', e.target.value)}
                  placeholder="e.g. TOOR HAJI"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white uppercase focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agency / Agent
                </label>
                <input
                  type="text"
                  value={form.agency}
                  onChange={e => handleChange('agency', e.target.value)}
                  placeholder="e.g. ABASEEN"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white uppercase focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Port
                </label>
                <input
                  type="text"
                  value={form.port}
                  onChange={e => handleChange('port', e.target.value)}
                  placeholder="e.g. AKDP"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white uppercase focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GD # (Goods Declaration)
                </label>
                <input
                  type="text"
                  value={form.gdNo}
                  onChange={e => handleChange('gdNo', e.target.value)}
                  placeholder="e.g. 1610"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white uppercase focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  BL Number (Bill of Lading)
                </label>
                <input
                  type="text"
                  value={form.blNumber}
                  onChange={e => handleChange('blNumber', e.target.value)}
                  placeholder="e.g. 026F533603"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white uppercase focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Container Size
                </label>
                <select
                  value={form.containerSize}
                  onChange={e => handleChange('containerSize', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:border-amber-500 outline-hidden cursor-pointer"
                >
                  <option value="40 FT">40 FT High Cube</option>
                  <option value="20 FT">20 FT Standard</option>
                  <option value="45 FT">45 FT HQ</option>
                  <option value="LCL">LCL Loose Cargo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Weight
                </label>
                <input
                  type="text"
                  value={form.weight}
                  onChange={e => handleChange('weight', e.target.value)}
                  placeholder="e.g. 22 MT"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-amber-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 2. Itemized Duty & Port Clearance Charges */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-blue-500" />
                <span>Duty / Clearance Charges Breakdown (PKR)</span>
              </h3>
              <span className="text-xs text-slate-400">Enter amounts exactly as per agent slip</span>
            </div>

            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Custom Duty */}
                <div className="sm:col-span-2 lg:col-span-3 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                  <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                    🏛️ Custom Duty / Govt Tax (Customs GD Amount)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.customDuty}
                    onChange={e => handleChange('customDuty', e.target.value)}
                    placeholder="8057427"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-base font-mono font-bold text-amber-900 dark:text-amber-200 outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* 2. DryPort Expences */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    DryPort Expenses
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.dryPortExpenses}
                    onChange={e => handleChange('dryPortExpenses', e.target.value)}
                    placeholder="1250000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* 3. Service Charges */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Charges
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.serviceCharges}
                    onChange={e => handleChange('serviceCharges', e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* 4. Agency Fee */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agency Fee
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.agencyFee}
                    onChange={e => handleChange('agencyFee', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* 5. INS/T Charges */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    INS/T Charges (Insurance)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.insCharges}
                    onChange={e => handleChange('insCharges', e.target.value)}
                    placeholder="500000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* 6. Road Transport (RWP / KP) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Road Transport (RWP / KP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.roadTransport}
                    onChange={e => handleChange('roadTransport', e.target.value)}
                    placeholder="100000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* 7. Driver */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver & Tolls
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.driver}
                    onChange={e => handleChange('driver', e.target.value)}
                    placeholder="20000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* 8. Crane & Labour */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Crane, Labour + Extra Case ...
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.craneLabour}
                    onChange={e => handleChange('craneLabour', e.target.value)}
                    placeholder="55000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* 9. Railway */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Railway Freight
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.railway}
                    onChange={e => handleChange('railway', e.target.value)}
                    placeholder="95000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* 10. Consignee / Other */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Other Port Charges
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.otherExpenses}
                    onChange={e => handleChange('otherExpenses', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Link to China Purchase & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Left: Link & Notes */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link to China Purchase Consignment (Optional)
                </label>
                <select
                  value={form.purchaseId}
                  onChange={e => handleChange('purchaseId', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:border-amber-500 outline-hidden cursor-pointer"
                >
                  <option value="">None (Independent Container Voucher)</option>
                  {purchases.map(p => (
                    <option key={p.id} value={p.id}>
                      Inv #{p.invoiceNo} • {p.supplierName} (Container: {p.containerNo || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agent Contact / Whatsapp #
                </label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={e => handleChange('contactPhone', e.target.value)}
                  placeholder="03349191961"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Extra Remarks
                </label>
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  placeholder="e.g. Accounts Dept Whatsapp only 03349191961..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Right: Live Calculation Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 dark:to-slate-800/60 rounded-2xl p-4 border border-amber-200/80 dark:border-amber-900/60 flex flex-col justify-between space-y-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Custom Duty / Govt Tax:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                    Rs. {customDuty.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Port & Logistic Expenses:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    + Rs. {portExpenses.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-amber-200 dark:border-amber-900 flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    Grand Total Bill:
                  </span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white text-lg">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Paid to Agent (PKR):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.paidAmount}
                    onChange={e => handleChange('paidAmount', e.target.value)}
                    className="w-36 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 text-right outline-hidden"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">Remaining Balance:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                    Rs. {balanceDue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : (editingClearance ? 'Update Bill' : 'Save Clearance Bill')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
