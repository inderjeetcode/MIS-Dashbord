/**
 * Date parsing and formatting utilities
 */

export function parseExcelOrStringDate(value: any): { dateStr: string; monthStr: string; yearStr: string } | null {
  if (value === null || value === undefined || value === '') return null;

  let d: Date | null = null;

  // If number, it could be an Excel serial date number
  if (typeof value === 'number') {
    // Excel epoch begins at 1899-12-30 due to historical leap year bug
    const utc_days = Math.floor(value - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    d = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
  } else if (value instanceof Date) {
    d = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split(/[-T ]/);
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    // Try DD/MM/YYYY or DD-MM-YYYY
    else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(trimmed)) {
      const parts = trimmed.split(/[/-]/);
      d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    // Try standard Date.parse
    else {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      }
    }
  }

  if (!d || isNaN(d.getTime())) {
    return null;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  const dateStr = `${year}-${month}-${day}`;
  const monthStr = `${year}-${month}`;
  const yearStr = `${year}`;

  return { dateStr, monthStr, yearStr };
}

export function formatMonthName(monthKey: string): string {
  // monthKey is "YYYY-MM"
  if (!monthKey || !monthKey.includes('-')) return monthKey || 'Unknown';
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const mIndex = parseInt(month, 10) - 1;
  if (mIndex >= 0 && mIndex < 12) {
    return `${monthNames[mIndex]} ${year}`;
  }
  return monthKey;
}

export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const monthShorts = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(m, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${parseInt(d, 10)} ${monthShorts[mIdx]} ${y}`;
    }
  }
  return dateStr;
}
