import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function resetRealAccounts() {
  const client = await pool.connect();
  try {
    console.log('🧹 Clearing seeded recording data from all real user accounts...');
    await client.query('BEGIN');

    // We keep 'arjun.sharma@techcorp.io' as the showcase/demo persona, reset all real user accounts
    const targetUsers = await client.query(`
      SELECT id, name, email 
      FROM users 
      WHERE email NOT IN ('arjun.sharma@techcorp.io')
    `);

    console.log(`Found ${targetUsers.rows.length} real accounts to reset to zero state:`);
    for (const u of targetUsers.rows) {
      console.log(` - ${u.name} (${u.email}) [${u.id}]`);
      
      // 1. Delete all expenses
      const delExp = await client.query('DELETE FROM expenses WHERE user_id = $1', [u.id]);
      
      // 2. Delete budget entry so user starts fresh with unconfigured budget
      const delBud = await client.query('DELETE FROM budgets WHERE user_id = $1', [u.id]);
      
      // 3. Delete AI insights
      const delIns = await client.query('DELETE FROM ai_insights WHERE user_id = $1', [u.id]);

      console.log(`   Cleared: ${delExp.rowCount} expenses, ${delBud.rowCount} budgets, ${delIns.rowCount} insights.`);
    }

    await client.query('COMMIT');
    console.log('✅ All real user accounts have been successfully reset to zero state (0 expenses, 0 budget).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting accounts:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

resetRealAccounts();
