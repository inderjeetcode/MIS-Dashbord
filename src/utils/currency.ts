/**
 * Currency utilities for Indian Rupee (INR) formatting and decimal-safe calculations.
 */

export function formatINR(amount: number | null | undefined, showDecimals: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  // Use Intl.NumberFormat with en-IN locale
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function formatINRCompact(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${abs.toFixed(0)}`;
}

export function parseNumberSafely(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  const cleanStr = String(value).replace(/₹|,|\s/g, '').trim();
  const num = parseFloat(cleanStr);
  return isNaN(num) ? null : num;
}
