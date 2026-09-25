import request from 'supertest';
import app from '../server.js';
import { setPool } from '../config/db.js';
import { createMockPool, mockDb } from './mockDb.js';

let user1Token;
let user2Token;

beforeAll(async () => {
  setPool(createMockPool());
});

beforeEach(async () => {
  mockDb.reset();

  // Register User 1
  const u1Res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alice', email: 'alice@example.com', password: 'Password123!' });
  user1Token = u1Res.body.token;

  // Register User 2
  const u2Res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Bob', email: 'bob@example.com', password: 'Password123!' });
  user2Token = u2Res.body.token;
});

describe('Expenses API & Data Isolation (/api/expenses)', () => {
  describe('POST /api/expenses', () => {
    it('should create an expense with valid fields', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 45.5,
          merchant: 'Trader Joe\'s',
          category: 'Food & Dining',
          expense_date: '2026-09-10',
          notes: 'Snacks & produce',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.amount).toBe(45.5);
      expect(res.body.merchant).toBe('Trader Joe\'s');
      expect(res.body.category).toBe('Food & Dining');
      expect(res.body.expense_date).toBe('2026-09-10');
    });

    it('should reject expense with non-positive amount', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: -10,
          merchant: 'Refund',
          category: 'Food & Dining',
          expense_date: '2026-09-10',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => d.field === 'amount')).toBe(true);
    });

    it('should reject expense with invalid category enum', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 25,
          merchant: 'Random Store',
          category: 'InvalidCategoryName',
          expense_date: '2026-09-10',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => d.field === 'category')).toBe(true);
    });
  });

  describe('Row Level Data Isolation (User A vs User B)', () => {
    let aliceExpenseId;
    let bobExpenseId;

    beforeEach(async () => {
      // Alice creates expense
      const res1 = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 100,
          merchant: 'Alice Grocery',
          category: 'Food & Dining',
          expense_date: '2026-09-01',
        });
      aliceExpenseId = res1.body.id;

      // Bob creates expense
      const res2 = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          amount: 200,
          merchant: 'Bob Tech Gadgets',
          category: 'Shopping',
          expense_date: '2026-09-02',
        });
      bobExpenseId = res2.body.id;
    });

    it('Alice should ONLY see her own expenses, not Bob\'s', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(aliceExpenseId);
      expect(res.body[0].merchant).toBe('Alice Grocery');
    });

    it('Bob should ONLY see his own expenses, not Alice\'s', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(bobExpenseId);
      expect(res.body[0].merchant).toBe('Bob Tech Gadgets');
    });

    it('Bob CANNOT read Alice\'s expense by ID (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/expenses/${aliceExpenseId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('Bob CANNOT update Alice\'s expense (returns 404)', async () => {
      const res = await request(app)
        .put(`/api/expenses/${aliceExpenseId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ amount: 999 });

      expect(res.status).toBe(404);
    });

    it('Bob CANNOT delete Alice\'s expense (returns 404)', async () => {
      const res = await request(app)
        .delete(`/api/expenses/${aliceExpenseId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);

      // Verify Alice's expense still exists
      const verifyRes = await request(app)
        .get(`/api/expenses/${aliceExpenseId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(verifyRes.status).toBe(200);
    });

    it('Alice can successfully update her own expense', async () => {
      const res = await request(app)
        .put(`/api/expenses/${aliceExpenseId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 120.5,
          merchant: 'Alice Premium Grocery',
        });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(120.5);
      expect(res.body.merchant).toBe('Alice Premium Grocery');
    });

    it('Alice can successfully delete her own expense', async () => {
      const res = await request(app)
        .delete(`/api/expenses/${aliceExpenseId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(204);

      // Verify it's gone
      const verifyRes = await request(app)
        .get(`/api/expenses/${aliceExpenseId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(verifyRes.status).toBe(404);
    });
  });

  describe('GET /api/expenses/summary', () => {
    it('should calculate correct monthly totals and category breakdown', async () => {
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 50,
          merchant: 'Store 1',
          category: 'Food & Dining',
          expense_date: '2026-09-05',
        });

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 150,
          merchant: 'Store 2',
          category: 'Transportation',
          expense_date: '2026-09-15',
        });

      const res = await request(app)
        .get('/api/expenses/summary?month=2026-09')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.total_spent).toBe(200);
      expect(res.body.transaction_count).toBe(2);
      expect(res.body.top_category).toBe('Transportation');
      expect(res.body.category_breakdown.length).toBe(2);
    });
  });
});
