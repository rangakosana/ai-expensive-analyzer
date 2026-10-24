import request from 'supertest';
import app from '../server.js';
import { setPool } from '../config/db.js';
import { createMockPool, mockDb } from './mockDb.js';
import { hashToken, getCookieOptions, getClearCookieOptions } from '../controllers/auth.controller.js';

beforeAll(() => {
  setPool(createMockPool());
});

beforeEach(() => {
  mockDb.reset();
});

describe('Authentication API (/api/auth)', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.name).toBe('Jane Doe');
      expect(res.body.user.email).toBe('jane@example.com');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject registration with duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'DifferentPass123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('should fail if password is shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => d.field === 'password')).toBe(true);
    });

    it('should fail if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Email',
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => d.field === 'email')).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login Test',
          email: 'login@example.com',
          password: 'CorrectPassword123!',
        });
    });

    it('should log in successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'CorrectPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });

    it('should reject login for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when valid token provided', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Me User',
          email: 'me@example.com',
          password: 'Password123!',
        });

      const token = regRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('me@example.com');
      expect(res.body.user.name).toBe('Me User');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Refresh Test',
          email: 'refresh@example.com',
          password: 'Password123!',
        });
    });

    it('should rotate refresh token and issue new access token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'Password123!',
        });

      const originalRefreshToken = loginRes.body.refreshToken;
      expect(originalRefreshToken).toBeDefined();

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${originalRefreshToken}`]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body).toHaveProperty('token');
      expect(refreshRes.body).toHaveProperty('refreshToken');
      expect(refreshRes.body.refreshToken).not.toBe(originalRefreshToken);
    });

    it('should safely accommodate simultaneous concurrent refresh requests (multi-tab race) without revoking sessions', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'Password123!',
        });

      const originalToken = loginRes.body.refreshToken;

      // Dispatch 2 simultaneous refresh requests holding the exact same initial cookie (multi-tab race)
      const [tab1Res, tab2Res] = await Promise.all([
        request(app)
          .post('/api/auth/refresh')
          .set('Cookie', [`refreshToken=${originalToken}`]),
        request(app)
          .post('/api/auth/refresh')
          .set('Cookie', [`refreshToken=${originalToken}`]),
      ]);

      // Both tabs receive valid access tokens
      expect(tab1Res.status).toBe(200);
      expect(tab2Res.status).toBe(200);
      expect(tab1Res.body).toHaveProperty('token');
      expect(tab2Res.body).toHaveProperty('token');

      // The user's sessions are NOT revoked
      const activeTokens = mockDb.refresh_tokens.filter((t) => !t.revoked_at);
      expect(activeTokens.length).toBeGreaterThan(0);
    });

    it('should detect reuse of a previously rotated refresh token outside the concurrency window and revoke all sessions', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'Password123!',
        });

      const oldRefreshToken = loginRes.body.refreshToken;

      // First refresh succeeds and rotates the token
      const firstRefresh = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${oldRefreshToken}`]);
      expect(firstRefresh.status).toBe(200);

      // Simulate token presented outside the 15-second concurrency window (e.g. 30 seconds ago)
      const oldHash = hashToken(oldRefreshToken);
      const rotatedRecord = mockDb.refresh_tokens.find((t) => t.token_hash === oldHash);
      expect(rotatedRecord).toBeDefined();
      rotatedRecord.revoked_at = new Date(Date.now() - 30000).toISOString();

      // Replay attempt outside the concurrency window triggers reuse detection
      const replayAttempt = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${oldRefreshToken}`]);

      expect(replayAttempt.status).toBe(403);
      expect(replayAttempt.body.error).toContain('reuse detected');

      // Verify all sessions for this user were revoked
      const remainingActiveTokens = mockDb.refresh_tokens.filter(
        (t) => t.user_id === loginRes.body.user.id && !t.revoked_at
      );
      expect(remainingActiveTokens.length).toBe(0);
    });

    it('should return 401 if no refresh token is provided', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('No refresh token provided');
    });

    it('should return 401 if refresh token has expired', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'Password123!',
        });

      const token = loginRes.body.refreshToken;
      const tokenRecord = mockDb.refresh_tokens.find((t) => t.token_hash === hashToken(token));
      expect(tokenRecord).toBeDefined();
      tokenRecord.expires_at = new Date(Date.now() - 1000).toISOString(); // 1s in the past

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${token}`]);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('expired');
    });

    it('should return 401 if refresh token does not exist in database', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=non_existent_random_token_12345']);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout and Cookie Configuration', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Logout Test',
          email: 'logout@example.com',
          password: 'Password123!',
        });
    });

    it('should revoke the session and clear cookie on explicit logout', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'Password123!',
        });

      const refreshToken = loginRes.body.refreshToken;

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toContain('Logged out');

      // Attempting to refresh with the revoked token should now fail immediately with 403
      const subsequentRefresh = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(subsequentRefresh.status).toBe(403);
      expect(subsequentRefresh.body.error).toContain('reuse detected');
    });

    it('should ensure cookie issuance and clearing use matching relevant attributes with sameSite: lax', () => {
      const issueOpts = getCookieOptions();
      const clearOpts = getClearCookieOptions();

      expect(issueOpts.httpOnly).toBe(true);
      expect(clearOpts.httpOnly).toBe(true);
      expect(issueOpts.secure).toBe(clearOpts.secure);
      expect(issueOpts.sameSite).toBe('lax');
      expect(clearOpts.sameSite).toBe('lax');
      expect(issueOpts.path).toBe('/');
      expect(clearOpts.path).toBe('/');
    });
  });

  describe('Security and Protected Endpoints', () => {
    it('should reject requests with invalid or forged access tokens on protected endpoints', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', 'Bearer forged.invalid.token');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid authentication token');
    });

    it('should reject non-admin users from accessing /api/admin/stats with 403', async () => {
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Regular User',
          email: 'regular@example.com',
          password: 'Password123!',
        });

      const userToken = userRes.body.token;

      const adminRes = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(adminRes.status).toBe(403);
      expect(adminRes.body.error).toContain('Administrator privileges required');
    });
  });
});

