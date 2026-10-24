const MONTH_MAP = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

/**
 * Robust date parser supporting YYYY-MM-DD, DD Month YYYY, DD Month, DD/MM/YYYY, etc.
 * Flags relative timestamps and obscured/missing dates as uncertain rather than guessing today's date.
 */
export const parseScannedDate = (rawDate, currentYear = 2026) => {
  if (!rawDate || typeof rawDate !== 'string') {
    return {
      date: '',
      is_date_confident: false,
      date_review_reason: 'Date unclear or not visible — please confirm',
    };
  }

  const trimmed = rawDate.trim();
  if (!trimmed) {
    return {
      date: '',
      is_date_confident: false,
      date_review_reason: 'Date unclear or not visible — please confirm',
    };
  }

  // 1. Check for relative time indicators (e.g. "1 min ago", "2 hours ago", "Yesterday", "just now")
  const isRelative = /\b(min|mins|minute|minutes|hour|hours|sec|second|seconds|ago|yesterday|today|just now)\b/i.test(trimmed);
  if (isRelative) {
    return {
      date: '',
      is_date_confident: false,
      date_review_reason: `Relative timestamp ("${trimmed}") — please confirm exact transaction date`,
    };
  }

  // 2. Strict ISO: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return {
        date: trimmed,
        is_date_confident: true,
        date_review_reason: null,
      };
    }
  }

  // 3. Day Month Year (e.g. "16 Oct 2026", "16 October 2026", "16-Oct-2026", "16/Oct/2026", "16-October-2026")
  const dmyMatch = trimmed.match(/^(\d{1,2})[\s/-]+([a-zA-Z]+)[\s/-]+(\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const monthKey = dmyMatch[2].toLowerCase();
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    const m = MONTH_MAP[monthKey];
    if (m) {
      return {
        date: `${year}-${m}-${day}`,
        is_date_confident: true,
        date_review_reason: null,
      };
    }
  }

  // 4. Month Day Year (e.g. "Oct 16, 2026", "October 16 2026")
  const mdyMatch = trimmed.match(/^([a-zA-Z]+)[\s/-]+(\d{1,2}),?[\s/-]+(\d{2,4})$/);
  if (mdyMatch) {
    const monthKey = mdyMatch[1].toLowerCase();
    const day = mdyMatch[2].padStart(2, '0');
    let year = mdyMatch[3];
    if (year.length === 2) year = `20${year}`;
    const m = MONTH_MAP[monthKey];
    if (m) {
      return {
        date: `${year}-${m}-${day}`,
        is_date_confident: true,
        date_review_reason: null,
      };
    }
  }

  // 5. Day Month without year (e.g. "16 Oct", "16 October", "16-Oct", "16/Oct")
  const dmNoYearMatch = trimmed.match(/^(\d{1,2})[\s/-]+([a-zA-Z]+)$/);
  if (dmNoYearMatch) {
    const day = dmNoYearMatch[1].padStart(2, '0');
    const monthKey = dmNoYearMatch[2].toLowerCase();
    const m = MONTH_MAP[monthKey];
    if (m) {
      return {
        date: `${currentYear}-${m}-${day}`,
        is_date_confident: true,
        date_review_reason: null,
      };
    }
  }

  // 6. Month Day without year (e.g. "Oct 16", "October 16")
  const mdNoYearMatch = trimmed.match(/^([a-zA-Z]+)[\s/-]+(\d{1,2})$/);
  if (mdNoYearMatch) {
    const monthKey = mdNoYearMatch[1].toLowerCase();
    const day = mdNoYearMatch[2].padStart(2, '0');
    const m = MONTH_MAP[monthKey];
    if (m) {
      return {
        date: `${currentYear}-${m}-${day}`,
        is_date_confident: true,
        date_review_reason: null,
      };
    }
  }

  // 7. Numeric DD/MM/YYYY or DD-MM-YYYY (e.g. "16/10/2026", "16-10-2026", "16.10.2026")
  const numMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (numMatch) {
    let d = parseInt(numMatch[1], 10);
    let m = parseInt(numMatch[2], 10);
    let y = numMatch[3];
    if (y.length === 2) y = `20${y}`;
    if (m > 12 && d <= 12) {
      const temp = d;
      d = m;
      m = temp;
    }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(m).padStart(2, '0');
      return {
        date: `${y}-${monthStr}-${dayStr}`,
        is_date_confident: true,
        date_review_reason: null,
      };
    }
  }

  // Unrecognized string format
  return {
    date: '',
    is_date_confident: false,
    date_review_reason: `Date format ("${trimmed}") unclear — please confirm`,
  };
};

/**
 * Checks for potential duplicate transactions within the current scan batch or existing expenses.
 * Uses cautious comparison based on reference IDs, merchant, amount, and date proximity (up to 14 days)
 * to handle overlapping statement history screenshots.
 * Returns a descriptive warning string if a duplicate is suspected, or null otherwise.
 * Does not block or discard legitimate transactions.
 */
export const checkTransactionDuplicate = (item, allItems = [], existingExpenses = []) => {
  if (!item || item.amount === undefined || item.amount === null) return null;
  const numAmount = parseFloat(item.amount);
  if (isNaN(numAmount) || numAmount <= 0) return null;

  const cleanMerchant = (item.merchant || '').trim().toLowerCase();
  const dateStr = item.expense_date;

  // 1. Check duplicate reference ID (e.g. UTR / UPI Ref ID) within batch
  if (item.reference_id && item.reference_id.trim()) {
    const cleanRef = item.reference_id.trim();
    const matchingRefBatch = allItems.find(
      (other) => other.id !== item.id && other.reference_id && other.reference_id.trim() === cleanRef
    );
    if (matchingRefBatch) {
      return `Identical transaction reference (${cleanRef}) found in current scan session.`;
    }
  }

  if (!cleanMerchant) return null;

  const parseDateMs = (d) => {
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
    return new Date(d).getTime();
  };
  const itemDateMs = parseDateMs(dateStr);

  // 2. Check within current batch items: same amount & merchant
  for (const other of allItems) {
    if (other.id === item.id) continue;
    const otherMerchant = (other.merchant || '').trim().toLowerCase();
    const otherAmt = parseFloat(other.amount);
    if (isNaN(otherAmt) || otherAmt <= 0) continue;

    const isSameAmount = Math.abs(otherAmt - numAmount) < 0.01;
    const isSameMerchant = otherMerchant === cleanMerchant;

    if (isSameAmount && isSameMerchant) {
      if (other.expense_date && dateStr && other.expense_date === dateStr) {
        return 'Possible duplicate: same amount, merchant, and date detected in this scan session.';
      }
      const otherDateMs = parseDateMs(other.expense_date);
      if (itemDateMs && otherDateMs) {
        const diffDays = Math.abs(itemDateMs - otherDateMs) / (1000 * 60 * 60 * 24);
        if (diffDays <= 14) {
          return `Possible duplicate: identical ₹${numAmount} at ${item.merchant} detected in this session on ${other.expense_date}.`;
        }
      } else {
        return `Possible duplicate: matches another ₹${numAmount} at ${item.merchant} in this scan session.`;
      }
    }
  }

  // 3. Check against existing saved expenses in DB: same amount & merchant
  for (const exp of existingExpenses) {
    const expMerchant = (exp.merchant || '').trim().toLowerCase();
    const expAmt = parseFloat(exp.amount);
    if (isNaN(expAmt) || expAmt <= 0) continue;

    const isSameAmount = Math.abs(expAmt - numAmount) < 0.01;
    const isSameMerchant = expMerchant === cleanMerchant;

    if (isSameAmount && isSameMerchant) {
      if (exp.expense_date && dateStr && exp.expense_date === dateStr) {
        return `Possible duplicate: matches an expense already saved on ${exp.expense_date}.`;
      }
      const expDateMs = parseDateMs(exp.expense_date);
      if (itemDateMs && expDateMs) {
        const diffDays = Math.abs(itemDateMs - expDateMs) / (1000 * 60 * 60 * 24);
        if (diffDays <= 14) {
          return `Possible duplicate: matches ₹${numAmount} at ${exp.merchant} already saved on ${exp.expense_date} (compare screenshots).`;
        }
      } else if (!dateStr) {
        return `Possible duplicate: matches ₹${numAmount} at ${exp.merchant} already saved on ${exp.expense_date}.`;
      }
    }
  }

  return null;
};
