import React, { useMemo, useState, Component } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Download, 
  Printer, 
  ReceiptText, 
  MapPin, 
  Phone, 
  Calendar, 
  Package, 
  FileText,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { downloadDispatchBillPDF, formatCleanBillNo } from '../../utils/pdfGenerator';
import { showToast, showError } from '../../utils/sweetalert';

// Safe Error Boundary to prevent any blank white screen
class BillErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[BillDetailModal Error]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[90] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Unable to display bill</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {String(this.state.error?.message || 'An error occurred while loading this dispatch voucher.')}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onClose) this.props.onClose();
              }}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const BillDetailModalContent = () => {
  const { 
    selectedDispatchForBill, 
    setSelectedDispatchForBill, 
    selectedCustomerKhata,
    outward = [], 
    customers = [] 
  } = useApp();

  const [isDownloading, setIsDownloading] = useState(false);

  const currentChallan = selectedDispatchForBill?.challanNo != null 
    ? String(selectedDispatchForBill.challanNo) 
    : '';
  const cleanBillNo = formatCleanBillNo(currentChallan) || 'BILL';

  // Group all outward records belonging to this same bill
  const billItems = useMemo(() => {
    if (!selectedDispatchForBill) return [];
    if (!currentChallan) return [selectedDispatchForBill];
    const target = currentChallan.trim().toLowerCase();
    try {
      const matches = (outward || []).filter(o => {
        if (!o || o.challanNo == null) return false;
        return String(o.challanNo).trim().toLowerCase() === target;
      });
      return matches.length > 0 ? matches : [selectedDispatchForBill];
    } catch (e) {
      return [selectedDispatchForBill];
    }
  }, [outward, currentChallan, selectedDispatchForBill]);

  // Find linked customer info (prioritizing active customer khata)
  const matchedCustomer = useMemo(() => {
    if (selectedCustomerKhata) return selectedCustomerKhata;

    if (selectedDispatchForBill?.customerId) {
      const found = (customers || []).find(c => c && String(c.id) === String(selectedDispatchForBill.customerId));
      if (found) return found;
    }

    const cName = String(selectedDispatchForBill?.customerName || '').toLowerCase().trim();
    if (!cName) return null;

    return (customers || []).find(c => {
      if (!c) return false;
      const sName = String(c.shopName || '').toLowerCase().trim();
      const fullName = `${c.shopName || ''} ${c.shopkeeperName ? `(${c.shopkeeperName})` : ''}`.toLowerCase().trim();
      return sName === cName || fullName === cName;
    });
  }, [customers, selectedDispatchForBill, selectedCustomerKhata]);

  if (!selectedDispatchForBill) return null;

  // Financial calculations
  const isDirectBill = billItems.length > 0 && billItems.every(i => Boolean(i?.isWithoutStock) || i?.articleNo === 'DIRECT-SALE');
  const totalPieces = isDirectBill ? 0 : billItems.reduce((s, i) => s + (Number(i?.quantity) || 0), 0);
  const totalBillAmount = billItems.reduce((s, i) => {
    const saleAmt = Number(i?.totalSaleAmount);
    if (!isNaN(saleAmt) && saleAmt > 0) return s + saleAmt;
    const q = Number(i?.quantity) || 0;
    const r = Number(i?.unitSalePrice) || 0;
    return s + (q * r);
  }, 0);
  const paidAmount = billItems.reduce((s, i) => s + (Number(i?.paidAmount) || 0), 0);
  const netDue = Math.max(0, totalBillAmount - paidAmount);

  const customerKhataBalance = matchedCustomer && matchedCustomer.remainingBalance != null
    ? Number(matchedCustomer.remainingBalance) || 0
    : null;

  const customerDisplayName = typeof selectedDispatchForBill?.customerName === 'string' && selectedDispatchForBill.customerName.trim()
    ? selectedDispatchForBill.customerName.trim()
    : (matchedCustomer?.shopName || 'Wholesale Customer');

  const customerPhone = selectedDispatchForBill?.customerPhone || matchedCustomer?.phone || '';
  const customerLocation = selectedDispatchForBill?.destination || matchedCustomer?.marketAddress || matchedCustomer?.city || 'Lahore Wholesale Market';
  const dispatchDate = selectedDispatchForBill?.date || new Date().toISOString().split('T')[0];
  const gatePassNo = selectedDispatchForBill?.gatePassNo || '';
  const notes = selectedDispatchForBill?.notes || '';

  const handleClose = () => {
    setSelectedDispatchForBill(null);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await downloadDispatchBillPDF({
        billNo: cleanBillNo || currentChallan || 'BILL',
        date: dispatchDate,
        customerName: customerDisplayName,
        customerPhone,
        destination: customerLocation,
        gatePassNo,
        notes,
        items: billItems,
        totalPieces,
        totalBillAmount,
        paidAmount,
        customerKhataBalance
      });
      showToast(`Bill #${cleanBillNo} PDF downloaded successfully!`, 'success');
    } catch (err) {
      console.error('PDF generation failed:', err);
      showError('Download Failed', 'Could not generate PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* 1. Business Branding Header (Standard Clean Invoice Header) */}
        <div className="px-6 py-4.5 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800 shadow-2xs">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-900 dark:text-white uppercase leading-none">
                Khan Jacket House
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Wholesale Garments & Central Warehouse • Lahore, Pakistan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dispatch Invoice
              </span>
              <span className="text-base font-mono font-extrabold text-blue-600 dark:text-blue-400">
                Bill #{cleanBillNo}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Download Clean PDF Bill"
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
                title="Print Bill"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200">
          
          {/* 2. Two-Column Metadata Grid (Clean Borders, Zero Bloated Card Background) */}
          <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Left Column: Billed To / Dukaandar */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>BILLED TO (DUKAANDAR)</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {customerDisplayName}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{customerLocation}</span>
              </p>
              {customerPhone && (
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{customerPhone}</span>
                </p>
              )}
            </div>

            {/* Right Column: Dispatch & Logistics Metadata */}
            <div className="space-y-1.5 md:border-l md:border-slate-100 md:dark:border-slate-800 md:pl-5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                DISPATCH & LOGISTICS DETAILS
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Invoice / Bill #:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    Bill #{cleanBillNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Dispatch Date:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {dispatchDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Gate Pass #:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {gatePassNo ? `GP: ${gatePassNo}` : 'Standard Pass'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Transport / Goods:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate block" title={notes}>
                    {notes || 'Direct Consignment'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Compact Data Table (Subtle #f8fafc Header, Numeric Right Alignment) */}
          <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-12">#</th>
                    <th className="py-2.5 px-3.5 w-36">Article Code</th>
                    <th className="py-2.5 px-3.5">Description / Stuff</th>
                    <th className="py-2.5 px-3.5 text-right w-28">Quantity</th>
                    <th className="py-2.5 px-3.5 text-right w-28">Rate (PKR)</th>
                    <th className="py-2.5 px-3.5 text-right w-36">Total Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs">
                  {billItems.map((item, idx) => {
                    const isDirect = Boolean(item?.isWithoutStock) || item?.articleNo === 'DIRECT-SALE';
                    const code = isDirect ? 'Direct Sale' : (item?.articleNo || '—');
                    const desc = isDirect
                      ? (item?.articleName || 'Direct Bill (Bina Stock)')
                      : (item?.articleName || item?.category || 'Garment Item');
                    const qty = Number(item?.quantity) || 0;
                    const rate = Number(item?.unitSalePrice) || 0;
                    const total = Number(item?.totalSaleAmount) || (qty * rate);

                    return (
                      <tr key={item?.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-sans text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            isDirect 
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}>
                            {code}
                          </span>
                        </td>
                        <td className="py-2 px-3.5 font-sans text-slate-800 dark:text-slate-200 font-medium">
                          {desc}
                        </td>
                        <td className="py-2 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                          {isDirect ? '—' : `${qty.toLocaleString()} pcs`}
                        </td>
                        <td className="py-2 px-3.5 text-right text-slate-700 dark:text-slate-300">
                          {isDirect ? '—' : `Rs. ${rate.toLocaleString()}`}
                        </td>
                        <td className="py-2 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                          Rs. {total.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 font-bold text-xs">
                    <td colSpan="3" className="py-2.5 px-3.5 text-right font-sans text-slate-600 dark:text-slate-300">
                      Bill Total:
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-900 dark:text-white">
                      {isDirectBill ? 'Direct Bill' : `${totalPieces.toLocaleString()} pcs`}
                    </td>
                    <td></td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-900 dark:text-white text-sm">
                      Rs. {Number(totalBillAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 4. Professional Summary Block (Right-Aligned Tabular Summary, Left Notes) */}
          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 pt-1">
            
            {/* Left Notes & Consignment Remarks */}
            <div className="flex-1 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Remarks & Consignment Policy
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-xs mt-1 leading-relaxed">
                  {notes ? (
                    <><strong>Logistics:</strong> {notes}</>
                  ) : (
                    'Maal ba-hifazat rawana kiya gaya. Bill shuda raqam customer khata register mein darj kar li gayi hai.'
                  )}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Computerized wholesale khata voucher</span>
                <span>Khan Jacket House</span>
              </div>
            </div>

            {/* Right Structured Tabular Summary Block */}
            <div className="w-full sm:w-88 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs shrink-0 shadow-2xs">
              
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bill Subtotal ({totalPieces} pcs):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  Rs. {Number(totalBillAmount || 0).toLocaleString()}
                </span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Wasooli (Payment Received):</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Rs. {Number(paidAmount || 0).toLocaleString()}
                </span>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Net Bill Baqaya:</span>
                <span className={`font-mono font-extrabold ${netDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  Rs. {Number(netDue || 0).toLocaleString()}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                <span className="font-bold text-slate-800 dark:text-slate-200">Total Khata Balance Due:</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  Rs. {Number(customerKhataBalance !== null ? customerKhataBalance : netDue).toLocaleString()}
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="px-6 py-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Print-ready A4 wholesale invoice layout • High contrast typography
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export const BillDetailModal = () => {
  const { selectedDispatchForBill, setSelectedDispatchForBill } = useApp();
  if (!selectedDispatchForBill) return null;

  return (
    <BillErrorBoundary onClose={() => setSelectedDispatchForBill(null)}>
      <BillDetailModalContent />
    </BillErrorBoundary>
  );
};
