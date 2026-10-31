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
  doc.text(`City / Branch: ${customer.city}  |  Phone: ${customer.phone || 'N/A'}`, 18, currentY + 17);
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
export const downloadSupplierStatementPDF = (supplier, purchasesList = [], paymentList = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = drawHeader(
    doc,
    'China Supplier Account Statement',
    'Import Purchases & Wire Remittances Ledger',
    supplier.company
  );

  // Supplier Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 24, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(supplier.company, 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Representative: ${supplier.name}  |  Phone: ${supplier.phone}`, 18, currentY + 11);
  doc.text(`Factory Address: ${supplier.address}`, 18, currentY + 16);

  // Balance Pill
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(125, currentY + 4, 66, 16, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(225, 29, 72);
  doc.text('TOTAL REMAINING PAYABLE', 128, currentY + 9);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPKR(supplier.remainingBalance), 128, currentY + 16);

  currentY += 30;

  // Purchases Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('CHINA INWARD INVOICES', 14, currentY);
  currentY += 3;

  const purRows = purchasesList.map((p, i) => [
    i + 1,
    p.invoiceNo,
    p.purchaseDate,
    p.containerNo || 'N/A',
    `${(p.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0).toLocaleString()} pcs`,
    formatPKR(p.totalBill),
    formatPKR(p.paidAmount),
    formatPKR(p.remainingAmount)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Invoice #', 'Date', 'Container', 'Total Pcs', 'Total Bill', 'Paid', 'Balance Due']],
    body: purRows.length ? purRows : [['-', '-', '-', '-', '-', 'No invoices logged', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // Payments Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('PAYMENTS & TT WIRE REMITTANCES', 14, currentY);
  currentY += 3;

  const payRows = paymentList.map((p, i) => [
    i + 1,
    p.date,
    p.refNo,
    p.paymentMethod,
    p.notes || 'Payment transfer',
    formatPKR(p.amount)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'TT / Ref #', 'Payment Method', 'Notes', 'Amount (PKR)']],
    body: payRows.length ? payRows : [['-', '-', '-', '-', 'No remittance history', '-']],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 }
  });

  drawFooter(doc, doc.lastAutoTable.finalY + 15);

  doc.save(`KhanClothes_Supplier_${supplier.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
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
    `-${(o.quantity || 0).toLocaleString()} pcs`,
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
  const totalRemaining = totalDues - totalWasool;

  let currentY = drawHeader(
    doc,
    sheetTitle.toUpperCase(),
    `Route: ${routeName} | Collector: ${agentName}`,
    'Collection Register'
  );

  // Executive KPI Summary Box (2x2 balanced grid on first page)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, currentY, 182, 17, 2, 2, 'FD');

  // Col 1: Total Accounts & Date
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Customers:', 18, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${rows.length} Registered Shops`, 46, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Collection Date:', 18, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formattedDate, 46, currentY + 12);

  // Col 2: Collector & Route
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Recovery Officer:', 84, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(agentName, 110, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Target Route:', 84, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(routeName, 110, currentY + 12);

  // Col 3: Financial Totals (Prominent & High Contrast)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Outstanding:', 142, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(formatPKR(totalDues), 190, currentY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Wasooli:', 142, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(formatPKR(totalWasool), 190, currentY + 12, { align: 'right' });

  currentY += 22;

  // Natural AutoTable Rows (5 Columns without Signature / Remarks column)
  const tableRows = rows.map((r, i) => [
    i + 1,
    r.name || '—',
    r.address || '—',
    formatPKR(r.totalDue),
    r.wasool ? formatPKR(r.wasool) : ''
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { top: 46, bottom: 25, left: 14, right: 14 },
    head: [['#', 'Customer / Shop Name', 'Market / Address', 'Total Balance (PKR)', 'Collected Wasooli (PKR)']],
    body: tableRows.length ? tableRows : [['-', 'No customer entries in sheet', '-', 'Rs. 0', '']],
    theme: 'grid',
    headStyles: { 
      fillColor: [15, 23, 42], 
      textColor: [255, 255, 255], 
      fontSize: 8, 
      fontStyle: 'bold', 
      halign: 'center',
      minCellHeight: 6.5
    },
    styles: { 
      fontSize: 7.5, 
      cellPadding: 1.8,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 66 },
      2: { cellWidth: 48 },
      3: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], cellWidth: 30 },
      4: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 28 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    foot: [[
      {
        content: `TOTAL (${rows.length} SHOPS):`,
        colSpan: 3,
        styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 8 }
      },
      {
        content: formatPKR(totalDues),
        styles: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], fontSize: 8 }
      },
      {
        content: formatPKR(totalWasool),
        styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 8 }
      }
    ]],
    footStyles: { 
      fillColor: [241, 245, 249], 
      minCellHeight: 7.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    didDrawPage: (data) => {
      // Draw brand header at top of continuation pages
      if (data.pageNumber > 1) {
        drawHeader(
          doc,
          sheetTitle.toUpperCase(),
          `Route: ${routeName} | Collector: ${agentName} (Continued)`,
          'Collection Register'
        );
      }
    }
  });

  const finalY = doc.lastAutoTable.finalY || currentY + 50;
  drawFooter(doc, finalY);

  // Subtle page numbering stamp if multi-page document
  const totalPages = doc.internal.getNumberOfPages();
  if (totalPages > 1) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${p} of ${totalPages}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 4, { align: 'right' });
    }
  }

  const cleanName = (sheetTitle || 'Collection_Sheet').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${cleanName}_${sheetDate}.pdf`);
};

