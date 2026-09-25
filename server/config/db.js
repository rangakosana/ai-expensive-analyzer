import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { createMockPool, mockDb } from './mockDb.js';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (connectionString && !connectionString.includes('username:password@host')) {
  const isSSLRequired =
    process.env.NODE_ENV === 'production' ||
    connectionString.includes('sslmode=require') ||
    connectionString.includes('replit') ||
    connectionString.includes('supabase') ||
    connectionString.includes('neon.tech');

  pool = new Pool({
    connectionString,
    ssl: isSSLRequired ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
} else {
  console.warn('💡 DATABASE_URL not set or placeholder. Initializing local database (persisted to database/local-db.json).');
  console.warn('🔑 Demo login: demo@example.com / Password123!');
  pool = createMockPool();
  mockDb.init();
}

/**
 * Executes a parameterized SQL query
 * @param {string} text - SQL query text
 * @param {Array} [params] - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params) => {
  if (!pool) {
    throw new Error('Database connection pool is not initialized. Please set DATABASE_URL.');
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.trim().slice(0, 80), duration, rows: res.rowCount });
  }
  return res;
};

/**
 * Gets a dedicated client from the pool for transactions
 */
export const getClient = async () => {
  if (!pool) {
    throw new Error('Database connection pool is not initialized. Please set DATABASE_URL.');
  }
  return await pool.connect();
};

/**
 * Health check for database connection
 */
export const checkHealth = async () => {
  if (!pool) return false;
  try {
    const res = await pool.query('SELECT 1 AS healthy');
    return res.rows[0].healthy === 1;
  } catch (err) {
    console.error('Database health check failed:', err.message);
    return false;
  }
};

/**
 * Overrides the pool (useful for test suites or mocking)
 */
export const setPool = (customPool) => {
  pool = customPool;
};

export default {
  query,
  getClient,
  checkHealth,
  setPool,
  get pool() {
    return pool;
  },
};
