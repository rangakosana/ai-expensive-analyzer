import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../config/db.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { getJwtSecret } from '../middleware/auth.middleware.js';

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
export const REFRESH_CONCURRENCY_WINDOW_MS = 15000;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_MAX_AGE_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  path: '/',
});

export const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateAccessToken = (user) => {
  const secret = getJwtSecret();
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
    secret,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

export const createAndStoreRefreshToken = async (userId) => {
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS).toISOString();
  const id = crypto.randomUUID();

  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, userId, tokenHash, expiresAt]
  );

  return rawRefreshToken;
};

export const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password with 10 salt rounds
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into PostgreSQL
    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, 'user']
    );

    const newUser = insertResult.rows[0];

    // Issue short-lived access token
    const token = generateAccessToken(newUser);

    // Issue and persist refresh token
    const refreshToken = await createAndStoreRefreshToken(newUser.id);
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      refreshToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || 'user',
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Fetch user from PostgreSQL
    const userResult = await query(
      `SELECT id, name, email, role, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    // Compare password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Issue short-lived access token
    const token = generateAccessToken(user);

    // Issue and persist refresh token
    const refreshToken = await createAndStoreRefreshToken(user.id);
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.status(200).json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  let client;
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      return res.status(401).json({ error: 'No refresh token provided. Please log in.' });
    }

    const tokenHash = hashToken(rawRefreshToken);

    // Acquire dedicated client from connection pool for atomic transaction
    client = await getClient();
    await client.query('BEGIN');

    // Acquire row-level lock on the refresh token to serialize concurrent requests
    const tokenResult = await client.query(
      `SELECT id, user_id, expires_at, revoked_at, replaced_by_token_hash
       FROM refresh_tokens
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Invalid refresh token. Please log in.' });
    }

    const currentRecord = tokenResult.rows[0];

    // Check if token has already been revoked or replaced
    if (currentRecord.revoked_at) {
      const revokedTimestamp = new Date(currentRecord.revoked_at).getTime();
      const elapsedSinceRevocation = Date.now() - revokedTimestamp;

      // CONCURRENCY TOLERANCE POLICY:
      // If the token was rotated legitimately within the concurrency window (<= 15s)
      // AND has a valid replacement token tracking pointer (replaced_by_token_hash),
      // we check if the replacement token is active. This safely accommodates multi-tab
      // requests that dispatched before the browser cookie jar was updated.
      if (
        currentRecord.replaced_by_token_hash &&
        elapsedSinceRevocation <= REFRESH_CONCURRENCY_WINDOW_MS
      ) {
        const replacementResult = await client.query(
          `SELECT id, user_id, expires_at, revoked_at
           FROM refresh_tokens
           WHERE token_hash = $1`,
          [currentRecord.replaced_by_token_hash]
        );

        if (
          replacementResult.rows.length > 0 &&
          !replacementResult.rows[0].revoked_at &&
          new Date(replacementResult.rows[0].expires_at) > new Date()
        ) {
          // Legitimate concurrent request: return active session without re-rotating or revoking
          const userResult = await client.query(
            `SELECT id, name, email, role, created_at
             FROM users
             WHERE id = $1`,
            [currentRecord.user_id]
          );

          await client.query('COMMIT');

          if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User profile not found.' });
          }

          const user = userResult.rows[0];
          const newAccessToken = generateAccessToken(user);

          // Return 200 with new access token; do not overwrite cookie because the winning tab
          // already set the valid replacement refresh token in the browser.
          return res.status(200).json({
            message: 'Token refreshed successfully',
            token: newAccessToken,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role || 'user',
              created_at: user.created_at,
            },
          });
        }
      }

      // STRICT REPLAY DETECTION:
      // Token was either:
      // 1. Presented outside the 15s concurrency window (replayed/stolen token)
      // 2. Revoked via logout (replaced_by_token_hash is null)
      // 3. Or its replacement token has been revoked
      // Revoke all active sessions for this user immediately!
      await client.query(
        `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [currentRecord.user_id]
      );
      await client.query('COMMIT');
      res.clearCookie('refreshToken', getClearCookieOptions());
      return res.status(403).json({
        error: 'Security alert: Refresh token reuse detected. All sessions revoked. Please log in again.',
      });
    }

    // Check expiration for active tokens
    if (new Date(currentRecord.expires_at) <= new Date()) {
      await client.query(
        `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [currentRecord.id]
      );
      await client.query('COMMIT');
      res.clearCookie('refreshToken', getClearCookieOptions());
      return res.status(401).json({ error: 'Refresh token has expired. Please log in again.' });
    }

    // Fetch user details
    const userResult = await client.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [currentRecord.user_id]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = userResult.rows[0];

    // Rotate refresh token: generate new token and replace old
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS).toISOString();
    const newRecordId = crypto.randomUUID();

    // Mark current token as revoked and track replacement
    await client.query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP, replaced_by_token_hash = $1
       WHERE id = $2`,
      [newTokenHash, currentRecord.id]
    );

    // Insert new rotated refresh token
    await client.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [newRecordId, user.id, newTokenHash, newExpiresAt]
    );

    await client.query('COMMIT');

    // Issue fresh access token
    const newAccessToken = generateAccessToken(user);

    res.cookie('refreshToken', newRawRefreshToken, getCookieOptions());

    return res.status(200).json({
      message: 'Token refreshed successfully',
      token: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        created_at: user.created_at,
      },
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        // Ignore rollback error on closed connection
      }
    }
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
};

export const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      const tokenHash = hashToken(rawRefreshToken);
      await query(
        `UPDATE refresh_tokens
         SET revoked_at = CURRENT_TIMESTAMP
         WHERE token_hash = $1 AND revoked_at IS NULL`,
        [tokenHash]
      );
    }

    res.clearCookie('refreshToken', getClearCookieOptions());

    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userResult = await query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = userResult.rows[0];

    // Issue refreshed JWT with up-to-date role so client session stays updated
    const token = generateAccessToken(user);

    res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};
