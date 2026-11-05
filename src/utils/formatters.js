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
    return `✨ ${cr} Crore PKR`;
  }
  if (n >= 100000) {
    const lacs = (n / 100000).toFixed(2).replace(/\.00$/, '');
    return `✨ ${lacs} Lacs PKR`;
  }
  if (n >= 1000) {
    const th = (n / 1000).toFixed(1).replace(/\.0$/, '');
    return `✨ ${th}k PKR`;
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

/**
 * Clean Customer / Shop Display Name Formatter:
 * - If shopName & distinct ownerName exist: "Shop Name (Owner Name)"
 * - If only shopName exists: "Shop Name" (NO empty or redundant brackets!)
 * - If only ownerName exists: "Owner Name" (NO empty or redundant brackets!)
 * - If ownerName is identical or redundant to shopName: "Shop Name" (NO duplicate brackets!)
 */
export const formatCustomerDisplayName = (custOrShop, maybeOwner) => {
  let shop = '';
  let owner = '';

  if (typeof custOrShop === 'object' && custOrShop !== null) {
    shop = (custOrShop.shopName || custOrShop.name || '').trim();
    owner = (custOrShop.shopkeeperName || custOrShop.ownerName || '').trim();
  } else {
    shop = (custOrShop || '').trim();
    owner = (maybeOwner || '').trim();
  }

  // If already formatted with brackets e.g. "Mubashar shop (mubashar)"
  if (shop && !owner) {
    const bracketMatch = shop.match(/^(.+?)\s*\((.*?)\)$/);
    if (bracketMatch) {
      const mainPart = bracketMatch[1].trim();
      const bracketPart = bracketMatch[2].trim();
      if (!bracketPart) return mainPart;
      const mNorm = mainPart.toLowerCase().replace(/[^a-z0-9]/g, '');
      const bNorm = bracketPart.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (mNorm === bNorm || mNorm.includes(bNorm) || bNorm.includes(mNorm)) {
        return mainPart;
      }
      return `${mainPart} (${bracketPart})`;
    }
  }

  if (!shop && !owner) return '';
  if (shop && !owner) return shop;
  if (!shop && owner) return owner;

  // Both exist: check if redundant or identical
  const sNorm = shop.toLowerCase().replace(/[^a-z0-9]/g, '');
  const oNorm = owner.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (sNorm === oNorm || sNorm.includes(oNorm) || oNorm.includes(sNorm)) {
    return shop;
  }

  return `${shop} (${owner})`;
};
