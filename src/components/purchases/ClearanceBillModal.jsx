import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Ship, 
  Anchor, 
  FileText, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Phone
} from 'lucide-react';
import logoImg from '../../images/khan jacket logo.png';
import { downloadClearancePDF } from '../../utils/pdfGenerator';

export const ClearanceBillModal = ({ clearance, isOpen, onClose }) => {
  if (!isOpen || !clearance) return null;

  const handlePrint = () => {
    window.print();
  };

  const c = clearance;
  const customDuty = Number(c.customDuty) || 0;
  const shippingLine = Number(c.shippingLineCharges) || 0;
  const portPayment = Number(c.portPayment) || 0;
  const clearanceCharges = Number(c.clearanceCharges) || 0;
  const consignee = Number(c.consigneeCharges) || 0;
  const dryPort = Number(c.dryPortExpenses) || 0;
  const service = Number(c.serviceCharges) || 0;
  const agency = Number(c.agencyFee) || 0;
  const inst = Number(c.insCharges) || 0;
  const road = Number(c.roadTransport) || 0;
  const driver = Number(c.driver) || 0;
  const crane = Number(c.craneLabour) || 0;
  const railway = Number(c.railway) || 0;
  const other = Number(c.otherExpenses) || 0;

  const totalPortExpenses = shippingLine + portPayment + clearanceCharges + consignee + dryPort + service + agency + inst + road + driver + crane + railway + other;
  const grandTotal = Number(c.grandTotal) || (customDuty + totalPortExpenses);
  const paidAmount = Number(c.paidAmount) || 0;
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  const isCleared = remainingAmount <= 0 && grandTotal > 0;
  const isPartial = paidAmount > 0 && remainingAmount > 0;

  // Charge rows with labels and amounts
  const chargeItems = [
    { name: 'Custom Duty (FBR / Govt. Tariff)', category: 'Govt. Custom Duty', amount: customDuty, isDuty: true },
    { name: 'Shipping Line + Empty Container Charges', category: 'Shipping Line', amount: shippingLine },
    { name: 'Port Payment & Terminal Charges', category: 'Port Payment', amount: portPayment },
    { name: 'Clearance Charges / Clearing Agent Fee', category: 'Clearance Fee', amount: clearanceCharges },
    { name: 'Consignee Charges (Concinises / DO)', category: 'Port Handling', amount: consignee },
    { name: 'DryPort Terminal & Handling Charges', category: 'DryPort Expenses', amount: dryPort },
    { name: 'Service & Forwarding Charges', category: 'Clearing Service', amount: service },
    { name: 'Agency Fee / Documentation', category: 'Agency Charges', amount: agency },
    { name: 'INS/T (Marine & Port Insurance)', category: 'Insurance', amount: inst },
    { name: 'Pakistan Railway Freight & Rake Charges', category: 'Rail Freight', amount: railway },
    { name: 'Road Transport / Haulage to Warehouse', category: 'Transport', amount: road },
    { name: 'Driver Allowance & Batta', category: 'Logistics', amount: driver },
    { name: 'Crane Offloading & Heavy Labour', category: 'Labour & Crane', amount: crane },
    { name: 'Other Expenses & Demurrage', category: 'Miscellaneous', amount: other }
  ].filter(i => i.amount > 0);

  return (
    <div className="clearance-modal-overlay fixed inset-0 z-[85] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:m-0 print:bg-white print:static print:block print:overflow-visible print:overflow-x-visible print:overflow-y-visible">
      <div className="clearance-modal-card bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150 transition-colors print:max-h-none print:h-auto print:max-w-none print:w-full print:border-none print:shadow-none print:rounded-none print:overflow-visible print:overflow-x-visible print:overflow-y-visible print:block print:bg-white print:text-slate-950">
        
        {/* Top Control Bar (Non-printable) */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              Customs & Clearance Voucher — Inv #{c.invoiceNo}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isCleared 
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : isPartial
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {isCleared ? 'Fully Cleared / Paid' : isPartial ? 'Partial Paid' : 'Unpaid / Due'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadClearancePDF(c)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div 
          id="clearance-bill-print-area" 
          className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-sans text-xs space-y-5 print:overflow-visible print:overflow-x-visible print:overflow-y-visible print:p-0 print:m-0 print:h-auto print:max-h-none print:space-y-2.5 print:bg-white print:text-slate-950 print:[scrollbar-width:none] print:[&::-webkit-scrollbar]:hidden"
        >
          
          {/* 1. Official Header (Khan Jacket House Branding) */}
          <div className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 print:border-slate-300 print:pb-2 print:gap-2">
            <div className="flex flex-col items-start gap-1 print:gap-0">
              <img 
                src={logoImg} 
                alt="Khan Jacket House" 
                className="h-12 w-auto object-contain print:h-9"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium print:text-[9.5px] print:text-slate-600">
                China Import Consignments & Central Wholesale Warehouse • Lahore, Pakistan
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] uppercase tracking-wider border border-blue-200 dark:border-blue-800 whitespace-nowrap print:bg-slate-100 print:text-slate-900 print:border-slate-300 print:text-[10px] print:py-0.5 print:px-2.5 print:font-extrabold">
                Customs Duty & Clearance Voucher
              </span>
              <div className="text-xl font-mono font-black text-slate-950 dark:text-white mt-1 print:text-slate-950 print:text-base print:mt-0.5">
                INV #{c.invoiceNo}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 print:text-[10px]">
                Bill Date: <strong className="text-slate-800 dark:text-slate-200 print:text-slate-900">{c.billDate || 'N/A'}</strong>
              </div>
            </div>
          </div>

          {/* 2. Metadata Box: Clearing Agent & Container Logistics Info */}
          <div className="print-avoid-break border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/60 dark:bg-slate-800/40 print:bg-slate-50 print:border-slate-300 print:grid-cols-2 print:p-2.5 print:py-1.5 print:gap-x-4 print:gap-y-0.5 print:text-[10px]">
            {/* Left: Clearing Agent & Forwarder */}
            <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-3 md:pb-0 md:pr-4 print:border-slate-300 print:space-y-0.5 print:pb-0 print:pr-3">
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider print:text-blue-700 print:text-[9.5px]">
                Clearing Agent & Consignee Details
              </div>
              <div className="flex justify-between items-center py-0.5 print:py-0">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Clearing Agent:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm uppercase print:text-slate-900 print:text-xs">
                  {c.clearingAgent || 'BARCA TRADERS'}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 print:py-0">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Agency / Line:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800">{c.agency || 'ABASEEN'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 print:py-0">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Consignee:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800">{c.consignee || 'GUL TRADER'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 print:py-0">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Party / Khata:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800">{c.party || 'TOOR HAJI'}</span>
              </div>
              {c.contactPhone && (
                <div className="flex justify-between items-center py-0.5 print:py-0">
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Agent Phone:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300 print:text-slate-800">{c.contactPhone}</span>
                </div>
              )}
            </div>

            {/* Right: Container & Port Shipment Details */}
            <div className="space-y-2 print:space-y-0.5">
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider print:text-blue-700 print:text-[9.5px]">
                Container & Port Logistics Data
              </div>
              <div className="flex justify-between items-center py-0.5 print:py-0">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Container Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm print:text-slate-900 print:text-xs">
                  {c.containerNumber} ({c.containerSize || '40 FT'})
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 print:py-0">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">GD Number (Weboc / FBR):</span>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300 print:text-purple-800">
                  {c.gdNo || '1610'}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 print:py-0">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">B/L (Bill of Lading) #:</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200 print:text-slate-800">{c.blNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 print:py-0">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Port & Net Weight:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800">{c.port || 'AKDP'} • {c.weight || '22 MT'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 print:py-0">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Open Date / G.O Date:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 print:text-slate-800">
                  {c.openDate || '-'} / {c.goDate || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Itemized Duty & Port Expenses Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden print:border-slate-300 print:overflow-visible">
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between print:bg-slate-100 print:border-slate-300 print:py-1 print:px-2.5">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] print:text-[10px] print:text-slate-900">
                Itemized Customs Duty & Port Charges Breakdown
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium print:text-[9.5px] print:text-slate-600">
                Currency: PKR
              </span>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                  <th className="py-2 px-3 w-10 text-center print:py-1 print:px-2 print:text-[9.5px]">#</th>
                  <th className="py-2 px-3 print:py-1 print:px-2 print:text-[9.5px]">Expense Head / Particulars</th>
                  <th className="py-2 px-3 print:py-1 print:px-2 print:text-[9.5px]">Category</th>
                  <th className="py-2 px-3 text-right print:py-1 print:px-2 print:text-[9.5px]">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs print:divide-slate-200">
                {chargeItems.map((item, idx) => (
                  <tr key={idx} className={`print-avoid-break ${item.isDuty ? 'bg-purple-50/50 dark:bg-purple-950/20 font-semibold print:bg-purple-50' : ''}`}>
                    <td className="py-2 px-3 text-center font-mono text-slate-400 print:text-slate-600 print:py-1 print:px-2 print:text-[10px]">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white print:text-slate-900 print:py-1 print:px-2 print:text-[10.5px]">
                      {item.name}
                      {item.isDuty && (
                        <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 print:bg-purple-100 print:text-purple-800 print:text-[9px] print:py-0 print:px-1">
                          Main Custom GD
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 print:text-slate-600 print:py-1 print:px-2 print:text-[10px]">{item.category}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-slate-900 print:py-1 print:px-2 print:text-[10.5px]">
                      Rs. {Math.round(item.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. Financial Summary Grid */}
          <div className="print-avoid-break grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
            <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 print:bg-purple-50 print:border-purple-300 print:p-2 print:py-1.5">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block print:text-purple-800 print:text-[9px]">
                Total Custom GD Duty
              </span>
              <div className="text-base font-mono font-extrabold text-purple-700 dark:text-purple-300 mt-1 print:text-purple-900 print:text-sm print:mt-0.5">
                Rs. {Math.round(customDuty).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 print:text-[8.5px]">Govt / FBR Weboc Duty</span>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 print:bg-blue-50 print:border-blue-300 print:p-2 print:py-1.5">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block print:text-blue-800 print:text-[9px]">
                Total Port & Logistics
              </span>
              <div className="text-base font-mono font-extrabold text-blue-700 dark:text-blue-300 mt-1 print:text-blue-900 print:text-sm print:mt-0.5">
                Rs. {Math.round(totalPortExpenses).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 print:text-[8.5px]">DryPort, Rail, Crane & Service</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-900 dark:border-slate-700 bg-slate-900 text-white dark:bg-slate-800 print:bg-slate-100 print:text-slate-900 print:border-slate-400 print:p-2 print:py-1.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block print:text-slate-700 print:text-[9px]">
                Net Grand Clearance Bill
              </span>
              <div className="text-lg font-mono font-black text-amber-400 mt-1 print:text-slate-950 print:text-sm print:mt-0.5">
                Rs. {Math.round(grandTotal).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 print:text-[8.5px]">Duty + Logistics Landed Total</span>
            </div>
          </div>

          {/* 5. Khata Payment Status Banner */}
          <div className="print-avoid-break p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 print:flex-row print:bg-slate-50 print:border-slate-300 print:p-2 print:py-1.5 print:gap-2">
            <div className="flex items-center gap-2.5 print:gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 print:w-7 print:h-7 ${
                isCleared 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {isCleared ? <CheckCircle2 className="w-4 h-4 print:w-3.5 print:h-3.5" /> : <Clock className="w-4 h-4 print:w-3.5 print:h-3.5" />}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block print:text-slate-900 print:text-[10px]">
                  Clearing Khata Settlement Status
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-700 print:text-[9.5px]">
                  Total Paid: <strong className="font-mono text-emerald-600 dark:text-emerald-400 print:text-emerald-700">Rs. {Math.round(paidAmount).toLocaleString()}</strong>
                  {remainingAmount > 0 && (
                    <> • Remaining Due: <strong className="font-mono text-rose-600 dark:text-rose-400 print:text-rose-700">Rs. {Math.round(remainingAmount).toLocaleString()}</strong></>
                  )}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block print:text-slate-600 print:text-[8.5px]">
                Balance Due
              </span>
              <span className={`text-base font-mono font-black print:text-sm ${
                isCleared ? 'text-emerald-600 dark:text-emerald-400 print:text-emerald-700' : 'text-rose-600 dark:text-rose-400 print:text-rose-700'
              }`}>
                Rs. {Math.round(remainingAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 6. Notes if present */}
          {c.notes && (
            <div className="print-avoid-break p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 print:bg-slate-50 print:border-slate-300 print:text-slate-700 print:p-1.5 print:text-[9.5px]">
              <strong className="text-slate-900 dark:text-white print:text-slate-900">Remarks / Notes:</strong> {c.notes}
            </div>
          )}

          {/* 7. Signatures Block */}
          <div className="print-avoid-break pt-6 sm:pt-8 grid grid-cols-2 gap-6 sm:gap-8 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 print:border-slate-300 print:text-slate-700 print:pt-3 print:gap-4">
            <div>
              <div className="h-8 border-b border-dashed border-slate-300 dark:border-slate-700 mx-auto w-40 print:border-slate-400 print:h-5 print:w-36" />
              <div className="mt-1.5 font-semibold text-slate-700 dark:text-slate-300 print:text-slate-900 print:mt-1 print:text-[10px]">
                {c.clearingAgent || 'Clearing Agent'} Representative
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 print:text-[9px]">Duty / Port Clearance Section</div>
            </div>

            <div>
              <div className="h-8 border-b border-dashed border-slate-300 dark:border-slate-700 mx-auto w-40 print:border-slate-400 print:h-5 print:w-36" />
              <div className="mt-1.5 font-semibold text-slate-700 dark:text-slate-300 print:text-slate-900 print:mt-1 print:text-[10px]">
                Khan Jacket House
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 print:text-[9px]">Warehouse & Accounts Verification</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
