import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Ship, 
  Anchor, 
  FileText, 
  Share2,
  Phone
} from 'lucide-react';

export const ClearanceBillModal = ({ clearance, isOpen, onClose }) => {
  if (!isOpen || !clearance) return null;

  const handlePrint = () => {
    window.print();
  };

  const c = clearance;
  const customDuty = Number(c.customDuty) || 0;
  const dryPort = Number(c.dryPortExpenses) || 0;
  const service = Number(c.serviceCharges) || 0;
  const agency = Number(c.agencyFee) || 0;
  const inst = Number(c.insCharges) || 0;
  const road = Number(c.roadTransport) || 0;
  const driver = Number(c.driver) || 0;
  const consignee = Number(c.consigneeCharges) || 0;
  const crane = Number(c.craneLabour) || 0;
  const railway = Number(c.railway) || 0;

  const totalBill = Number(c.grandTotal) || (customDuty + dryPort + service + agency + inst + road + driver + consignee + crane + railway);

  return (
    <div className="fixed inset-0 z-[85] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Control Bar (Non-printable) */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Duty / Clearance Voucher — Inv #{c.invoiceNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Bill Paper Canvas */}
        <div id="clearance-bill-print-area" className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white font-sans text-xs">
          
          {/* Invoice # Top Label */}
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-2">
            INVOICE # {c.invoiceNo}
          </div>

          {/* Yellow Branding Header Box (Exact replica of Barca Traders voucher) */}
          <div className="border-2 border-slate-900 grid grid-cols-12 bg-amber-400 font-bold text-slate-950">
            <div className="col-span-6 p-3 flex items-center border-r-2 border-slate-900">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-red-700 uppercase drop-shadow-xs">
                {c.clearingAgent || 'BARCA TRADERS'}
              </span>
            </div>
            <div className="col-span-6 p-3 flex items-center justify-center text-center text-xs sm:text-sm font-extrabold uppercase tracking-wide bg-amber-300">
              DUTY / INVOICE & CLEARANCE BILL
            </div>
          </div>

          {/* Two-Column Metadata Box */}
          <div className="border-x-2 border-b-2 border-slate-900 grid grid-cols-12 text-slate-900 divide-x-2 divide-slate-900">
            {/* Left 6 cols */}
            <div className="col-span-6 divide-y divide-slate-300">
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">CONSIGNEE</span>
                <span className="col-span-7 font-semibold uppercase">{c.consignee || '—'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">Party</span>
                <span className="col-span-7 font-semibold uppercase">{c.party || '—'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">Agency</span>
                <span className="col-span-7 font-semibold uppercase">{c.agency || '—'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">GD No.</span>
                <span className="col-span-7 font-mono font-bold">{c.gdNo || '—'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">BL Number</span>
                <span className="col-span-7 font-mono font-bold">{c.blNumber || '—'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5 bg-slate-50">
                <span className="col-span-5 font-bold uppercase text-[11px]">Container #</span>
                <span className="col-span-7 font-mono font-black text-blue-900">{c.containerNumber || '—'}</span>
              </div>
            </div>

            {/* Right 6 cols */}
            <div className="col-span-6 divide-y divide-slate-300">
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">Port</span>
                <span className="col-span-7 font-semibold uppercase">{c.port || 'AKDP'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">Weight</span>
                <span className="col-span-7 font-mono font-semibold">{c.weight || '—'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">Size</span>
                <span className="col-span-7 font-bold uppercase">{c.containerSize || '40 FT'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">Open Date</span>
                <span className="col-span-7 font-mono">{c.openDate || '—'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5">
                <span className="col-span-5 font-bold uppercase text-[11px]">Go Date</span>
                <span className="col-span-7 font-mono">{c.goDate || '—'}</span>
              </div>
              <div className="grid grid-cols-12 p-1.5 bg-slate-50">
                <span className="col-span-5 font-bold uppercase text-[11px]">Bill Date</span>
                <span className="col-span-7 font-mono font-bold text-slate-900">{c.billDate || '—'}</span>
              </div>
            </div>
          </div>

          {/* Description & Amount Table */}
          <div className="mt-4 border-2 border-slate-900">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-amber-400 font-extrabold uppercase text-slate-950 border-b-2 border-slate-900 p-2">
              <div className="col-span-8">Description</div>
              <div className="col-span-4 text-right">AMOUNT</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-200 font-medium">
              <div className="grid grid-cols-12 p-2 font-bold bg-amber-50/50">
                <div className="col-span-8">Custom Duty / Govt Tax</div>
                <div className="col-span-4 text-right font-mono font-bold text-slate-900">
                  Rs {customDuty.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-12 p-2">
                <div className="col-span-8">DryPort Expences</div>
                <div className="col-span-4 text-right font-mono">
                  {dryPort > 0 ? `Rs ${dryPort.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs -'}
                </div>
              </div>

              <div className="grid grid-cols-12 p-2">
                <div className="col-span-8">Service Charges</div>
                <div className="col-span-4 text-right font-mono">
                  {service > 0 ? `Rs ${service.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs -'}
                </div>
              </div>

              <div className="grid grid-cols-12 p-2">
                <div className="col-span-8">Agency Fee</div>
                <div className="col-span-4 text-right font-mono">
                  {agency > 0 ? `Rs ${agency.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs -'}
                </div>
              </div>

              <div className="grid grid-cols-12 p-2">
                <div className="col-span-8">INS/T Charges</div>
                <div className="col-span-4 text-right font-mono">
                  {inst > 0 ? `Rs ${inst.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs -'}
                </div>
              </div>

              <div className="grid grid-cols-12 p-2">
                <div className="col-span-8">Road RWP KP</div>
                <div className="col-span-4 text-right font-mono">
                  {road > 0 ? `Rs ${road.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs -'}
                </div>
              </div>

              <div className="grid grid-cols-12 p-2">
                <div className="col-span-8">Driver</div>
                <div className="col-span-4 text-right font-mono">
                  {driver > 0 ? `Rs ${driver.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs -'}
                </div>
              </div>

              <div className="grid grid-cols-12 p-2">
                <div className="col-span-8">Consignee Charges</div>
                <div className="col-span-4 text-right font-mono">
                  {consignee > 0 ? `Rs ${consignee.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs -'}
                </div>
              </div>

              <div className="grid grid-cols-12 p-2">
                <div className="col-span-8">Crane, Labour + Extra Case …</div>
                <div className="col-span-4 text-right font-mono">
                  {crane > 0 ? `Rs ${crane.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs -'}
                </div>
              </div>

              <div className="grid grid-cols-12 p-2">
                <div className="col-span-8">Railway</div>
                <div className="col-span-4 text-right font-mono">
                  {railway > 0 ? `Rs ${railway.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs -'}
                </div>
              </div>
            </div>

            {/* Total Bill Row (Golden Yellow) */}
            <div className="grid grid-cols-12 p-2.5 bg-amber-400 font-black text-slate-950 border-t-2 border-slate-900 text-sm">
              <div className="col-span-8 uppercase text-right pr-4">Total Bill</div>
              <div className="col-span-4 text-right font-mono text-base">
                Rs {totalBill.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Paid / Balance Summary Bar */}
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-500 block">Total Bill Amount</span>
              <span className="font-mono font-bold text-slate-900">
                Rs. {totalBill.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-emerald-600 block">Paid to Agent</span>
              <span className="font-mono font-bold text-emerald-700">
                Rs. {(Number(c.paidAmount) || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-rose-600 block">Balance Remaining</span>
              <span className="font-mono font-bold text-rose-700">
                Rs. {(Number(c.remainingAmount) || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer Note and Contact Details */}
          <div className="mt-6 pt-4 border-t border-slate-300 flex items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-md text-slate-600 text-[11px] leading-relaxed">
              <p className="font-semibold text-slate-800">
                Make all checks / Transfer payable to <strong>{c.clearingAgent || 'BARCA TRADERS'}</strong>
              </p>
              <p>
                If you have any questions concerning this invoice, use the following contact information:
              </p>
              <p className="font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Accounts Dept, Whatsapp- Only {c.contactPhone || '03349191961'}</span>
              </p>
              <p className="font-bold text-slate-900 uppercase tracking-wider pt-1">
                THANK YOU FOR BUSINESS with us.
              </p>
            </div>

            {/* Stylized Logo Badge */}
            <div className="border-2 border-red-800 p-2.5 rounded-lg text-center bg-red-50/50 w-28 shrink-0">
              <div className="w-12 h-12 mx-auto rounded-lg bg-red-700 text-white flex items-center justify-center font-serif text-2xl font-black italic shadow-inner">
                BT
              </div>
              <div className="text-[10px] font-black uppercase text-red-900 mt-1 tracking-tight">
                BARCA
              </div>
              <div className="text-[9px] font-bold uppercase text-slate-700 tracking-wider">
                TRADERS
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

