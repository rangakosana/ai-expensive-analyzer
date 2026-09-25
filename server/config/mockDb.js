import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, '../../database/local-db.json');

export class MockDatabase {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = [];
    this.expenses = [];
    this.ai_insights = [];
    this.budgets = [];
  }

  init() {
    if (process.env.NODE_ENV === 'test') {
      this.seedDefaultData();
      return;
    }

    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        this.users = Array.isArray(data.users) ? data.users : [];
        this.expenses = Array.isArray(data.expenses) ? data.expenses : [];
        this.ai_insights = Array.isArray(data.ai_insights) ? data.ai_insights : [];
        this.budgets = Array.isArray(data.budgets) ? data.budgets : [];

        if (this.users.length === 0) {
          this.seedDefaultData();
          this.saveToDisk();
        }
        return;
      }
    } catch (err) {
      console.warn('⚠️ Could not load local-db.json, seeding defaults:', err.message);
    }

    this.seedDefaultData();
    this.saveToDisk();
  }

  saveToDisk() {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        users: this.users,
        expenses: this.expenses,
        ai_insights: this.ai_insights,
        budgets: this.budgets,
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save local database to disk:', err.message);
    }
  }

  seedDefaultData() {
    this.reset();
    const demoUserId = '00000000-0000-0000-0000-000000000001';
    const passwordHash = bcrypt.hashSync('Password123!', 10);
    this.users.push({
      id: demoUserId,
      name: 'Demo User',
      email: 'demo@example.com',
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ym = `${year}-${month}`;

    const sampleExpenses = [
      { amount: 1250.00, merchant: 'Apex Properties', category: 'Housing', date: `${ym}-01`, notes: 'Monthly Apartment Rent' },
      { amount: 65.40, merchant: 'Whole Foods Market', category: 'Food & Dining', date: `${ym}-03`, notes: 'Weekly grocery run' },
      { amount: 14.50, merchant: 'Starbucks', category: 'Food & Dining', date: `${ym}-04`, notes: 'Morning latte and croissant' },
      { amount: 45.00, merchant: 'Shell Gas Station', category: 'Transportation', date: `${ym}-05`, notes: 'Fuel' },
      { amount: 120.00, merchant: 'Metro Electric Utility', category: 'Utilities', date: `${ym}-07`, notes: 'Electric & Gas bill' },
      { amount: 18.99, merchant: 'Netflix', category: 'Entertainment', date: `${ym}-09`, notes: 'Monthly streaming subscription' },
      { amount: 35.00, merchant: 'Walgreens Pharmacy', category: 'Healthcare', date: `${ym}-11`, notes: 'Vitamins and prescription' },
      { amount: 89.99, merchant: 'Amazon', category: 'Shopping', date: `${ym}-13`, notes: 'Office supplies & wireless mouse' },
      { amount: 16.50, merchant: 'Starbucks', category: 'Food & Dining', date: `${ym}-15`, notes: 'Coffee meeting' },
      { amount: 40.00, merchant: 'City Barber Shop', category: 'Personal Care', date: `${ym}-17`, notes: 'Haircut and styling' },
      { amount: 15.25, merchant: 'Starbucks', category: 'Food & Dining', date: `${ym}-19`, notes: 'Cold brew and snack' },
      { amount: 72.80, merchant: "Trader Joe's", category: 'Food & Dining', date: `${ym}-21`, notes: 'Groceries and snacks' },
      { amount: 13.99, merchant: 'Spotify', category: 'Entertainment', date: `${ym}-22`, notes: 'Music premium plan' }
    ];

    for (const exp of sampleExpenses) {
      this.expenses.push({
        id: crypto.randomUUID(),
        user_id: demoUserId,
        amount: Number(exp.amount),
        merchant: exp.merchant,
        category: exp.category,
        expense_date: exp.date,
        notes: exp.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    this.budgets.push({
      id: crypto.randomUUID(),
      user_id: demoUserId,
      monthly_income: 3000.00,
      savings_target_percentage: 20,
      fixed_bills: [
        { id: '1', name: 'House Rent', amount: 1250.00, category: 'Housing' },
        { id: '2', name: 'Metro Electric Utility', amount: 120.00, category: 'Utilities' },
        { id: '3', name: 'Mobile Recharge', amount: 50.00, category: 'Utilities' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async query(text, params = []) {
    // Normalize whitespace for reliable SQL pattern matching
    const sql = text.replace(/\s+/g, ' ').trim();

    // Transactions support
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
      return { rows: [], rowCount: 0 };
    }

    // 1. Check user exists by email
    if (sql.includes('SELECT id FROM users WHERE email = $1')) {
      const user = this.users.find((u) => u.email.toLowerCase() === params[0].toLowerCase());
      return { rows: user ? [{ id: user.id }] : [], rowCount: user ? 1 : 0 };
    }

    // 2. Insert user
    if (sql.startsWith('INSERT INTO users')) {
      const id = crypto.randomUUID();
      const [name, email, password_hash] = params;
      const user = {
        id,
        name,
        email,
        password_hash,
        created_at: new Date().toISOString(),
      };
      this.users.push(user);
      this.saveToDisk();
      return { rows: [{ id: user.id, name: user.name, email: user.email, created_at: user.created_at }], rowCount: 1 };
    }

    // 3. Select user by email for login
    if (sql.startsWith('SELECT') && sql.includes('FROM users WHERE email = $1')) {
      const user = this.users.find((u) => u.email.toLowerCase() === params[0].toLowerCase());
      return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
    }

    // 4. Select user by id for getMe
    if (sql.startsWith('SELECT') && sql.includes('FROM users WHERE id = $1')) {
      const user = this.users.find((u) => u.id === params[0]);
      return {
        rows: user ? [{ id: user.id, name: user.name, email: user.email, created_at: user.created_at }] : [],
        rowCount: user ? 1 : 0,
      };
    }

    // 5. Insert expense
    if (sql.startsWith('INSERT INTO expenses')) {
      const id = crypto.randomUUID();
      const [user_id, amount, merchant, category, expense_date, notes] = params;
      const expense = {
        id,
        user_id,
        amount: Number(amount),
        merchant,
        category,
        expense_date,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.expenses.push(expense);
      this.saveToDisk();
      return { rows: [expense], rowCount: 1 };
    }

    // 6. Delete expense (check before SELECT to prevent substring match)
    if (sql.startsWith('DELETE FROM expenses')) {
      const [id, user_id] = params;
      const initialLength = this.expenses.length;
      this.expenses = this.expenses.filter((e) => !(e.id === id && e.user_id === user_id));
      const deletedCount = initialLength - this.expenses.length;
      if (deletedCount > 0) {
        this.saveToDisk();
      }
      return { rows: [], rowCount: deletedCount };
    }

    // 7. Select single expense by id and user_id
    if (sql.startsWith('SELECT') && sql.includes('FROM expenses WHERE id = $1 AND user_id = $2')) {
      const [id, user_id] = params;
      const expense = this.expenses.find((e) => e.id === id && e.user_id === user_id);
      return { rows: expense ? [{ ...expense }] : [], rowCount: expense ? 1 : 0 };
    }

    // 8. Summary query - Total spent
    if (sql.includes('COALESCE(SUM(amount), 0)::float AS total_spent')) {
      const [userId, month] = params;
      const filtered = this.expenses.filter((e) => e.user_id === userId && e.expense_date.startsWith(month));
      const total = filtered.reduce((acc, curr) => acc + curr.amount, 0);
      return { rows: [{ total_spent: total, transaction_count: filtered.length }], rowCount: 1 };
    }

    // 9. Summary query - Category breakdown
    if (sql.includes('GROUP BY category')) {
      const [userId, month] = params;
      const filtered = this.expenses.filter((e) => e.user_id === userId && e.expense_date.startsWith(month));
      const map = {};
      filtered.forEach((e) => {
        if (!map[e.category]) map[e.category] = { total_spent: 0, count: 0 };
        map[e.category].total_spent += e.amount;
        map[e.category].count += 1;
      });
      const rows = Object.entries(map).map(([category, val]) => ({
        category,
        total_spent: val.total_spent,
        count: val.count,
      }));
      rows.sort((a, b) => b.total_spent - a.total_spent);
      return { rows, rowCount: rows.length };
    }

    // 10. Recent 5 expenses
    if (sql.includes('LIMIT 5')) {
      const userId = params[0];
      const results = this.expenses.filter((e) => e.user_id === userId);
      results.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
      return { rows: results.slice(0, 5), rowCount: Math.min(results.length, 5) };
    }

    // 11. Select expenses for a user (with optional filters)
    if (sql.startsWith('SELECT') && sql.includes('FROM expenses WHERE user_id = $1')) {
      const userId = params[0];
      let results = this.expenses.filter((e) => e.user_id === userId);

      if (sql.includes("AND TO_CHAR(expense_date, 'YYYY-MM-DD') =")) {
        const dateParam = params.find((p, idx) => idx > 0 && typeof p === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p));
        if (dateParam) {
          results = results.filter((e) => e.expense_date === dateParam);
        }
      } else if (sql.includes('AND expense_date >=')) {
        const dates = params.filter((p, idx) => idx > 0 && typeof p === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p));
        if (dates.length >= 2) {
          results = results.filter((e) => e.expense_date >= dates[0] && e.expense_date <= dates[1]);
        } else if (dates.length === 1) {
          if (sql.includes('AND expense_date <=')) {
            results = results.filter((e) => e.expense_date <= dates[0]);
          } else {
            results = results.filter((e) => e.expense_date >= dates[0]);
          }
        }
      } else if (sql.includes("AND TO_CHAR(expense_date, 'YYYY-MM') =")) {
        const monthParam = params.find((p, idx) => idx > 0 && typeof p === 'string' && /^\d{4}-\d{2}$/.test(p));
        if (monthParam) {
          results = results.filter((e) => e.expense_date.startsWith(monthParam));
        }
      }

      if (sql.includes('AND category =')) {
        const catIndex = params.findIndex((p, idx) => idx > 0 && ['Housing', 'Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Personal Care', 'Miscellaneous'].includes(p));
        if (catIndex > -1) {
          results = results.filter((e) => e.category === params[catIndex]);
        }
      }

      if (sql.includes('AND (merchant ILIKE')) {
        const searchParam = params.find((p) => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
        if (searchParam) {
          const raw = searchParam.slice(1, -1).toLowerCase();
          results = results.filter((e) => e.merchant.toLowerCase().includes(raw) || (e.notes && e.notes.toLowerCase().includes(raw)));
        }
      }

      // Sort by date desc
      results.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
      return { rows: results, rowCount: results.length };
    }

    // 12. Update expense
    if (sql.startsWith('UPDATE expenses')) {
      const [id, user_id] = params;
      const expense = this.expenses.find((e) => e.id === id && e.user_id === user_id);
      if (!expense) {
        return { rows: [], rowCount: 0 };
      }

      for (let i = 2; i < params.length; i++) {
        const val = params[i];
        if (typeof val === 'number') expense.amount = val;
        else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) expense.expense_date = val;
        else if (typeof val === 'string' && ['Housing', 'Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Personal Care', 'Miscellaneous'].includes(val)) expense.category = val;
        else if (typeof val === 'string' && val.length > 0) expense.merchant = val;
      }
      expense.updated_at = new Date().toISOString();
      this.saveToDisk();
      return { rows: [{ ...expense }], rowCount: 1 };
    }

    // 13. AI insights select
    if (sql.startsWith('SELECT') && sql.includes('FROM ai_insights WHERE user_id = $1')) {
      const userId = params[0];
      const monthParam = params[1];
      let results = this.ai_insights.filter((i) => i.user_id === userId);
      if (monthParam) {
        results = results.filter((i) => i.report_month === monthParam);
      }
      return { rows: results, rowCount: results.length };
    }

    // 14. AI insights upsert
    if (sql.startsWith('INSERT INTO ai_insights')) {
      const [user_id, report_month, insight_data] = params;
      const parsedData = typeof insight_data === 'string' ? JSON.parse(insight_data) : insight_data;
      const existingIdx = this.ai_insights.findIndex((i) => i.user_id === user_id && i.report_month === report_month);
      const record = {
        id: crypto.randomUUID(),
        user_id,
        report_month,
        insight_data: parsedData,
        created_at: new Date().toISOString(),
      };
      if (existingIdx > -1) {
        this.ai_insights[existingIdx] = record;
      } else {
        this.ai_insights.push(record);
      }
      this.saveToDisk();
      return { rows: [record], rowCount: 1 };
    }

    // 15. Budgets select
    if (sql.includes('FROM budgets WHERE user_id = $1')) {
      const budget = this.budgets.find((b) => b.user_id === params[0]);
      return { rows: budget ? [{ ...budget }] : [], rowCount: budget ? 1 : 0 };
    }

    // 16. Budgets upsert
    if (sql.startsWith('INSERT INTO budgets')) {
      const [user_id, monthly_income, savings_target_percentage, fixed_bills] = params;
      const parsedBills = typeof fixed_bills === 'string' ? JSON.parse(fixed_bills) : fixed_bills;
      const existingIdx = this.budgets.findIndex((b) => b.user_id === user_id);
      const record = {
        id: existingIdx > -1 ? this.budgets[existingIdx].id : crypto.randomUUID(),
        user_id,
        monthly_income: Number(monthly_income),
        savings_target_percentage: Number(savings_target_percentage),
        fixed_bills: parsedBills || [],
        created_at: existingIdx > -1 ? this.budgets[existingIdx].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (existingIdx > -1) {
        this.budgets[existingIdx] = record;
      } else {
        this.budgets.push(record);
      }
      this.saveToDisk();
      return { rows: [record], rowCount: 1 };
    }

    // Health check
    if (sql.includes('SELECT 1 AS healthy')) {
      return { rows: [{ healthy: 1 }], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  }
}

export const mockDb = new MockDatabase();

export const createMockPool = () => ({
  query: (text, params) => mockDb.query(text, params),
  connect: async () => ({
    query: (text, params) => mockDb.query(text, params),
    release: () => {},
  }),
});

export default mockDb;
