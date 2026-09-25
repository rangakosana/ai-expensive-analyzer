import request from 'supertest';
import app from '../server.js';
import { setPool } from '../config/db.js';
import { createMockPool } from './mockDb.js';

beforeAll(() => {
  setPool(createMockPool());
});

describe('Server & Health API', () => {
  it('GET /api/health should return 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/nonexistent-route should return 404 with error message', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Route not found');
  });

  it('GET / should serve the React SPA index.html', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!doctype html>');
    expect(res.text).toContain('AI Expense Analyzer');
  });
});
