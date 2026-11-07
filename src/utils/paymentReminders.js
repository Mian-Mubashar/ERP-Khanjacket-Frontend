/**
 * Payment Reminders Utility
 * Automatically tracks customer payments and identifies accounts where wasooli
 * has not been received for 10 or more days.
 */

/**
 * Calculates how many days have elapsed without payment for a customer with an active balance.
 * 
 * Logic:
 * - If remaining balance <= 0, the customer has settled their account (0 days pending).
 * - If remaining balance > 0:
 *   1. Check if new bill was dispatched after the last payment -> pending since that bill date.
 *   2. Else check last payment date -> pending since last partial payment date.
 *   3. Else check customer registration date -> pending since account opening date.
 * - If days elapsed >= 10, triggers overdue payment reminder.
 */
export const calculateCustomerPaymentPendingDays = (customer, customerPayments = [], outward = []) => {
  if (!customer) {
    return { 
      isOverdue: false, 
      daysPending: 0, 
      unpaidSinceTime: 0, 
      unpaidSinceDateStr: '', 
      balance: 0, 
      reason: '' 
    };
  }

  const balance = Number(customer.remainingBalance) || 0;
  if (balance <= 0) {
    return { 
      isOverdue: false, 
      daysPending: 0, 
      unpaidSinceTime: 0, 
      unpaidSinceDateStr: '', 
      balance: 0, 
      reason: 'Settled' 
    };
  }

  const currentShopName = (customer.shopName || '').toLowerCase().trim();
  const custIdStr = String(customer.id);

  // 1. All payments made by this customer
  const payments = (customerPayments || []).filter(p => {
    if (p.customerId && String(p.customerId) === custIdStr) return true;
    if (p.customerName && currentShopName && p.customerName.toLowerCase().includes(currentShopName)) return true;
    return false;
  });

  // 2. All bills (dispatches) for this customer
  const dispatches = (outward || []).filter(o => {
    if (o.customerId && String(o.customerId) === custIdStr) return true;
    if (o.customerName && currentShopName && o.customerName.toLowerCase().includes(currentShopName)) return true;
    return false;
  });

  // Determine latest payment date
  let lastPaymentTime = 0;
  let lastPaymentDateStr = null;
  if (payments.length > 0) {
    const sortedPayments = [...payments].sort((a, b) => {
      const da = new Date(a.date || a.createdAt || 0).getTime();
      const db = new Date(b.date || b.createdAt || 0).getTime();
      return db - da;
    });
    lastPaymentTime = new Date(sortedPayments[0].date || sortedPayments[0].createdAt || 0).getTime();
    lastPaymentDateStr = sortedPayments[0].date || (sortedPayments[0].createdAt ? String(sortedPayments[0].createdAt).split('T')[0] : null);
  }

  // Determine latest bill date
  let lastBillTime = 0;
  let lastBillDateStr = null;
  if (dispatches.length > 0) {
    const sortedBills = [...dispatches].sort((a, b) => {
      const da = new Date(a.date || a.createdAt || 0).getTime();
      const db = new Date(b.date || b.createdAt || 0).getTime();
      return db - da;
    });
    lastBillTime = new Date(sortedBills[0].date || sortedBills[0].createdAt || 0).getTime();
    lastBillDateStr = sortedBills[0].date || (sortedBills[0].createdAt ? String(sortedBills[0].createdAt).split('T')[0] : null);
  }

  // Determine customer creation date
  let custCreatedTime = 0;
  let custCreatedDateStr = null;
  if (customer.createdAt) {
    custCreatedTime = new Date(customer.createdAt).getTime();
    custCreatedDateStr = String(customer.createdAt).split('T')[0];
  } else if (customer.date) {
    custCreatedTime = new Date(customer.date).getTime();
    custCreatedDateStr = customer.date;
  }

  // Determine timestamp since when payment has been pending
  let unpaidSinceTime = 0;
  let unpaidSinceDateStr = '';
  let reason = '';

  if (lastBillTime && (!lastPaymentTime || lastBillTime > lastPaymentTime)) {
    unpaidSinceTime = lastBillTime;
    unpaidSinceDateStr = lastBillDateStr || 'Recent Bill';
    reason = 'Bill Dispatched';
  } else if (lastPaymentTime) {
    unpaidSinceTime = lastPaymentTime;
    unpaidSinceDateStr = lastPaymentDateStr || 'Last Payment';
    reason = 'Partial Payment';
  } else if (custCreatedTime) {
    unpaidSinceTime = custCreatedTime;
    unpaidSinceDateStr = custCreatedDateStr || 'Registration';
    reason = 'Opening Balance';
  } else {
    unpaidSinceTime = Date.now();
    unpaidSinceDateStr = 'Recent';
    reason = 'Khata Balance';
  }

  const now = Date.now();
  const diffMs = now - unpaidSinceTime;
  const daysPending = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const isOverdue = daysPending >= 10;

  return {
    isOverdue,
    daysPending,
    unpaidSinceTime,
    unpaidSinceDateStr,
    reason,
    balance
  };
};

/**
 * Returns a prioritized list of overdue customer payment reminders (10+ days without wasooli).
 */
export const getOverdueCustomerReminders = (customers = [], customerPayments = [], outward = []) => {
  const reminders = [];

  (customers || []).forEach(c => {
    const stats = calculateCustomerPaymentPendingDays(c, customerPayments, outward);
    if (stats.isOverdue) {
      reminders.push({
        id: `overdue-payment-${c.id}`,
        category: 'OVERDUE_PAYMENT',
        severity: stats.daysPending >= 30 ? 'critical' : stats.daysPending >= 20 ? 'high' : 'warning',
        title: `Payment Reminder: ${c.shopName}`,
        badge: `${stats.daysPending} Days Overdue`,
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold',
        desc: `No payment received for ${stats.daysPending} days. Outstanding balance: Rs. ${Math.round(stats.balance).toLocaleString()}`,
        englishNotice: `Payment Overdue: No wasooli received in the last ${stats.daysPending} days from ${c.shopName}. Please collect pending balance of Rs. ${Math.round(stats.balance).toLocaleString()}.`,
        time: `Overdue for ${stats.daysPending} days (Since ${stats.unpaidSinceDateStr})`,
        customer: c,
        customerId: c.id,
        customerName: c.shopName,
        shopkeeperName: c.shopkeeperName,
        city: c.city,
        balance: stats.balance,
        daysPending: stats.daysPending,
        unpaidSinceDateStr: stats.unpaidSinceDateStr,
        unpaidSinceReason: stats.reason
      });
    }
  });

  return reminders.sort((a, b) => b.daysPending - a.daysPending);
};

