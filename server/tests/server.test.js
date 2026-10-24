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

describe('CORS Security Hardening', () => {
  it('should allow explicitly approved production origin: https://ai-expensive-analyzer.vercel.app', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://ai-expensive-analyzer.vercel.app');

    expect(res.headers['access-control-allow-origin']).toBe('https://ai-expensive-analyzer.vercel.app');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should allow explicitly approved production origin: https://i-expense-analyzer.vercel.app', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://i-expense-analyzer.vercel.app');

    expect(res.headers['access-control-allow-origin']).toBe('https://i-expense-analyzer.vercel.app');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should allow legitimate localhost development origins', async () => {
    const devOrigins = [
      'http://localhost:5173',
      'http://localhost:5001',
      'http://localhost:5000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5001',
    ];

    for (const origin of devOrigins) {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', origin);

      expect(res.headers['access-control-allow-origin']).toBe(origin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    }
  });

  it('should reject unapproved arbitrary origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://malicious-phishing-site.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should reject blanket vercel.app wildcard subdomains', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://attacker-created-app.vercel.app');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should never reflect arbitrary origins even when CORS_ORIGIN is wildcard "*"', async () => {
    const originalEnv = process.env.CORS_ORIGIN;
    try {
      process.env.CORS_ORIGIN = '*';
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://unauthorized-reflection-probe.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      process.env.CORS_ORIGIN = originalEnv;
    }
  });
});

describe('Environment & Startup Security', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('should fail safely if production startup is missing JWT_SECRET', async () => {
    const { verifyEnvironment } = await import('../server.js');
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    expect(() => {
      verifyEnvironment();
    }).toThrow(/FATAL: JWT_SECRET environment variable is missing or insecure/);
  });

  it('should fail safely if production startup uses development fallback JWT_SECRET', async () => {
    const { verifyEnvironment } = await import('../server.js');
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'fallback_secret_for_development_only';

    expect(() => {
      verifyEnvironment();
    }).toThrow(/FATAL: JWT_SECRET environment variable is missing or insecure/);
  });

  it('should succeed in development or test without throwing', async () => {
    const { verifyEnvironment } = await import('../server.js');
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;

    expect(() => {
      verifyEnvironment();
    }).not.toThrow();
  });
});

describe('Native Cookie Parser Robustness', () => {
  it('should safely handle malformed URI encoded cookie values without crashing', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Cookie', 'malformed_cookie=%99; normal_cookie=hello');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should safely handle quoted cookie values', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Cookie', 'quoted_cookie="my_quoted_value"');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});


