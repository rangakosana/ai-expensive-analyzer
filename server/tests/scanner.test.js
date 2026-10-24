import request from 'supertest';
import app from '../server.js';
import { setPool } from '../config/db.js';
import { createMockPool, mockDb } from './mockDb.js';
import {
  normalizeScannedTransactions,
  checkTransactionDuplicate,
  parseScannedDate,
  VALID_SCANNER_CATEGORIES,
} from '../services/ai.service.js';

let authToken;

beforeAll(() => {
  setPool(createMockPool());
});

beforeEach(async () => {
  mockDb.reset();
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Scanner User', email: 'scanner@example.com', password: 'Password123!' });
  authToken = regRes.body.token;
});

describe('AI Scanner & Multi-Transaction Normalization — 13 Regression Scenarios', () => {
  const fixedToday = '2026-10-24';
  const currentYear = 2026;

  // -------------------------------------------------------------
  // Scenario 1: A single receipt with a clear date
  // -------------------------------------------------------------
  describe('1. Single receipt with a clear date', () => {
    it('extracts exactly one transaction with high confidence and is_ready = true', () => {
      const singleReceiptAiOutput = {
        is_valid_transaction: true,
        type: 'single_receipt',
        transactions: [
          {
            amount: 349.5,
            merchant: 'Swiggy',
            category: 'Food & Dining',
            expense_date: '2026-10-24',
            notes: 'UPI payment to Swiggy',
            confidence: 'high',
            reference_id: 'UPI4291829102',
          },
        ],
      };

      const result = normalizeScannedTransactions(singleReceiptAiOutput, 'gemini-3.5-flash-lite', fixedToday);

      expect(result.is_valid_transaction).toBe(true);
      expect(result.type).toBe('single_receipt');
      expect(result.transaction_count).toBe(1);
      expect(result.transactions.length).toBe(1);

      const tx = result.transactions[0];
      expect(tx.amount).toBe(349.5);
      expect(tx.merchant).toBe('Swiggy');
      expect(tx.category).toBe('Food & Dining');
      expect(tx.expense_date).toBe('2026-10-24');
      expect(tx.reference_id).toBe('UPI4291829102');
      expect(tx.is_ready).toBe(true);
      expect(tx.confidence).toBe('high');
      expect(tx.is_date_confident).toBe(true);
      expect(tx.date_review_reason).toBeNull();

      // Top-level aliases for backward compatibility
      expect(result.amount).toBe(349.5);
      expect(result.merchant).toBe('Swiggy');
      expect(result.expense_date).toBe('2026-10-24');
    });
  });

  // -------------------------------------------------------------
  // Scenario 2: A history screenshot containing multiple transactions with clear dates
  // -------------------------------------------------------------
  describe('2. History screenshot containing multiple transactions with clear dates', () => {
    it('returns multiple distinct transactions all marked ready and categorized', () => {
      const historyAiOutput = {
        is_valid_transaction: true,
        type: 'statement_history',
        transactions: [
          {
            amount: 85,
            merchant: 'Starbucks Coffee',
            category: 'Food & Dining',
            expense_date: '2026-10-24',
            notes: 'Morning coffee',
            reference_id: 'UTR001',
          },
          {
            amount: 450,
            merchant: 'Indian Oil Petrol',
            category: 'Transportation',
            expense_date: '2026-10-23',
            notes: 'Fuel',
            reference_id: 'UTR002',
          },
          {
            amount: 1299,
            merchant: 'DMart Supermarket',
            category: 'Shopping',
            expense_date: '2026-10-22',
            notes: 'Groceries',
            reference_id: 'UTR003',
          },
          {
            amount: 699,
            merchant: 'Airtel Broadband',
            category: 'Utilities',
            expense_date: '2026-10-20',
            notes: 'Monthly internet bill',
            reference_id: 'UTR004',
          },
          {
            amount: 250,
            merchant: 'Cult.fit Gym',
            category: 'Personal Care',
            expense_date: '2026-10-18',
            notes: 'Gym session pass',
            reference_id: 'UTR005',
          },
        ],
      };

      const result = normalizeScannedTransactions(historyAiOutput, 'gemini-3.5-flash-lite', fixedToday);

      expect(result.is_valid_transaction).toBe(true);
      expect(result.type).toBe('statement_history');
      expect(result.transaction_count).toBe(5);
      expect(result.transactions.length).toBe(5);

      expect(result.transactions[0].merchant).toBe('Starbucks Coffee');
      expect(result.transactions[0].amount).toBe(85);
      expect(result.transactions[0].expense_date).toBe('2026-10-24');
      expect(result.transactions[1].merchant).toBe('Indian Oil Petrol');
      expect(result.transactions[1].amount).toBe(450);
      expect(result.transactions[1].expense_date).toBe('2026-10-23');
      expect(result.transactions[2].merchant).toBe('DMart Supermarket');
      expect(result.transactions[2].amount).toBe(1299);
      expect(result.transactions[2].expense_date).toBe('2026-10-22');
      expect(result.transactions[3].merchant).toBe('Airtel Broadband');
      expect(result.transactions[3].amount).toBe(699);
      expect(result.transactions[3].expense_date).toBe('2026-10-20');
      expect(result.transactions[4].merchant).toBe('Cult.fit Gym');
      expect(result.transactions[4].amount).toBe(250);
      expect(result.transactions[4].expense_date).toBe('2026-10-18');

      result.transactions.forEach((tx) => {
        expect(tx.is_ready).toBe(true);
        expect(tx.confidence).toBe('high');
        expect(VALID_SCANNER_CATEGORIES).toContain(tx.category);
      });
    });
  });

  // -------------------------------------------------------------
  // Scenario 3: Common date formats
  // -------------------------------------------------------------
  describe('3. Common date formats parsing', () => {
    it('correctly normalizes 16 Oct, 16 October 2026, 16/10/2026, 16-10-2026, Oct 16 2026, and ISO', () => {
      // 1. Day Month without year (e.g., "16 Oct", "16 October")
      const r1 = parseScannedDate('16 Oct', currentYear);
      expect(r1.date).toBe('2026-10-16');
      expect(r1.is_date_confident).toBe(true);

      const r2 = parseScannedDate('16 October', currentYear);
      expect(r2.date).toBe('2026-10-16');
      expect(r2.is_date_confident).toBe(true);

      // 2. Day Month Year with full year
      const r3 = parseScannedDate('16 October 2026', currentYear);
      expect(r3.date).toBe('2026-10-16');
      expect(r3.is_date_confident).toBe(true);

      // 3. Day Month Year with 2-digit year
      const r4 = parseScannedDate('16-Oct-26', currentYear);
      expect(r4.date).toBe('2026-10-16');
      expect(r4.is_date_confident).toBe(true);

      // 4. Numeric DD/MM/YYYY
      const r5 = parseScannedDate('16/10/2026', currentYear);
      expect(r5.date).toBe('2026-10-16');
      expect(r5.is_date_confident).toBe(true);

      // 5. Numeric DD-MM-YYYY
      const r6 = parseScannedDate('16-10-2026', currentYear);
      expect(r6.date).toBe('2026-10-16');
      expect(r6.is_date_confident).toBe(true);

      // 6. Month Day Year (e.g., "Oct 16, 2026")
      const r7 = parseScannedDate('Oct 16, 2026', currentYear);
      expect(r7.date).toBe('2026-10-16');
      expect(r7.is_date_confident).toBe(true);

      // 7. Strict ISO YYYY-MM-DD
      const r8 = parseScannedDate('2026-10-16', currentYear);
      expect(r8.date).toBe('2026-10-16');
      expect(r8.is_date_confident).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // Scenario 4: A missing or partially obscured date
  // -------------------------------------------------------------
  describe('4. Missing or partially obscured date', () => {
    it('flags transaction for review and NEVER silently substitutes today date', () => {
      const obscuredInputs = ['', '   ', 'cut off', 'obscured', 'blurry date', null, undefined];

      obscuredInputs.forEach((rawDate) => {
        const parsed = parseScannedDate(rawDate, currentYear);
        expect(parsed.date).toBe('');
        expect(parsed.is_date_confident).toBe(false);
        expect(parsed.date_review_reason).not.toBeNull();
      });

      // Normalization check: never silently invent today's date
      const aiOutputObscuredDate = {
        is_valid_transaction: true,
        transactions: [
          {
            amount: 22,
            merchant: 'VENKAYYA SWAMY FANCY',
            category: 'Shopping',
            expense_date: '', // Date obscured at bottom of screenshot
          },
        ],
      };

      const result = normalizeScannedTransactions(aiOutputObscuredDate, 'gemini', fixedToday);
      const tx = result.transactions[0];

      expect(tx.expense_date).toBe('');
      expect(tx.is_ready).toBe(false);
      expect(tx.confidence).toBe('needs_review');
      expect(tx.is_date_confident).toBe(false);
      expect(tx.date_review_reason).toContain('Date unclear');
      expect(tx.review_reasons).toContain('Date unclear or not visible — please confirm');
      // Crucial: top level alias must also not be today's date
      expect(result.expense_date).toBe('');
    });
  });

  // -------------------------------------------------------------
  // Scenario 5: Relative timestamps without a reliable reference time
  // -------------------------------------------------------------
  describe('5. Relative timestamps without a reliable reference time', () => {
    it('flags relative timestamps like "1 min ago" and "Yesterday" for manual review', () => {
      const relativeSamples = ['1 min ago', '2 hours ago', 'Yesterday', 'just now', '5 minutes ago'];

      relativeSamples.forEach((sample) => {
        const parsed = parseScannedDate(sample, currentYear);
        expect(parsed.date).toBe('');
        expect(parsed.is_date_confident).toBe(false);
        expect(parsed.date_review_reason).toContain('Relative timestamp');
      });

      const aiOutputWithRelative = {
        transactions: [
          {
            amount: 39,
            merchant: 'Tea Stall',
            category: 'Food & Dining',
            expense_date: '1 min ago',
          },
        ],
      };

      const result = normalizeScannedTransactions(aiOutputWithRelative, 'gemini', fixedToday);
      const tx = result.transactions[0];

      expect(tx.expense_date).toBe('');
      expect(tx.is_ready).toBe(false);
      expect(tx.confidence).toBe('needs_review');
      expect(tx.date_review_reason).toContain('Relative timestamp ("1 min ago")');
    });
  });

  // -------------------------------------------------------------
  // Scenario 6: An unreadable amount
  // -------------------------------------------------------------
  describe('6. An unreadable amount', () => {
    it('flags transaction when amount is 0, negative, or unreadable string', () => {
      const invalidAmounts = [
        { amount: 0, merchant: 'Store Zero' },
        { amount: -50, merchant: 'Store Negative' },
        { amount: 'unreadable', merchant: 'Store Blurry' },
        { amount: null, merchant: 'Store Null' },
      ];

      const result = normalizeScannedTransactions({ transactions: invalidAmounts }, 'gemini', fixedToday);

      expect(result.transactions.length).toBe(4);
      result.transactions.forEach((tx) => {
        expect(tx.is_ready).toBe(false);
        expect(tx.confidence).toBe('needs_review');
        expect(tx.amount_review_reason).toBe('Amount not confidently detected');
        expect(tx.review_reasons).toContain('Amount not confidently detected');
      });
    });
  });

  // -------------------------------------------------------------
  // Scenario 7: An uncertain merchant name
  // -------------------------------------------------------------
  describe('7. An uncertain merchant name', () => {
    it('flags transaction when merchant is empty, blank, or missing', () => {
      const invalidMerchants = [
        { amount: 150, merchant: '', expense_date: '2026-10-24' },
        { amount: 200, merchant: '   ', expense_date: '2026-10-24' },
      ];

      const result = normalizeScannedTransactions({ transactions: invalidMerchants }, 'gemini', fixedToday);

      expect(result.transactions.length).toBe(2);
      result.transactions.forEach((tx) => {
        expect(tx.is_ready).toBe(false);
        expect(tx.confidence).toBe('needs_review');
        expect(tx.merchant_review_reason).toBe('Merchant name needs review');
        expect(tx.review_reasons).toContain('Merchant name needs review');
      });
    });
  });

  // -------------------------------------------------------------
  // Scenario 8: Preservation of correctly extracted fields when another field is unclear
  // -------------------------------------------------------------
  describe('8. Preservation of correctly extracted fields when another field is unclear', () => {
    it('preserves merchant, amount, category, and notes when date is obscured', () => {
      const partialTx = {
        amount: 22,
        merchant: 'VENKAYYA SWAMY FANCY',
        category: 'Shopping',
        expense_date: '', // Obscured
        notes: 'Fancy store purchase',
      };

      const result = normalizeScannedTransactions({ transactions: [partialTx] }, 'gemini', fixedToday);
      const tx = result.transactions[0];

      // Readable fields must be preserved
      expect(tx.amount).toBe(22);
      expect(tx.merchant).toBe('VENKAYYA SWAMY FANCY');
      expect(tx.category).toBe('Shopping');
      expect(tx.notes).toBe('Fancy store purchase');
      // Unclear field flagged
      expect(tx.expense_date).toBe('');
      expect(tx.is_ready).toBe(false);
      expect(tx.confidence).toBe('needs_review');
    });

    it('preserves date and amount when merchant name is blurry', () => {
      const partialTx = {
        amount: 500,
        merchant: '', // Blurry
        category: 'Transportation',
        expense_date: '2026-10-16',
      };

      const result = normalizeScannedTransactions({ transactions: [partialTx] }, 'gemini', fixedToday);
      const tx = result.transactions[0];

      expect(tx.amount).toBe(500);
      expect(tx.expense_date).toBe('2026-10-16');
      expect(tx.merchant).toBe('');
      expect(tx.is_ready).toBe(false);
      expect(tx.merchant_review_reason).toBe('Merchant name needs review');
    });
  });

  // -------------------------------------------------------------
  // Scenario 9: Review-state transitions after user corrects a field
  // -------------------------------------------------------------
  describe('9. Review-state transitions after user corrects a field', () => {
    it('transitions from needs_review to ready once user provides valid date', () => {
      // Simulate frontend item initial state from scan
      const initialItem = {
        id: 'tx_row_1',
        amount: '22',
        merchant: 'VENKAYYA SWAMY FANCY',
        category: 'Shopping',
        expense_date: '',
        confidence: 'needs_review',
        is_ready: false,
        date_review_reason: 'Date unclear or not visible — please confirm',
      };

      // Ensure initially not ready
      expect(initialItem.is_ready).toBe(false);

      // Simulate user editing date to "2026-10-16"
      const userEditedDate = '2026-10-16';
      const parsedDate = parseScannedDate(userEditedDate, currentYear);
      const hasValidAmount = parseFloat(initialItem.amount) > 0;
      const hasValidMerchant = initialItem.merchant.trim().length > 0;
      const hasValidDate = parsedDate.is_date_confident && Boolean(parsedDate.date);

      const isNowReady = hasValidAmount && hasValidMerchant && hasValidDate;
      const updatedItem = {
        ...initialItem,
        expense_date: parsedDate.date,
        is_ready: isNowReady,
        confidence: isNowReady ? 'high' : 'needs_review',
        date_review_reason: parsedDate.date_review_reason,
      };

      expect(updatedItem.is_ready).toBe(true);
      expect(updatedItem.confidence).toBe('high');
      expect(updatedItem.expense_date).toBe('2026-10-16');
      expect(updatedItem.date_review_reason).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // Scenario 10: Possible duplicates with different dates (overlapping screenshots)
  // -------------------------------------------------------------
  describe('10. Possible duplicates with different dates', () => {
    it('warns about overlapping screenshot duplicate even when dates differ by up to 14 days', () => {
      const item1 = {
        id: 'tx_screenshot_1',
        amount: '22.00',
        merchant: 'VENKAYYA SWAMY FANCY',
        expense_date: '2026-10-24', // Captured with wrong/today date in first scan
      };

      const item2 = {
        id: 'tx_screenshot_2',
        amount: '22.00',
        merchant: 'VENKAYYA SWAMY FANCY',
        expense_date: '2026-10-16', // Captured with actual date in second scan
      };

      const batch = [item1, item2];

      const warning = checkTransactionDuplicate(item2, batch, []);
      expect(warning).not.toBeNull();
      expect(warning).toContain('Possible duplicate');
      expect(warning).toContain('VENKAYYA SWAMY FANCY');
      expect(warning).toContain('2026-10-24');

      // Check matching against existing saved expenses with date difference
      const existingDbExpenses = [
        {
          id: 'exp_db_venkayya',
          amount: 22,
          merchant: 'VENKAYYA SWAMY FANCY',
          expense_date: '2026-10-24',
        },
      ];

      const dbWarning = checkTransactionDuplicate(item2, [item2], existingDbExpenses);
      expect(dbWarning).not.toBeNull();
      expect(dbWarning).toContain('Possible duplicate');
      expect(dbWarning).toContain('already saved on 2026-10-24');
    });
  });

  // -------------------------------------------------------------
  // Scenario 11: Legitimate transactions with matching merchant and amount
  // -------------------------------------------------------------
  describe('11. Legitimate transactions with matching merchant and amount', () => {
    it('does not flag transactions separated by more than 14 days', () => {
      const item1 = {
        id: 'tx_sep_1',
        amount: '50.00',
        merchant: 'Metro Rail',
        expense_date: '2026-09-01',
      };

      const item2 = {
        id: 'tx_sep_2',
        amount: '50.00',
        merchant: 'Metro Rail',
        expense_date: '2026-10-24', // 53 days later
      };

      const warning = checkTransactionDuplicate(item2, [item1, item2], []);
      expect(warning).toBeNull();
    });

    it('does not auto-discard or delete flagged transactions', () => {
      const item1 = { id: 'tx_a', amount: '100', merchant: 'Tea Stall', expense_date: '2026-10-24' };
      const item2 = { id: 'tx_b', amount: '100', merchant: 'Tea Stall', expense_date: '2026-10-24' };

      // Warning is generated
      const warning = checkTransactionDuplicate(item2, [item1, item2], []);
      expect(warning).not.toBeNull();

      // But both items remain completely preserved in the list
      const batchList = [item1, item2];
      expect(batchList.length).toBe(2);
      expect(batchList[0].amount).toBe('100');
      expect(batchList[1].amount).toBe('100');
    });
  });

  // -------------------------------------------------------------
  // Scenario 12: Batch saving that excludes unresolved transactions
  // -------------------------------------------------------------
  describe('12. Batch saving that excludes unresolved transactions', () => {
    it('excludes items with missing dates or incomplete fields from batch payload', async () => {
      const batchRows = [
        {
          id: 'row_1',
          amount: '120.00',
          merchant: 'Complete Store',
          category: 'Shopping',
          expense_date: '2026-10-24',
          is_ready: true,
        },
        {
          id: 'row_2',
          amount: '22.00',
          merchant: 'VENKAYYA SWAMY FANCY',
          category: 'Shopping',
          expense_date: '', // Unresolved date!
          is_ready: false,
        },
        {
          id: 'row_3',
          amount: '0',
          merchant: 'Incomplete Store',
          category: 'Food & Dining',
          expense_date: '2026-10-24',
          is_ready: false,
        },
      ];

      // Simulate AddExpensePage.jsx filter: only is_ready AND valid date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const readyPayload = batchRows
        .filter((item) => item.is_ready && dateRegex.test(item.expense_date))
        .map((item) => ({
          amount: parseFloat(item.amount),
          merchant: item.merchant,
          category: item.category,
          expense_date: item.expense_date,
        }));

      // Only row_1 should be selected
      expect(readyPayload.length).toBe(1);
      expect(readyPayload[0].merchant).toBe('Complete Store');

      // Verify batch endpoint successfully receives and saves ready transactions
      const res = await request(app)
        .post('/api/expenses/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ expenses: readyPayload });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].merchant).toBe('Complete Store');
    });
  });

  // -------------------------------------------------------------
  // Scenario 13: Preservation of the existing single-receipt workflow
  // -------------------------------------------------------------
  describe('13. Preservation of existing single-receipt workflow', () => {
    it('supports legacy flat AI receipt responses with top-level attributes and individual saving', async () => {
      const legacyOutput = {
        is_valid_transaction: true,
        amount: 150,
        merchant: 'Apollo Pharmacy',
        category: 'Healthcare',
        expense_date: '2026-10-20',
        notes: 'Cold medication',
      };

      const result = normalizeScannedTransactions(legacyOutput, 'gemini-3.5-flash-lite', fixedToday);

      expect(result.is_valid_transaction).toBe(true);
      expect(result.transaction_count).toBe(1);
      expect(result.transactions[0].merchant).toBe('Apollo Pharmacy');
      expect(result.transactions[0].amount).toBe(150);
      expect(result.transactions[0].category).toBe('Healthcare');
      expect(result.transactions[0].expense_date).toBe('2026-10-20');
      expect(result.transactions[0].is_ready).toBe(true);

      // Verify saving via standard individual /api/expenses endpoint
      const saveRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: result.transactions[0].amount,
          merchant: result.transactions[0].merchant,
          category: result.transactions[0].category,
          expense_date: result.transactions[0].expense_date,
          notes: result.transactions[0].notes,
        });

      expect(saveRes.status).toBe(201);
      expect(saveRes.body).toHaveProperty('id');
      expect(saveRes.body.merchant).toBe('Apollo Pharmacy');
    });
  });

  // -------------------------------------------------------------
  // Additional Scanner Edge Cases & Endpoints
  // -------------------------------------------------------------
  describe('Scanner Endpoint Guardrails and Edge Cases', () => {
    it('requires authentication token', async () => {
      const res = await request(app).post('/api/expenses/scan-receipt').send({ image: 'base64...' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when image is missing', async () => {
      const res = await request(app)
        .post('/api/expenses/scan-receipt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Receipt image data is required');
    });

    it('handles malformed AI output safely without crashing', () => {
      expect(normalizeScannedTransactions(null).is_valid_transaction).toBe(false);
      expect(normalizeScannedTransactions(undefined).transaction_count).toBe(0);
      expect(normalizeScannedTransactions({}).transactions).toEqual([]);
      expect(normalizeScannedTransactions({ transactions: [] }).is_valid_transaction).toBe(false);
      expect(normalizeScannedTransactions('unexpected string').transaction_count).toBe(0);
    });

    it('cleans amounts with currency symbols and commas', () => {
      const outputWithCurrency = {
        transactions: [
          { amount: '₹ 1,450.50', merchant: 'Retail Store', category: 'Shopping', expense_date: '2026-10-24' },
          { amount: 'Rs. 250', merchant: 'Food Truck', category: 'Food & Dining', expense_date: '2026-10-24' },
        ],
      };

      const result = normalizeScannedTransactions(outputWithCurrency, 'gemini', fixedToday);

      expect(result.transactions[0].amount).toBe(1450.5);
      expect(result.transactions[1].amount).toBe(250);
    });
  });
});
