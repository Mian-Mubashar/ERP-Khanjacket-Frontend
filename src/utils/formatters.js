export const formatPKR = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return 'Rs. 0';
  return `Rs. ${num.toLocaleString('en-PK')}`;
};

/**
 * Convert number to friendly Lacs & Crores preview with Roman Urdu representation
 * e.g. 500000 -> "5 Lacs PKR (Paanch Lakh)"
 *      2500000 -> "25 Lacs PKR (Pachees Lakh)"
 *      15000000 -> "1.50 Crore PKR (Dedh Crore)"
 */
export const formatLakhCrore = (num) => {
  const n = Number(num);
  if (!n || isNaN(n) || n <= 0) return '';

  if (n >= 10000000) {
    const cr = (n / 10000000).toFixed(2).replace(/\.00$/, '');
    return `✨ ${cr} Crore PKR (${cr} Crore)`;
  }
  if (n >= 100000) {
    const lacs = (n / 100000).toFixed(2).replace(/\.00$/, '');
    return `✨ ${lacs} Lacs PKR (${lacs} Lakh)`;
  }
  if (n >= 1000) {
    const th = (n / 1000).toFixed(1).replace(/\.0$/, '');
    return `✨ ${th} Thousand PKR (${th} Hazaar)`;
  }
  return `✨ ${n.toLocaleString()} PKR`;
};

/**
 * Friendly Quantity display (e.g. "1,200 Pcs (Master Cartons)")
 */
export const formatPieces = (qty) => {
  const n = Number(qty);
  if (isNaN(n)) return '0 Pcs';
  return `${n.toLocaleString()} Pcs`;
};
