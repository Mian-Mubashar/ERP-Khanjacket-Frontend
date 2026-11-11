import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KHAN_ICON_BASE64 } from './pdfLogo';

// Helper for professional currency format
const formatPKR = (num) => {
  return `Rs. ${(Number(num) || 0).toLocaleString()}`;
};

// Helper for Khan Clothes letterhead header
const drawHeader = (doc, title, subtitle, documentNo = '') => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Dark Navy Bar (Deep Corporate Slate-900)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Top Thin Golden Accent Stripe
  doc.setFillColor(217, 119, 6); // amber-600 gold
  doc.rect(0, 0, pageWidth, 1.5, 'F');

  // Business Real Golden Shield Emblem Logo
  try {
    doc.addImage(KHAN_ICON_BASE64, 'PNG', 14, 4.2, 15.5, 19.5);
  } catch (e) {
    // Elegant fallback if ever needed
    doc.setFillColor(217, 119, 6);
    doc.roundedRect(14, 5, 16, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('KJH', 17, 16);
  }

  // Brand Name
  doc.setFontSize(14.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('KHAN JACKET HOUSE', 33, 12.5);

  // Brand Subtitle & Tagline
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6); // Golden accent
  doc.text('WHOLESALE APPAREL & CENTRAL WAREHOUSE', 33, 17.5);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Direct China Consignments • Shahdra / Lahore, Pakistan • Contact: +92 334 6582412', 33, 22.5);

  // Top Right: Document Identifier & Timestamp (No restrictive border; auto-adjusts to any text length)
  if (documentNo) {
    doc.setFont('helvetica', 'bold');
    let fSize = 8.5;
    doc.setFontSize(fSize);
    let displayText = String(documentNo).trim();

    // Dynamically scale font size if text is long so it always fits perfectly
    const maxAvailableWidth = 92;
    while (doc.getTextWidth(displayText) > maxAvailableWidth && fSize > 6.5) {
      fSize -= 0.4;
      doc.setFontSize(fSize);
    }
    // Safe fallback truncate if an extraordinarily long string is passed
    while (doc.getTextWidth(displayText) > maxAvailableWidth && displayText.length > 8) {
      displayText = displayText.slice(0, -4).trim() + '...';
    }

    doc.setTextColor(96, 165, 250); // crisp light blue-400
    doc.text(displayText, pageWidth - 14, 12.5, { align: 'right' });
  }

  // Generation Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184); // slate-400
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Generated: ${genDate}`, pageWidth - 14, documentNo ? 18.5 : 14.5, { align: 'right' });

  // Document Title Banner below Navy Bar
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(0, 28, pageWidth, 13, 'F');
  doc.setLineWidth(0.3);
  doc.line(0, 41, pageWidth, 41);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title.toUpperCase(), 14, 36.5);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(subtitle, pageWidth - 14, 36.5, { align: 'right' });
  }

  return 47; // Return next Y position
};

// Helper for authorized signatures and verification footer
const drawFooter = (doc, startY) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = Math.max(startY + 15, pageHeight - 32);

  // Signature lines
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);

  // Prepared By
  doc.line(14, footerY, 70, footerY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Prepared By (Warehouse Incharge)', 14, footerY + 4);

  // Checked & Verified By
  doc.line(pageWidth / 2 - 28, footerY, pageWidth / 2 + 28, footerY);
  doc.text('Verified By (Accounts Officer)', pageWidth / 2 - 28, footerY + 4);

  // Approved Signature
  doc.line(pageWidth - 70, footerY, pageWidth - 14, footerY);
  doc.text('Authorized Signature (Admin / CEO)', pageWidth - 70, footerY + 4);

  // Bottom Notice
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is an official computer-generated document from Khan Jacket House Warehouse Management System. Valid without physical stamp.',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );
};

// -------------------------------------------------------------
// 1. CHINA IMPORT INVOICE VOUCHER PDF
// -------------------------------------------------------------
export const downloadInvoicePDF = (invoice) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = drawHeader(
    doc,
    'China Import Invoice Voucher',
    'Warehouse Inward Consignment Record',
    `Invoice #${invoice.invoiceNo}`
  );

  // Info Cards Grid
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, currentY, 182, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Supplier
  doc.text('Supplier / China Factory:', 18, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.supplierName || 'N/A', 18, currentY + 11);

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Purchase Date:', 95, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.purchaseDate || 'N/A', 95, currentY + 11);

  // Container #
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Container / Cargo #:', 135, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFont('courier', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(invoice.containerNo || 'N/A', 135, currentY + 11);

  // Status & Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Status: Stock In Warehouse  |  Remarks: ${invoice.notes || 'Import consignment received in full'}`, 18, currentY + 18);

  currentY += 28;

  // Table of Items
  const tableData = (invoice.items || []).map((item, index) => [
    index + 1,
    item.articleNo,
    item.articleName || 'Garment Article',
    item.category || 'Jacket',
    `${(item.quantity || 0).toLocaleString()} pcs`,
    formatPKR(item.unitCost),
    formatPKR(item.total)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Article Code', 'Description / Model', 'Category', 'Quantity', 'Unit Cost', 'Total (PKR)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { font: 'courier', fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 26 },
      2: { cellWidth: 55 },
      3: { cellWidth: 22 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
      5: { halign: 'right', font: 'courier', cellWidth: 23 },
      6: { halign: 'right', font: 'courier', fontStyle: 'bold', cellWidth: 24 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // Financial Breakdown Box (Right Aligned)
  const boxWidth = 90;
  const boxX = 196 - boxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(boxX, currentY, boxWidth, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Subtotal
  doc.text('Items Subtotal:', boxX + 4, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatPKR(invoice.itemsSubtotal), boxX + boxWidth - 4, currentY + 6, { align: 'right' });

  // Freight / Extra
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Freight & Port Clearing:', boxX + 4, currentY + 12);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`+ ${formatPKR(invoice.extraExpenses)}`, boxX + boxWidth - 4, currentY + 12, { align: 'right' });

  // Total Bill
  doc.setDrawColor(226, 232, 240);
  doc.line(boxX + 4, currentY + 15, boxX + boxWidth - 4, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(37, 99, 235);
  doc.text('Total Bill Amount:', boxX + 4, currentY + 20);
  doc.setFont('courier', 'bold');
  doc.text(formatPKR(invoice.totalBill), boxX + boxWidth - 4, currentY + 20, { align: 'right' });

  // Paid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text('Paid Amount:', boxX + 4, currentY + 26);
  doc.setFont('courier', 'bold');
  doc.text(`- ${formatPKR(invoice.paidAmount)}`, boxX + boxWidth - 4, currentY + 26, { align: 'right' });

  // Remaining Balance
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text('Remaining Supplier Due:', boxX + 4, currentY + 32);
  doc.setFont('courier', 'bold');
  doc.text(formatPKR(invoice.remainingAmount), boxX + boxWidth - 4, currentY + 32, { align: 'right' });

  // Draw signatures & footer
  drawFooter(doc, currentY + 45);

  doc.save(`KhanClothes_Invoice_${invoice.invoiceNo}.pdf`);
};

// -------------------------------------------------------------
// 2. CUSTOMER KHATA STATEMENT / LEDGER PDF (Image 1 Authentic Khata)
// -------------------------------------------------------------
export const downloadCustomerKhataPDF = (customer, dispatches = [], payments = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = drawHeader(
    doc,
    'Khata Statement / Ledger',
    `Wholesale Goods Outward & Receivable Ledger`,
    `Shop: ${customer.shopName}`
  );

  // Financial calculations
  const totalBilled = dispatches.reduce((s, d) => s + (Number(d.totalSaleAmount) || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalPieces = dispatches.reduce((s, d) => s + (Number(d.quantity) || 0), 0);
  const recordedBill = Number(customer.totalBill) || 0;
  const openingBalance = Math.max(0, recordedBill - totalBilled);
  const currentNetBalance = Math.max(0, (openingBalance + totalBilled) - totalPaid);

  // Customer Profile Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 25, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Khata Banam: ${customer.shopName} (${customer.id})`, 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Owner / Shopkeeper: ${customer.shopkeeperName}`, 18, currentY + 12);
  doc.text(`City / Branch: ${customer.city}  |  Phone: ${[customer.phone, customer.phone2].filter(Boolean).join(' / ') || 'N/A'}`, 18, currentY + 17);
  doc.text(`Market Address: ${customer.marketAddress || customer.city}`, 18, currentY + 22);

  // Net Balance Display Pill (Right inside banner)
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(122, currentY + 4, 69, 17, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(225, 29, 72);
  doc.setFont('helvetica', 'bold');
  doc.text('REMAINING BAQAYA / DUE BALANCE', 125, currentY + 9);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPKR(currentNetBalance), 125, currentY + 17);

  currentY += 30;

  // 4 Metric Mini-Cards
  const cardW = 43;
  const metrics = [
    { label: 'Sabqa / Opening', val: formatPKR(openingBalance) },
    { label: 'Total Maal Sent', val: `${(Number(customer.totalPiecesReceived) || totalPieces).toLocaleString()} pcs` },
    { label: 'Total Billed (Naam)', val: formatPKR(totalBilled) },
    { label: 'Total Wasool (Jama)', val: formatPKR(totalPaid) }
  ];

  metrics.forEach((m, i) => {
    const x = 14 + (i * (cardW + 3.3));
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardW, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 3, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(m.val, x + 3, currentY + 10);
  });

  currentY += 18;

  // Build unified chronological running ledger events
  const events = [];

  if (openingBalance > 0) {
    events.push({
      date: customer.createdAt ? customer.createdAt.split('T')[0] : 'Opening',
      rawDate: new Date(customer.createdAt || 0).getTime(),
      desc: 'Sabqa Baqaya / Opening Balance',
      debit: openingBalance,
      credit: 0
    });
  }

  dispatches.forEach(d => {
    events.push({
      date: d.date,
      rawDate: new Date(d.date || d.createdAt).getTime(),
      desc: `Bill #${d.challanNo} - ${d.articleNo} (${(d.quantity || 0).toLocaleString()} pcs @ Rs. ${(d.unitSalePrice || 0).toLocaleString()})`,
      debit: Number(d.totalSaleAmount) || 0,
      credit: 0
    });
  });

  payments.forEach(p => {
    events.push({
      date: p.date,
      rawDate: new Date(p.date || p.createdAt).getTime(),
      desc: `Wasooli / Payment Received (MK / ${p.paymentMethod || 'Cash'})${p.notes ? ' - ' + p.notes : ''}`,
      debit: 0,
      credit: Number(p.amount) || 0
    });
  });

  events.sort((a, b) => a.rawDate - b.rawDate);

  let running = 0;
  const ledgerRows = events.map((item, idx) => {
    running = running + item.debit - item.credit;
    return [
      idx + 1,
      item.date,
      item.desc,
      item.debit > 0 ? formatPKR(item.debit) : '—',
      item.credit > 0 ? formatPKR(item.credit) : '—',
      formatPKR(running)
    ];
  });

  // Table Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('RUNNING KHATA LEDGER / STATEMENT', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Description / Details', 'Debit / Billed (+)', 'Credit / Wasool (-)', 'Balance / Baqaya']],
    body: ledgerRows.length ? ledgerRows : [['-', '-', 'No transactions logged yet', '—', '—', 'Rs. 0']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // dark navy slate
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 72 },
      3: { halign: 'right', fontStyle: 'bold', textColor: [109, 40, 217], cellWidth: 26 }, // purple-700
      4: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 26 }, // emerald-600
      5: { halign: 'right', font: 'courier', fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 28 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // Final Summary Box (Right Aligned)
  const boxWidth = 96;
  const boxX = 196 - boxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(boxX, currentY, boxWidth, 28, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Total Billed
  doc.text('Total Billed (Opening + Dispatches):', boxX + 4, currentY + 6);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatPKR(totalBilled + openingBalance), boxX + boxWidth - 4, currentY + 6, { align: 'right' });

  // Total Paid
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Wasooli Received:', boxX + 4, currentY + 12);
  doc.setFont('courier', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`- ${formatPKR(totalPaid)}`, boxX + boxWidth - 4, currentY + 12, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(boxX + 4, currentY + 16, boxX + boxWidth - 4, currentY + 16);

  // Net Baqaya Due
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text('Net Baqaya Remaining:', boxX + 4, currentY + 22);
  doc.setFont('courier', 'bold');
  doc.text(formatPKR(currentNetBalance), boxX + boxWidth - 4, currentY + 22, { align: 'right' });

  // Signature Blocks
  const sigY = Math.max(currentY + 40, doc.lastAutoTable.finalY + 42);
  drawFooter(doc, sigY);

  doc.save(`KhanClothes_Khata_${customer.shopName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};

// -------------------------------------------------------------
// 3. CHINA SUPPLIER / VENDOR STATEMENT PDF
// -------------------------------------------------------------
export const downloadSupplierStatementPDF = (supplier = {}, purchasesList = [], paymentList = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const companyName = supplier.company || supplier.name || 'China Factory';
  const supCode = supplier.id || 'SUP-001';

  let currentY = drawHeader(
    doc,
    'CHINA SUPPLIER KHATA STATEMENT',
    `Consignments & Wire Remittances | ${printDate}`,
    companyName
  );

  // Exact figures directly matching Supplier Khata Modal
  const totalPurchasesVal = Math.round(Number(supplier.totalPurchases !== undefined ? supplier.totalPurchases : purchasesList.reduce((s, p) => s + (Number(p.totalBill) || 0), 0)));
  const totalPaidVal = Math.round(Number(supplier.totalPayments !== undefined ? supplier.totalPayments : paymentList.reduce((s, p) => s + (Number(p.amount) || 0), 0)));
  const totalRemainingVal = Math.round(Number(supplier.remainingBalance !== undefined ? supplier.remainingBalance : 0));

  // 1. Supplier Profile Banner (Clean single line without overlapping pill)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 17, 2, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${companyName}  (${supCode})`, 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Representative: ${supplier.name || 'N/A'}  |  Phone: ${supplier.phone || 'N/A'}  |  Address: ${supplier.address || 'China'}`, 18, currentY + 12);

  // Status badge on top right of banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  if (totalRemainingVal > 0) {
    doc.setTextColor(225, 29, 72);
    doc.text('ACCOUNT STATUS: OUTSTANDING DUE', 192, currentY + 9, { align: 'right' });
  } else {
    doc.setTextColor(16, 185, 129);
    doc.text('ACCOUNT STATUS: SETTLED / CLEAR', 192, currentY + 9, { align: 'right' });
  }

  currentY += 21;

  // 2. Exact 3 KPI Summary Cards matching ERP Modal (TOTAL PURCHASES | TOTAL PAID | OUTSTANDING BAQAYA)
  const cardW = 58; // 58 * 3 + 4 * 2 = 182mm
  const cardH = 20;

  // Card 1: TOTAL PURCHASES
  const x1 = 14;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x1, currentY, cardW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PURCHASES', x1 + 4, currentY + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${totalPurchasesVal.toLocaleString()}`, x1 + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${purchasesList.length} Consignment Invoices`, x1 + 4, currentY + 16.5);

  // Card 2: TOTAL PAID (TT / BANK)
  const x2 = x1 + cardW + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x2, currentY, cardW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PAID (TT / BANK)', x2 + 4, currentY + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`Rs. ${totalPaidVal.toLocaleString()}`, x2 + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${paymentList.length} Wire Transfers Recorded`, x2 + 4, currentY + 16.5);

  // Card 3: OUTSTANDING BAQAYA DUE
  const x3 = x2 + cardW + 4;
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(x3, currentY, cardW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text('OUTSTANDING BAQAYA DUE', x3 + 4, currentY + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(`Rs. ${totalRemainingVal.toLocaleString()}`, x3 + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(225, 29, 72);
  doc.text('Net Payable Accounts', x3 + 4, currentY + 16.5);

  currentY += cardH + 7;

  // 3. Chronological Khata Ledger Statement Table (Exact match to Ledger Statement tab)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('LEDGER STATEMENT', 14, currentY);
  currentY += 3;

  const events = [];

  // Opening balance row if > 0
  if (Number(supplier.openingBalance) > 0) {
    events.push({
      date: 'Opening',
      rawDate: 0,
      ref: '—',
      desc: 'Initial balance brought forward',
      debit: 0,
      credit: 0,
      runningBalance: Number(supplier.openingBalance)
    });
  }

  // Combine purchases and payments sorted chronologically
  const rawTx = [
    ...purchasesList.map(p => ({
      date: p.purchaseDate || 'N/A',
      rawDate: new Date(p.purchaseDate || 0).getTime(),
      ref: `Invoice #${p.invoiceNo || 'N/A'}`,
      desc: `Container Import (${(p.items || []).map(i => `${i.articleNo} x${i.quantity}`).join(', ') || 'Consignment Cargo'})`,
      debit: Number(p.totalBill || 0),
      credit: 0
    })),
    ...paymentList.map(pay => ({
      date: pay.date || 'N/A',
      rawDate: new Date(pay.date || 0).getTime(),
      ref: `Payment (${pay.paymentMethod || 'TT'})`,
      desc: `Ref: ${pay.refNo || 'N/A'}${pay.notes ? ' - ' + pay.notes : ' - Settlement'}`,
      debit: 0,
      credit: Number(pay.amount || 0)
    }))
  ].sort((a, b) => a.rawDate - b.rawDate);

  let currentRun = Number(supplier.openingBalance || 0);
  rawTx.forEach(tx => {
    currentRun = currentRun + tx.debit - tx.credit;
    events.push({
      ...tx,
      runningBalance: currentRun
    });
  });

  const ledgerRows = events.map((item, idx) => [
    idx + 1,
    item.date,
    item.ref,
    item.desc,
    item.debit > 0 ? formatPKR(item.debit) : '—',
    item.credit > 0 ? formatPKR(item.credit) : '—',
    formatPKR(item.runningBalance)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Ref #', 'Particulars / Description', 'Debit / Bill', 'Credit / Paid', 'Running Balance']],
    body: ledgerRows.length > 0 ? ledgerRows : [['-', '-', '-', 'No transactions recorded', 'Rs. 0', 'Rs. 0', 'Rs. 0']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      minCellHeight: 7.5,
      lineColor: [30, 41, 59],
      lineWidth: 0.2
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle'
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { font: 'courier', fontStyle: 'bold', cellWidth: 28 },
      3: { cellWidth: 50 },
      4: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
      5: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: [16, 185, 129] },
      6: { halign: 'right', cellWidth: 26, fontStyle: 'bold', textColor: [225, 29, 72] }
    },
    foot: [[
      {
        content: 'TOTAL SUMMARY:',
        colSpan: 4,
        styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 8.5 }
      },
      {
        content: formatPKR(totalPurchasesVal),
        styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 8.5 }
      },
      {
        content: formatPKR(totalPaidVal),
        styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 8.5 }
      },
      {
        content: formatPKR(totalRemainingVal),
        styles: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], fontSize: 8.5 }
      }
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      minCellHeight: 8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 4. Purchases History (if purchasesList > 0)
  if (purchasesList.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('PURCHASES HISTORY', 14, currentY);
    currentY += 3;

    const purRows = purchasesList.map((p, i) => [
      i + 1,
      p.invoiceNo || 'N/A',
      p.purchaseDate || 'N/A',
      p.containerNo || 'N/A',
      `${(p.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0).toLocaleString()} pcs`,
      formatPKR(p.totalBill),
      formatPKR(p.paidAmount),
      formatPKR(p.remainingAmount)
    ]);

    const inwardPaidTotal = purchasesList.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
    const inwardDueTotal = purchasesList.reduce((s, p) => s + (Number(p.remainingAmount) || 0), 0);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Invoice #', 'Date', 'Container', 'Total Pcs', 'Total Bill', 'Paid', 'Balance Due']],
      body: purRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 7.5, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.15 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { font: 'courier', fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 24 },
        2: { halign: 'center', cellWidth: 20 },
        3: { font: 'courier', cellWidth: 24 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
        6: { halign: 'right', cellWidth: 28, textColor: [16, 185, 129] },
        7: { halign: 'right', cellWidth: 30, fontStyle: 'bold', textColor: [225, 29, 72] }
      },
      foot: [[
        {
          content: 'TOTAL PURCHASES BILL:',
          colSpan: 5,
          styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 }
        },
        {
          content: formatPKR(totalPurchasesVal),
          styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 }
        },
        {
          content: formatPKR(inwardPaidTotal),
          styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 8 }
        },
        {
          content: formatPKR(inwardDueTotal),
          styles: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], fontSize: 8 }
        }
      ]],
      footStyles: { fillColor: [241, 245, 249], minCellHeight: 7.5, lineColor: [203, 213, 225], lineWidth: 0.2 }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // 5. Payments History (if paymentList > 0)
  if (paymentList.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('PAYMENTS HISTORY', 14, currentY);
    currentY += 3;

    const payRows = paymentList.map((p, i) => [
      i + 1,
      p.date || 'N/A',
      p.refNo || 'N/A',
      p.paymentMethod || 'Bank TT',
      p.notes || 'Payment transfer',
      formatPKR(p.amount)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Date', 'TT / Ref #', 'Payment Method', 'Notes', 'Amount (PKR)']],
      body: payRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], fontSize: 7.5, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.15 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 24 },
        2: { font: 'courier', fontStyle: 'bold', cellWidth: 32 },
        3: { cellWidth: 40 },
        4: { cellWidth: 44 },
        5: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [16, 185, 129] }
      },
      foot: [[
        {
          content: 'TOTAL PAYMENTS PAID:',
          colSpan: 5,
          styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 }
        },
        {
          content: formatPKR(totalPaidVal),
          styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 8 }
        }
      ]],
      footStyles: { fillColor: [241, 245, 249], minCellHeight: 7.5, lineColor: [203, 213, 225], lineWidth: 0.2 }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // Draw Footer & Signatures
  const finalY = (doc.lastAutoTable?.finalY || currentY) + 6;
  drawFooter(doc, finalY);

  // Multi-page page numbers
  const totalPages = doc.internal.getNumberOfPages();
  if (totalPages > 1) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${p} of ${totalPages}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 4, { align: 'right' });
    }
  }

  const cleanName = (supplier.company || supplier.name || 'Supplier').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`KhanClothes_Supplier_${cleanName}_Khata_${printDate.replace(/\s+/g, '_')}.pdf`);
};

// -------------------------------------------------------------
// 4. ARTICLE STOCK REGISTER & LEDGER PDF
// -------------------------------------------------------------
export const downloadArticleStockPDF = (article, purchases = [], outward = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = drawHeader(
    doc,
    'Article Stock Register & Movement Ledger',
    `Garment Code: ${article.articleNo} | ${article.category}`,
    article.articleNo
  );

  // Article Info Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text(`${article.articleNo} — ${article.name}`, 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Category: ${article.category}  |  Fabric / Stuff: ${article.stuff || 'Standard'}  |  Location: ${article.warehouseLocation || 'Main Godown - Hall A'}`, 18, currentY + 12);
  doc.text(`Unit Cost: ${formatPKR(article.unitCost)}  |  Min Stock Alert: ${article.minAlertStock || 150} pcs`, 18, currentY + 17);
  doc.text(`Description: ${article.description || 'Imported China outerwear item'}`, 18, currentY + 22);

  currentY += 30;

  // 3 Highlight KPI Cards
  const cardW = 58;
  const kpis = [
    { label: 'TOTAL PURCHASED (IN)', val: `${(article.totalPurchased || 0).toLocaleString()} pcs`, col: [37, 99, 235] },
    { label: 'TOTAL DISPATCHED (OUT)', val: `${(article.totalOut || 0).toLocaleString()} pcs`, col: [225, 29, 72] },
    { label: 'CURRENT WAREHOUSE STOCK', val: `${(article.currentStock || 0).toLocaleString()} pcs`, col: [16, 185, 129] }
  ];

  kpis.forEach((k, i) => {
    const x = 14 + (i * (cardW + 4));
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardW, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...k.col);
    doc.text(k.label, x + 4, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(k.val, x + 4, currentY + 12);
  });

  currentY += 22;

  // Inward History
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('CHINA INWARD SHIPMENTS FOR THIS ARTICLE', 14, currentY);
  currentY += 3;

  const purItems = purchases.map((p, i) => [
    i + 1,
    p.purchaseDate,
    p.invoiceNo,
    p.supplierName,
    p.containerNo || 'N/A',
    `${(p.quantity || 0).toLocaleString()} pcs`,
    formatPKR(p.unitCost)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Invoice #', 'Supplier', 'Container', 'Qty In', 'Unit Cost']],
    body: purItems.length ? purItems : [['-', '-', '-', 'No imports recorded for this item', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // Outward History
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('OUTWARD WHOLESALE DISPATCHES FOR THIS ARTICLE', 14, currentY);
  currentY += 3;

  const outItems = outward.map((o, i) => [
    i + 1,
    o.date,
    o.challanNo,
    o.customerName,
    o.destination,
    `${(o.quantity || 0).toLocaleString()} pcs`,
    formatPKR(o.unitSalePrice)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Challan #', 'Customer Shop', 'Destination', 'Qty Out', 'Sale Rate']],
    body: outItems.length ? outItems : [['-', '-', '-', 'No dispatches recorded yet', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 }
  });

  drawFooter(doc, doc.lastAutoTable.finalY + 15);

  doc.save(`KhanClothes_Article_${article.articleNo}.pdf`);
};

// -------------------------------------------------------------
// 5. WAREHOUSE MASTER INVENTORY & CLOSING REPORT PDF
// -------------------------------------------------------------
export const downloadWarehouseReportPDF = (articles = [], totalVal = 0) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = drawHeader(
    doc,
    'Warehouse Stock & Valuation Master Report',
    'Comprehensive Central Warehouse Inventory Audit',
    'Full Inventory Audit'
  );

  const totalStockPcs = articles.reduce((s, a) => s + (Number(a.currentStock) || 0), 0);
  const totalPurchasedPcs = articles.reduce((s, a) => s + (Number(a.totalPurchased) || 0), 0);
  const totalOutPcs = articles.reduce((s, a) => s + (Number(a.totalOut) || 0), 0);

  // Summary row
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 16, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Active Articles: ${articles.length}`, 18, currentY + 6);
  doc.text(`Total Inward: ${totalPurchasedPcs.toLocaleString()} pcs`, 18, currentY + 11);

  doc.text(`Total Dispatched: ${totalOutPcs.toLocaleString()} pcs`, 80, currentY + 6);
  doc.text(`Current Stock: ${totalStockPcs.toLocaleString()} pcs`, 80, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Stock Valuation:', 140, currentY + 6);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(formatPKR(totalVal), 140, currentY + 12);

  currentY += 22;

  // Master Table
  const rows = articles.map((a, i) => [
    i + 1,
    a.articleNo,
    a.name,
    a.category,
    a.stuff || 'Standard',
    `${(a.totalPurchased || 0).toLocaleString()} pcs`,
    `${(a.totalOut || 0).toLocaleString()} pcs`,
    `${(a.currentStock || 0).toLocaleString()} pcs`,
    formatPKR(a.unitCost),
    formatPKR((a.currentStock || 0) * (a.unitCost || 0))
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Code', 'Description', 'Category', 'Stuff', 'Purchased', 'Outward', 'Stock', 'Unit Cost', 'Total Value']],
    body: rows.length ? rows : [['-', '-', 'No articles registered in inventory', '-', '-', '0 pcs', '0 pcs', '0 pcs', 'Rs. 0', 'Rs. 0']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 7, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { font: 'courier', fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 16 },
      2: { cellWidth: 38 },
      3: { cellWidth: 16 },
      4: { cellWidth: 22 },
      5: { halign: 'right', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 16 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 16 },
      8: { halign: 'right', cellWidth: 17 },
      9: { halign: 'right', fontStyle: 'bold', cellWidth: 18 }
    }
  });

  const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : currentY + 30;
  drawFooter(doc, finalY + 15);

  doc.save(`KhanClothes_Master_Inventory_${new Date().toISOString().split('T')[0]}.pdf`);
};

// -------------------------------------------------------------
// 6. OUTWARD DISPATCH LOG PDF
// -------------------------------------------------------------
export const downloadOutwardLogPDF = (outwardList = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = drawHeader(
    doc,
    'Warehouse Outward & Dispatch Register',
    'Wholesale Distribution, Bilty & Gate Pass Dispatches',
    'Dispatches Log'
  );

  const totalPieces = outwardList.reduce((s, o) => s + (Number(o.quantity) || 0), 0);
  const totalVal = outwardList.reduce((s, o) => s + (Number(o.totalSaleAmount) || 0), 0);

  // Summary row
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 16, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Total Dispatches: ${outwardList.length} Challans`, 18, currentY + 6);
  doc.text(`Total Pieces Dispatched: ${totalPieces.toLocaleString()} pcs`, 18, currentY + 11);

  doc.text(`Recorded Period: All Dispatches to Date`, 80, currentY + 6);
  doc.text(`Central Warehouse Gate Pass: Verified`, 80, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text('Total Wholesale Value:', 140, currentY + 6);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(formatPKR(totalVal), 140, currentY + 12);

  currentY += 22;

  // Table
  const rows = outwardList.map((o, i) => [
    i + 1,
    o.date,
    o.challanNo,
    o.articleNo,
    o.articleName || 'Garment',
    o.isWithoutStock ? 'Stock Unchanged' : `-${(o.quantity || 0).toLocaleString()} pcs`,
    `${o.customerName || 'Direct'} (${o.destination || 'Counter'})`,
    formatPKR(o.unitSalePrice),
    formatPKR(o.totalSaleAmount)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Challan', 'Article', 'Description', 'Qty Out', 'Customer / City', 'Unit Rate', 'Total Sale']],
    body: rows.length ? rows : [['-', '-', '-', '-', 'No outward dispatches recorded', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], fontSize: 7, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { cellWidth: 16 },
      2: { font: 'courier', fontStyle: 'bold', cellWidth: 18 },
      3: { font: 'courier', fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 16 },
      4: { cellWidth: 32 },
      5: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], cellWidth: 18 },
      6: { cellWidth: 35 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', fontStyle: 'bold', cellWidth: 22 }
    }
  });

  const finalOutwardY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : currentY + 30;
  drawFooter(doc, finalOutwardY + 15);

  doc.save(`KhanClothes_Outward_Dispatches_${new Date().toISOString().split('T')[0]}.pdf`);
};

// -------------------------------------------------------------
// 7. COMPREHENSIVE BUSINESS REPORT & FINANCIAL LEDGER SUMMARY PDF
// -------------------------------------------------------------
export const downloadBusinessReportsPDF = ({
  dateRangeType = 'ALL',
  startDate = '',
  endDate = '',
  articles = [],
  suppliers = [],
  totalStockWarehouse = 0,
  totalStockValue = 0,
  periodInwardQty = 0,
  periodOutwardQty = 0,
  periodPurchaseAmount = 0,
  periodPaidAmount = 0,
  totalSuppliersOutstanding = 0,
  filteredPurchases = [],
  filteredOutward = []
} = {}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const todayStr = new Date().toLocaleDateString('en-GB');

  const periodLabelMap = {
    ALL: 'All Time Consignment & Stock History',
    TODAY: `Today's Operations (${todayStr})`,
    WEEK: 'Last 7 Days Operating Report',
    MONTH: 'This Month (30-Day Period)',
    CUSTOM: `Custom Period: ${startDate || 'Start'} to ${endDate || 'End'}`
  };

  const periodLabel = periodLabelMap[dateRangeType] || 'All Time Summary';

  let currentY = drawHeader(
    doc,
    'Business Reports & Financial Ledger Statement',
    `Audit Period: ${periodLabel}`,
    `AUD-${Date.now().toString().slice(-5)}`
  );

  // 1. Executive KPI Summary Box (2x4 grid style)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Col 1
  doc.text('Current Warehouse Stock:', 18, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${(totalStockWarehouse || 0).toLocaleString()} pcs`, 18, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Stock Valuation (Cost):', 18, currentY + 22);
  doc.setFont('courier', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(formatPKR(totalStockValue), 18, currentY + 28);

  // Col 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Period Inward (China):', 65, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`+${(periodInwardQty || 0).toLocaleString()} pcs`, 65, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Period Purchases Bill:', 65, currentY + 22);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatPKR(periodPurchaseAmount), 65, currentY + 28);

  // Col 3
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Period Outward Dispatches:', 112, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text(`-${(periodOutwardQty || 0).toLocaleString()} pcs`, 112, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Payments Paid to Vendors:', 112, currentY + 22);
  doc.setFont('courier', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(formatPKR(periodPaidAmount), 112, currentY + 28);

  // Col 4
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Dispatches / Shipments:', 155, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${(filteredOutward || []).length} / ${(filteredPurchases || []).length}`, 155, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Vendor Payables:', 155, currentY + 22);
  doc.setFont('courier', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(formatPKR(totalSuppliersOutstanding), 155, currentY + 28);

  currentY += 42;

  // 2. Category Stock Summary Table
  const categoriesList = ['Jacket', 'Jersey', 'T-Shirt', 'Trouser', 'Hoodie', 'Tracksuit', 'Windbreaker'];
  const catRows = categoriesList.map(cat => {
    const catArts = (articles || []).filter(a => a.category === cat);
    const catPcs = catArts.reduce((s, a) => s + (Number(a.currentStock) || 0), 0);
    const catVal = catArts.reduce((s, a) => s + ((Number(a.currentStock) || 0) * (Number(a.unitCost) || 0)), 0);
    return [cat, `${catArts.length} Models`, `${catPcs.toLocaleString()} pcs`, formatPKR(catVal)];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Category Breakdown', 'Article Models', 'Stock in Godam', 'Category Valuation']],
    body: catRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 40 },
      2: { halign: 'right', fontStyle: 'bold', cellWidth: 45 },
      3: { halign: 'right', font: 'courier', cellWidth: 52 }
    }
  });

  currentY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 8 : currentY + 45;

  // 3. Articles Inventory Master Table
  const articleRows = (articles || []).map((a, i) => [
    i + 1,
    a.articleNo,
    a.name || 'Garment',
    a.category || 'Standard',
    a.stuff || 'Standard',
    a.warehouseLocation || 'Hall A',
    `${(a.totalPurchased || 0).toLocaleString()} pcs`,
    `${(a.totalOut || 0).toLocaleString()} pcs`,
    `${(a.currentStock || 0).toLocaleString()} pcs`,
    formatPKR(a.unitCost),
    formatPKR((a.currentStock || 0) * (a.unitCost || 0))
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Code', 'Description', 'Category', 'Stuff', 'Location', 'Purchased', 'Outward', 'Stock', 'Unit Cost', 'Valuation']],
    body: articleRows.length ? articleRows : [['-', '-', 'No articles in inventory yet', '-', '-', '-', '0 pcs', '0 pcs', '0 pcs', 'Rs. 0', 'Rs. 0']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 6.5, fontStyle: 'bold' },
    styles: { fontSize: 6.5, cellPadding: 1.8 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 6 },
      1: { font: 'courier', fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 15 },
      2: { cellWidth: 32 },
      3: { cellWidth: 14 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { halign: 'right', cellWidth: 15 },
      7: { halign: 'right', cellWidth: 15 },
      8: { halign: 'right', fontStyle: 'bold', cellWidth: 15 },
      9: { halign: 'right', cellWidth: 16 },
      10: { halign: 'right', fontStyle: 'bold', cellWidth: 18 }
    }
  });

  const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : currentY + 30;
  drawFooter(doc, finalY + 15);

  const cleanPeriod = (dateRangeType || 'all').toLowerCase();
  doc.save(`KhanClothes_Business_Report_${cleanPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Download Professional Market Recovery / Ugrahi Sheet PDF
 * Used by recovery agents for wholesale shop collections & field khata verification
 */
export const downloadUgrahiSheetPDF = (sheetData = {}) => {
  const {
    sheetTitle = 'Payment Collection Register (Ugrahi Sheet)',
    sheetDate = new Date().toISOString().split('T')[0],
    recoveryAgent = 'Field Recovery Officer',
    targetRoute = 'All Wholesale Markets',
    rows = []
  } = sheetData;

  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Format Date Safely
  const formattedDate = (() => {
    try {
      if (!sheetDate) return new Date().toLocaleDateString('en-GB');
      const d = new Date(sheetDate);
      if (isNaN(d.getTime())) return String(sheetDate);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return String(sheetDate || new Date().toLocaleDateString('en-GB'));
    }
  })();

  const agentName = recoveryAgent && recoveryAgent !== 'N/A' ? recoveryAgent : 'Admin Khan';
  const routeName = targetRoute && targetRoute !== 'N/A' ? targetRoute : 'All Wholesale Markets';

  const totalDues = rows.reduce((s, r) => s + (Number(r.totalDue) || 0), 0);
  const totalWasool = rows.reduce((s, r) => s + (Number(r.wasool) || 0), 0);

  // Page 1 Header
  drawHeader(
    doc,
    sheetTitle.toUpperCase(),
    `Route: ${routeName} | Collector: ${agentName}`,
    'Collection Register'
  );

  // Executive KPI Summary Box (2x2 balanced grid on first page with prominent text)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 47, 182, 18, 2, 2, 'FD');

  // Col 1: Total Accounts & Date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Customers:', 17, 53.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(`${rows.length} Shops`, 37, 53.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Date:', 17, 60);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(formattedDate, 37, 60);

  // Col 2: Collector & Route
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Officer:', 74, 53.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(agentName, 90, 53.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Route:', 74, 60);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(routeName, 90, 60);

  // Col 3: Financial Totals (Prominent & High Contrast)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Outstanding:', 135, 53.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(formatPKR(totalDues), 193, 53.5, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Wasooli:', 135, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(formatPKR(totalWasool), 193, 60, { align: 'right' });

  // Map all rows cleanly (stripping any stray [area] brackets)
  const tableRows = rows.map((r, rIdx) => {
    let displayName = (r.name || '—').trim();
    displayName = displayName.replace(/\s*\[[^\]]+\]\s*$/, '').trim() || '—';
    return [
      rIdx + 1,
      displayName,
      formatPKR(r.totalDue),
      r.wasool ? formatPKR(r.wasool) : ''
    ];
  });

  autoTable(doc, {
    startY: 69,
    margin: { top: 46, bottom: 20, left: 14, right: 14 },
    head: [['#', 'Customer / Shop Name', 'Total Balance (PKR)', 'Collected Wasooli (PKR)']],
    body: tableRows.length ? tableRows : [['-', 'No customer entries in sheet', 'Rs. 0', '']],
    theme: 'grid',
    headStyles: { 
      fillColor: [15, 23, 42], 
      textColor: [255, 255, 255], 
      fontSize: 10, 
      fontStyle: 'bold', 
      halign: 'center',
      minCellHeight: 8.5,
      cellPadding: 2.6
    },
    styles: { 
      fontSize: 10, 
      cellPadding: 2.4,
      minCellHeight: 7.8,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
      1: { fontStyle: 'bold' },
      2: { halign: 'center', fontStyle: 'bold', textColor: [225, 29, 72], cellWidth: 35 },
      3: { halign: 'center', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 32 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    foot: [[
      {
        content: `TOTAL (${rows.length} SHOPS):`,
        colSpan: 2,
        styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 10 }
      },
      {
        content: formatPKR(totalDues),
        styles: { halign: 'center', fontStyle: 'bold', textColor: [225, 29, 72], fontSize: 10 }
      },
      {
        content: formatPKR(totalWasool),
        styles: { halign: 'center', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 10 }
      }
    ]],
    footStyles: { 
      fillColor: [241, 245, 249], 
      minCellHeight: 8.5,
      cellPadding: 2.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    showFoot: 'lastPage',
    didDrawPage: (data) => {
      // Continuation Page Header on subsequent pages
      if (data.pageNumber > 1) {
        drawHeader(
          doc,
          sheetTitle.toUpperCase(),
          `Route: ${routeName} | Collector: ${agentName} (Page ${data.pageNumber})`,
          'Collection Register'
        );
      }
    }
  });

  // Footer / Signatures Block on last page
  const pageHeight = doc.internal.pageSize.getHeight();
  const finalY = doc.lastAutoTable.finalY || 100;
  if (finalY > pageHeight - 36) {
    doc.addPage();
    drawHeader(
      doc,
      sheetTitle.toUpperCase(),
      `Route: ${routeName} | Collector: ${agentName} (Verification & Signatures)`,
      'Collection Register'
    );
    drawFooter(doc, 48);
  } else {
    drawFooter(doc, finalY);
  }

  // Page numbering stamp on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${p} of ${totalPages}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 4, { align: 'right' });
  }

  const cleanName = (sheetTitle || 'Collection_Sheet').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${cleanName}_${sheetDate}.pdf`);
};

/**
 * Professional China Suppliers & Accounts Master PDF Register
 * Chunks 20 vendors per page for clean full-page printing
 */
export const downloadSuppliersListPDF = (suppliersList = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const totalVendors = suppliersList.length;
  const totalPurchases = suppliersList.reduce((sum, s) => sum + (Number(s.totalPurchases) || 0), 0);
  const totalPaid = suppliersList.reduce((sum, s) => sum + (Number(s.totalPayments) || 0), 0);
  const totalDue = suppliersList.reduce((sum, s) => sum + (Number(s.remainingBalance) || 0), 0);
  const dueCount = suppliersList.filter(s => (Number(s.remainingBalance) || 0) > 0).length;
  const settledCount = suppliersList.filter(s => (Number(s.remainingBalance) || 0) <= 0).length;

  // Exact 20-Records per page chunking
  const CHUNK_SIZE = 20;
  const chunks = [];
  for (let i = 0; i < suppliersList.length; i += CHUNK_SIZE) {
    chunks.push(suppliersList.slice(i, i + CHUNK_SIZE));
  }
  if (chunks.length === 0) {
    chunks.push([]);
  }

  chunks.forEach((chunk, chunkIdx) => {
    if (chunkIdx > 0) {
      doc.addPage();
    }

    let startY = 47;

    if (chunkIdx === 0) {
      // First page header with full company branding
      drawHeader(
        doc,
        'CHINA SUPPLIERS & VENDORS REGISTER',
        `Consignments, Factory Accounts & Net Payables Audit | Audit Date: ${printDate}`,
        'Vendors Ledger'
      );

      // Executive KPI Summary Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 47, 182, 18, 2, 2, 'FD');

      // Col 1: Vendor Counts
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Total Suppliers:', 18, 53.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.text(`${totalVendors} Registered Factories`, 46, 53.5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Active Balances:', 18, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(225, 29, 72);
      doc.text(`${dueCount} Due`, 46, 60);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`(${settledCount} Settled)`, 60, 60);

      // Col 2: Purchases & Paid
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Total Purchases:', 88, 53.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.text(formatPKR(totalPurchases), 116, 53.5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Total Paid (TT):', 88, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(16, 185, 129);
      doc.text(formatPKR(totalPaid), 116, 60);

      // Col 3: Net Outstanding Payables
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Net Payables (Baqaya):', 145, 53.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(225, 29, 72);
      doc.text(formatPKR(totalDue), 145, 60.5);

      startY = 70;
    } else {
      // Continuation page header
      drawHeader(
        doc,
        'CHINA SUPPLIERS & VENDORS REGISTER',
        `Continuation Sheet - Page ${chunkIdx + 1} of ${chunks.length}`,
        'Vendors Ledger'
      );
      startY = 47;
    }

    // Build Rows
    const rows = chunk.map((s, idx) => {
      const globalIdx = chunkIdx * CHUNK_SIZE + idx + 1;
      const code = s.id || `SUP-${String(globalIdx).padStart(3, '0')}`;
      const company = s.company || 'Unknown Factory';
      const contact = s.name ? `Contact: ${s.name}` : '';
      const compDesc = contact ? `${company}\n${contact}` : company;

      const phone = s.phone || '-';
      const address = s.address || '-';
      const contactInfo = `${phone}\n${address}`;

      const pur = formatPKR(s.totalPurchases || 0);
      const paid = formatPKR(s.totalPayments || 0);
      const bal = formatPKR(s.remainingBalance || 0);
      const isDue = (Number(s.remainingBalance) || 0) > 0;
      const status = isDue ? 'Due' : 'Clear';

      return [globalIdx, code, compDesc, contactInfo, pur, paid, bal, status];
    });

    const isLastChunk = chunkIdx === chunks.length - 1;

    autoTable(doc, {
      startY,
      head: [['#', 'Code', 'Company & Contact Person', 'Phone & Address / Location', 'Purchases', 'Paid (TT)', 'Baqaya Due', 'Status']],
      body: rows.length > 0 ? rows : [['-', '-', 'No suppliers recorded', '-', 'Rs. 0', 'Rs. 0', 'Rs. 0', 'Clear']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left',
        minCellHeight: 8,
        lineColor: [30, 41, 59],
        lineWidth: 0.2
      },
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 18, font: 'courier', fontStyle: 'bold', textColor: [37, 99, 235] },
        2: { cellWidth: 42, fontStyle: 'bold' },
        3: { cellWidth: 40, textColor: [71, 85, 105] },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 20, fontStyle: 'bold', textColor: [16, 185, 129] },
        6: { halign: 'right', cellWidth: 20, fontStyle: 'bold', textColor: [225, 29, 72] },
        7: { halign: 'center', cellWidth: 12, fontStyle: 'bold' }
      },
      foot: isLastChunk ? [[
        {
          content: `TOTAL (${suppliersList.length} VENDORS):`,
          colSpan: 4,
          styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 9 }
        },
        {
          content: formatPKR(totalPurchases),
          styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 9 }
        },
        {
          content: formatPKR(totalPaid),
          styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 9 }
        },
        {
          content: formatPKR(totalDue),
          styles: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], fontSize: 9 }
        },
        {
          content: dueCount > 0 ? `${dueCount} Due` : 'Clear',
          styles: { halign: 'center', fontStyle: 'bold', textColor: dueCount > 0 ? [225, 29, 72] : [16, 185, 129], fontSize: 8 }
        }
      ]] : undefined,
      footStyles: {
        fillColor: [241, 245, 249],
        minCellHeight: 8.5,
        lineColor: [203, 213, 225],
        lineWidth: 0.2
      },
      pageBreak: 'avoid'
    });

    if (isLastChunk) {
      const finalY = doc.lastAutoTable.finalY || startY + 50;
      drawFooter(doc, finalY);
    }
  });

  // Page numbering stamp if multi-page document
  const totalPages = doc.internal.getNumberOfPages();
  if (totalPages > 1) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${p} of ${totalPages}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 4, { align: 'right' });
    }
  }

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`China_Suppliers_Register_${fileDate}.pdf`);
};

/**
 * Professional Wholesale Customers & Shopkeepers Register PDF
 * Lists all shops, shopkeepers, contact, city/route, pieces dispatched, total bill, payments received & outstanding balance
 */
export const downloadCustomersListPDF = (customersList = [], filterInfo = {}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const totalCustomers = customersList.length;
  const totalPieces = customersList.reduce((sum, c) => sum + (Number(c.totalPiecesReceived) || 0), 0);
  const totalBilled = customersList.reduce((sum, c) => sum + (Number(c.totalBill) || 0), 0);
  const totalPaid = customersList.reduce((sum, c) => sum + (Number(c.totalPaid) || 0), 0);
  const totalDue = customersList.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);
  const dueCount = customersList.filter(c => (Number(c.remainingBalance) || 0) > 0).length;
  const settledCount = customersList.filter(c => (Number(c.remainingBalance) || 0) <= 0).length;

  // Header Subtitle info
  let subtitle = `Wholesale Buyers Directory & Khata Register | Audit Date: ${printDate}`;
  if (filterInfo?.label) {
    subtitle = `${filterInfo.label} | Audit Date: ${printDate}`;
  } else if (filterInfo?.city && filterInfo.city !== 'ALL') {
    subtitle = `City: ${filterInfo.city} | ${subtitle}`;
  }

  // Draw Page 1 Brand Header
  drawHeader(
    doc,
    'CUSTOMERS & SHOPKEEPERS REGISTER',
    subtitle,
    'Customers Ledger'
  );

  // Executive KPI Summary Box (2x3 grid, clean, crisp)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, 47, 186, 18, 2, 2, 'FD');

  // Col 1: Customer Counts & Status
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Customers:', 16, 53.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(`${totalCustomers} Registered Shops`, 43, 53.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Active Balances:', 16, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(225, 29, 72);
  doc.text(`${dueCount} Due`, 43, 60);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`(${settledCount} Settled)`, 57, 60);

  // Col 2: Mal Sent & Total Billed
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Total Mal Sent:', 88, 53.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(`${totalPieces.toLocaleString()} Pcs`, 114, 53.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Billed:', 88, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatPKR(totalBilled), 114, 60);

  // Col 3: Wasooli & Net Baqaya
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Wasooli:', 148, 53.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129);
  doc.text(formatPKR(totalPaid), 170, 53.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Net Baqaya Due:', 148, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(225, 29, 72);
  doc.text(formatPKR(totalDue), 170, 60);

  // Format table rows
  const tableRows = customersList.map((c, idx) => {
    const shopName = (c.shopName || 'Unknown Shop').trim();
    const owner = c.shopkeeperName ? `(${c.shopkeeperName.trim()})` : '';
    const nameCell = owner ? `${shopName}\n${owner}` : shopName;

    const phone = [c.phone, c.phone2].filter(Boolean).map(p => p.trim()).join(' / ') || '—';
    const address = c.marketAddress ? c.marketAddress.trim() : '';
    const contactCell = address ? `${phone}\n${address}` : phone;

    const city = c.city || '—';
    const route = c.inUgrahi ? (c.ugrahiRoute ? `Route: ${c.ugrahiRoute}` : 'In Collection') : 'Excluded';
    const cityCell = `${city}\n${route}`;

    const pcs = `${(Number(c.totalPiecesReceived) || 0).toLocaleString()} pcs`;
    const billed = formatPKR(c.totalBill || 0);
    const wasooli = formatPKR(c.totalPaid || 0);
    const balance = formatPKR(c.remainingBalance || 0);
    const isDue = (Number(c.remainingBalance) || 0) > 0;
    const status = isDue ? 'Due' : 'Clear';

    return [
      idx + 1,
      nameCell,
      contactCell,
      cityCell,
      pcs,
      billed,
      wasooli,
      balance,
      status
    ];
  });

  autoTable(doc, {
    startY: 69,
    margin: { top: 46, bottom: 20, left: 12, right: 12 },
    head: [['#', 'Shop / Shopkeeper', 'Phone & Address', 'City / Route', 'Mal Sent', 'Total Bill', 'Wasooli', 'Baqaya Due', 'Status']],
    body: tableRows.length ? tableRows : [['-', 'No customer records available', '-', '-', '0 pcs', 'Rs. 0', 'Rs. 0', 'Rs. 0', 'Clear']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
      minCellHeight: 8,
      lineColor: [30, 41, 59],
      lineWidth: 0.2
    },
    styles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8, fontStyle: 'bold' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 32, textColor: [71, 85, 105] },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 20, fontStyle: 'bold', textColor: [16, 185, 129] },
      7: { halign: 'right', cellWidth: 20, fontStyle: 'bold', textColor: [225, 29, 72] },
      8: { halign: 'center', cellWidth: 12, fontStyle: 'bold' }
    },
    foot: [[
      {
        content: `TOTAL (${customersList.length} SHOPS):`,
        colSpan: 4,
        styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 8.5 }
      },
      {
        content: `${totalPieces.toLocaleString()} pcs`,
        styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 8 }
      },
      {
        content: formatPKR(totalBilled),
        styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 8 }
      },
      {
        content: formatPKR(totalPaid),
        styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 8 }
      },
      {
        content: formatPKR(totalDue),
        styles: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], fontSize: 8 }
      },
      {
        content: dueCount > 0 ? `${dueCount} Due` : 'Clear',
        styles: { halign: 'center', fontStyle: 'bold', textColor: dueCount > 0 ? [225, 29, 72] : [16, 185, 129], fontSize: 7.5 }
      }
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      minCellHeight: 8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    showFoot: 'lastPage',
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader(
          doc,
          'CUSTOMERS & SHOPKEEPERS REGISTER',
          `${subtitle} (Page ${data.pageNumber})`,
          'Customers Ledger'
        );
      }
    }
  });

  // Footer / Signatures Block on last page
  const pageHeight = doc.internal.pageSize.getHeight();
  const finalY = doc.lastAutoTable?.finalY || 100;
  if (finalY > pageHeight - 36) {
    doc.addPage();
    drawHeader(
      doc,
      'CUSTOMERS & SHOPKEEPERS REGISTER',
      'Verification & Audit Signatures',
      'Customers Ledger'
    );
    drawFooter(doc, 48);
  } else {
    drawFooter(doc, finalY);
  }

  // Page numbering stamp on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${p} of ${totalPages}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 4, { align: 'right' });
  }

  const fileCity = (filterInfo?.city && filterInfo.city !== 'ALL' ? filterInfo.city : 'All_Cities').replace(/[^a-zA-Z0-9]/g, '_');
  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`Customers_Register_${fileCity}_${fileDate}.pdf`);
};

// -------------------------------------------------------------
// 10. WHOLESALE OUTWARD DISPATCH BILL (MAAL PARCHA) PDF
// -------------------------------------------------------------
export const formatCleanBillNo = (challanNo) => {
  if (!challanNo) return '';
  const str = String(challanNo).trim();
  const match = str.match(/^(?:CH-)?(?:\d{4}-)?(.+)$/i);
  return match ? match[1] : str;
};

export const downloadDispatchBillPDF = ({
  billNo,
  date,
  customerName,
  customerPhone,
  destination,
  gatePassNo,
  notes,
  items = [],
  totalPieces = 0,
  totalBillAmount = 0,
  paidAmount = 0,
  customerKhataBalance = null
}) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const cleanBill = formatCleanBillNo(billNo) || 'BILL';

    let currentY = drawHeader(
      doc,
      'Wholesale Dispatch Bill (Maal Parcha)',
      'Customer Invoice & Consignment Voucher',
      `Bill #${cleanBill}`
    );

    // 2-Column Metadata Grid (Clean borders, zero bloated background)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, 182, 26, 2, 2, 'FD');

    // Subtle Vertical Divider in Metadata Box
    doc.setDrawColor(241, 245, 249);
    doc.line(105, currentY + 3, 105, currentY + 23);

    // Column 1: Billed To / Customer Details (Left)
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('BILLED TO (DUKAANDAR):', 18, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(customerName || 'Wholesale Customer', 18, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Location: ${destination || 'Wholesale Market, Lahore'}`, 18, currentY + 17.5);

    if (customerPhone) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Phone: ${customerPhone}`, 18, currentY + 22.5);
    }

    // Column 2: Dispatch & Logistics Details (Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('DISPATCH & LOGISTICS:', 110, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(`Bill #${cleanBill}`, 110, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${date || new Date().toISOString().split('T')[0]}`, 110, currentY + 17.5);

    const gpInfo = [
      gatePassNo ? `Gate Pass: ${gatePassNo}` : '',
      notes ? `Transport: ${notes}` : ''
    ].filter(Boolean).join('  |  ') || 'Direct Delivery / Goods Transport';

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(gpInfo.length > 45 ? gpInfo.slice(0, 42) + '...' : gpInfo, 110, currentY + 22.5);

    currentY += 31;

    // Compact Data Table
    const tableData = items.map((item, index) => {
      const isDirect = item.isWithoutStock || item.articleNo === 'DIRECT-SALE';
      const code = isDirect ? 'Direct Bill' : (item.articleNo || '—');
      const desc = isDirect 
        ? (item.articleName || 'Direct Sale (Bina Stock)')
        : (item.articleName || item.category || 'Garment Jacket');
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.unitSalePrice) || 0;
      const total = Number(item.totalSaleAmount) || (qty * rate);

      return [
        index + 1,
        code,
        desc,
        `${qty.toLocaleString()} pcs`,
        formatPKR(rate),
        formatPKR(total)
      ];
    });

    const computedTotalQty = totalPieces || items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const computedTotalAmount = totalBillAmount || items.reduce((s, i) => s + (Number(i.totalSaleAmount) || 0), 0);
    const numPaid = Number(paidAmount) || 0;
    const netDue = Math.max(0, computedTotalAmount - numPaid);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Article Code', 'Description / Stuff', 'Quantity', 'Unit Rate', 'Total Amount (PKR)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [248, 250, 252], // slate-50
        textColor: [15, 23, 42],     // slate-900 high contrast
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
        lineWidth: 0.2,
        lineColor: [226, 232, 240]
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.8,
        textColor: [51, 65, 85],
        lineColor: [241, 245, 249],
        lineWidth: 0.15
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 32, fontStyle: 'bold', textColor: [15, 23, 42] },
        2: { cellWidth: 62 },
        3: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: [15, 23, 42] }
      },
      foot: [[
        { content: 'Bill Subtotal:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `${computedTotalQty.toLocaleString()} pcs`, styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] } },
        { content: '', styles: { halign: 'right' } },
        { content: formatPKR(computedTotalAmount), styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] } }
      ]],
      footStyles: {
        fillColor: [248, 250, 252],
        fontSize: 8.5,
        fontStyle: 'bold',
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      }
    });

    currentY = doc.lastAutoTable.finalY + 6;

    // Structured Right-Aligned Summary Table & Left Remarks
    const summaryWidth = 82;
    const summaryX = pageWidth - 14 - summaryWidth;

    // Left Notes / Policy Block
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(14, currentY, 88, 30, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TERMS & CONSIGNMENT NOTES:', 18, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('• Maal ba-hifazat check kar ke wasool paya.', 18, currentY + 11);
    doc.text('• Billed amount has been recorded in customer khata ledger.', 18, currentY + 16);
    doc.text('• Valid without physical stamp for computerized khata accounts.', 18, currentY + 21);
    doc.text('• Central Warehouse: Shahdra / Lahore • 0334-6582412', 18, currentY + 26);

    // Right Structured Tabular Financial Summary
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(summaryX, currentY, summaryWidth, 30, 1.5, 1.5, 'FD');

    const summaryRows = [
      { label: `Bill Total (${computedTotalQty} pcs):`, val: formatPKR(computedTotalAmount), bold: false, color: [15, 23, 42] },
      { label: 'Wasooli (Payment Received):', val: formatPKR(numPaid), bold: false, color: [16, 185, 129] },
      { label: 'Net Bill Baqaya:', val: formatPKR(netDue), bold: true, color: netDue > 0 ? [225, 29, 72] : [16, 185, 129] },
      { 
        label: 'Total Khata Balance Due:', 
        val: formatPKR(customerKhataBalance != null ? customerKhataBalance : netDue), 
        bold: true, 
        color: [15, 23, 42],
        isFinal: true
      }
    ];

    let rowY = currentY + 5;
    summaryRows.forEach((r, idx) => {
      if (r.isFinal) {
        doc.setFillColor(248, 250, 252);
        doc.rect(summaryX + 0.3, rowY - 3.8, summaryWidth - 0.6, 7.2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(summaryX, rowY - 3.8, summaryX + summaryWidth, rowY - 3.8);
      }

      doc.setFont('helvetica', r.bold ? 'bold' : 'normal');
      doc.setFontSize(r.isFinal ? 8 : 7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(r.label, summaryX + 4, rowY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(r.color[0], r.color[1], r.color[2]);
      doc.text(r.val, summaryX + summaryWidth - 4, rowY, { align: 'right' });

      rowY += 6.5;
    });

    currentY += 36;

    // Signatures Footer
    drawFooter(doc, currentY);

    const safeFile = `Khan_Jacket_Bill_${cleanBill}.pdf`;
    doc.save(safeFile);
    return true;
  } catch (err) {
    console.error('[downloadDispatchBillPDF Error]:', err);
    throw err;
  }
};

// -------------------------------------------------------------
// 12. CONTAINER CUSTOMS DUTY & CLEARANCE VOUCHER PDF
// -------------------------------------------------------------
export const downloadClearancePDF = (clearance = {}) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    const c = clearance;
    const customDuty = Number(c.customDuty) || 0;
    const shippingLine = Number(c.shippingLineCharges) || 0;
    const portPayment = Number(c.portPayment) || 0;
    const clearanceCharges = Number(c.clearanceCharges) || 0;
    const dryPort = Number(c.dryPortExpenses) || 0;
    const service = Number(c.serviceCharges) || 0;
    const agency = Number(c.agencyFee) || 0;
    const inst = Number(c.insCharges) || 0;
    const road = Number(c.roadTransport) || 0;
    const driver = Number(c.driver) || 0;
    const consignee = Number(c.consigneeCharges) || 0;
    const crane = Number(c.craneLabour) || 0;
    const railway = Number(c.railway) || 0;
    const other = Number(c.otherExpenses) || 0;

    const totalPortExpenses = shippingLine + portPayment + clearanceCharges + dryPort + service + agency + inst + road + driver + consignee + crane + railway + other;
    const grandTotal = Number(c.grandTotal) || (customDuty + totalPortExpenses);
    const paidAmount = Number(c.paidAmount) || 0;
    const remainingAmount = Math.max(0, grandTotal - paidAmount);

    let currentY = drawHeader(
      doc,
      'Customs Duty & Clearance Voucher',
      'Port Logistics, Government Tariff & Clearing Agent Breakdown',
      `Inv #${c.invoiceNo || 'N/A'} (Cont: ${c.containerNumber || 'N/A'})`
    );

    // Metadata Info Cards Grid (2 rows of metadata)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(14, currentY, 182, 28, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    // Row 1: Clearing Agent, Party, Consignee, Bill Date
    doc.text('Clearing Agent:', 18, currentY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.clearingAgent || 'BARCA TRADERS', 18, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Party / Owner:', 68, currentY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.party || 'TOOR HAJI', 68, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Consignee:', 118, currentY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.consignee || 'GUL TRADER', 118, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Bill Date:', 160, currentY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.billDate || 'N/A', 160, currentY + 10);

    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(18, currentY + 13.5, 192, currentY + 13.5);

    // Row 2: Container # & Size, GD #, BL #, Port & Weight
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Container # / Size:', 18, currentY + 19);
    doc.setFont('courier', 'bold');
    doc.setTextColor(37, 99, 235); // blue
    doc.text(`${c.containerNumber || 'N/A'} (${c.containerSize || '40 FT'})`, 18, currentY + 24);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('GD # (Goods Decl):', 68, currentY + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.gdNo || '-', 68, currentY + 24);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('BL # (Bill of Lading):', 118, currentY + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.blNumber || '-', 118, currentY + 24);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Port & Weight:', 160, currentY + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${c.port || 'AKDP'} • ${c.weight || '22 MT'}`, 160, currentY + 24);

    currentY += 34;

    // Table of Itemized Port & Customs Expenses
    const chargeRows = [
      { name: 'Custom Duty (FBR / Govt. Tariff)', category: 'Govt. Custom Duty', amount: customDuty },
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
      { name: 'Driver Allowance & Tolls', category: 'Logistics', amount: driver },
      { name: 'Crane Offloading & Heavy Labour', category: 'Labour & Crane', amount: crane },
      { name: 'Other Expenses & Demurrage', category: 'Miscellaneous', amount: other }
    ].filter(i => i.amount > 0);

    const tableData = chargeRows.map((item, index) => [
      index + 1,
      item.name,
      item.category,
      formatPKR(item.amount)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Charge Description / Head', 'Category', 'Amount (PKR)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 95, fontStyle: 'bold' },
        2: { cellWidth: 42, textColor: [100, 116, 139] },
        3: { halign: 'right', font: 'courier', fontStyle: 'bold', cellWidth: 35 }
      }
    });

    currentY = doc.lastAutoTable.finalY + 5;

    // Financial Summary Box (Right Aligned)
    const boxWidth = 92;
    const boxX = 196 - boxWidth;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(boxX, currentY, boxWidth, 38, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    // Custom Duty
    doc.text('Government Custom Duty:', boxX + 4, currentY + 5.5);
    doc.setFont('courier', 'bold');
    doc.setTextColor(126, 34, 206); // purple-700
    doc.text(formatPKR(customDuty), boxX + boxWidth - 4, currentY + 5.5, { align: 'right' });

    // Port Expenses
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Port & Logistics Charges:', boxX + 4, currentY + 11.5);
    doc.setFont('courier', 'bold');
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(formatPKR(totalPortExpenses), boxX + boxWidth - 4, currentY + 11.5, { align: 'right' });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(boxX + 4, currentY + 15, boxX + boxWidth - 4, currentY + 15);

    // Grand Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Total Clearance Landed Bill:', boxX + 4, currentY + 20);
    doc.setFont('courier', 'bold');
    doc.text(formatPKR(grandTotal), boxX + boxWidth - 4, currentY + 20, { align: 'right' });

    // Paid to Agent
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text('Paid to Agent (Adaigi):', boxX + 4, currentY + 26);
    doc.setFont('courier', 'bold');
    doc.text(`- ${formatPKR(paidAmount)}`, boxX + boxWidth - 4, currentY + 26, { align: 'right' });

    // Remaining Baqaya Due
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(remainingAmount > 0 ? 225 : 16, remainingAmount > 0 ? 29 : 185, remainingAmount > 0 ? 72 : 129);
    doc.text('Khata Baqaya Due (Dena Hai):', boxX + 4, currentY + 32);
    doc.setFont('courier', 'bold');
    doc.text(formatPKR(remainingAmount), boxX + boxWidth - 4, currentY + 32, { align: 'right' });

    // If payment history exists, render payments ledger below or on next page
    const payments = Array.isArray(c.payments) ? [...c.payments].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
    if (payments.length > 0) {
      currentY += 44;
      if (currentY + 30 > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Payment Installments Ledger (Adaigi History):', 14, currentY);

      const payTable = payments.map((p, idx) => [
        idx + 1,
        p.date || '-',
        formatPKR(p.amount),
        p.paymentMethod || 'Bank Transfer',
        p.refNo || '-',
        p.notes || '-'
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['#', 'Payment Date', 'Amount (PKR)', 'Payment Mode', 'Reference / Slip #', 'Notes / Remarks']],
        body: payTable,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129], // emerald-600
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [51, 65, 85]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 26 },
          2: { halign: 'right', font: 'courier', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 30 },
          3: { cellWidth: 35 },
          4: { font: 'courier', cellWidth: 35 },
          5: { cellWidth: 46 }
        }
      });

      currentY = doc.lastAutoTable.finalY + 6;
    } else {
      currentY += 44;
    }

    // Draw signatures footer
    drawFooter(doc, currentY);

    const cleanFile = `Clearance_Bill_${c.invoiceNo || 'Voucher'}_${c.containerNumber || 'Cont'}.pdf`;
    doc.save(cleanFile);
    return true;
  } catch (err) {
    console.error('[downloadClearancePDF Error]:', err);
    throw err;
  }
};
