import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function sync() {
  const localDbPath = path.join(__dirname, 'local-db.json');
  if (!fs.existsSync(localDbPath)) {
    console.error('❌ local-db.json not found!');
    process.exit(1);
  }

  const localData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  console.log(`📦 Loaded local-db.json: ${localData.users?.length || 0} users, ${localData.expenses?.length || 0} expenses, ${localData.budgets?.length || 0} budgets`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Sync Users
    const userIdMap = {}; // local user id -> cloud user id

    for (const u of localData.users || []) {
      // Check if user already exists by email
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      let cloudUserId;

      if (existing.rows.length > 0) {
        cloudUserId = existing.rows[0].id;
        // Update password and name to match local
        await client.query(
          'UPDATE users SET name = $1, password_hash = $2 WHERE id = $3',
          [u.name, u.password_hash, cloudUserId]
        );
        console.log(`👤 Updated existing user in cloud: ${u.email} (ID: ${cloudUserId})`);
      } else {
        // Insert with local ID if possible, or generate new
        const insertRes = await client.query(
          `INSERT INTO users (id, name, email, password_hash, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
           RETURNING id`,
          [u.id, u.name, u.email, u.password_hash, u.created_at || new Date().toISOString()]
        );
        cloudUserId = insertRes.rows[0].id;
        console.log(`👤 Inserted new user into cloud: ${u.email} (ID: ${cloudUserId})`);
      }

      userIdMap[u.id] = cloudUserId;
    }

    // 2. Sync Expenses
    let insertedExpenses = 0;
    for (const exp of localData.expenses || []) {
      const cloudUserId = userIdMap[exp.user_id];
      if (!cloudUserId) continue;

      // Check if expense exists
      const existingExp = await client.query('SELECT id FROM expenses WHERE id = $1', [exp.id]);
      if (existingExp.rows.length === 0) {
        await client.query(
          `INSERT INTO expenses (id, user_id, amount, merchant, category, expense_date, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            exp.id,
            cloudUserId,
            exp.amount,
            exp.merchant,
            exp.category,
            exp.expense_date,
            exp.notes || null,
            exp.created_at || new Date().toISOString(),
            exp.updated_at || new Date().toISOString(),
          ]
        );
        insertedExpenses++;
      }
    }
    console.log(`💳 Inserted ${insertedExpenses} new expenses into cloud`);

    // 3. Sync Budgets
    let syncedBudgets = 0;
    for (const b of localData.budgets || []) {
      const cloudUserId = userIdMap[b.user_id];
      if (!cloudUserId) continue;

      await client.query(
        `INSERT INTO budgets (id, user_id, monthly_income, savings_target_percentage, fixed_bills, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
           monthly_income = EXCLUDED.monthly_income,
           savings_target_percentage = EXCLUDED.savings_target_percentage,
           fixed_bills = EXCLUDED.fixed_bills,
           updated_at = EXCLUDED.updated_at`,
        [
          b.id,
          cloudUserId,
          b.monthly_income,
          b.savings_target_percentage,
          JSON.stringify(b.fixed_bills || []),
          b.created_at || new Date().toISOString(),
          b.updated_at || new Date().toISOString(),
        ]
      );
      syncedBudgets++;
    }
    console.log(`📊 Synced ${syncedBudgets} budgets into cloud`);

    // 4. Sync AI Insights
    let syncedInsights = 0;
    for (const ins of localData.ai_insights || []) {
      const cloudUserId = userIdMap[ins.user_id];
      if (!cloudUserId) continue;

      await client.query(
        `INSERT INTO ai_insights (id, user_id, report_month, insight_data, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, report_month) DO UPDATE SET
           insight_data = EXCLUDED.insight_data`,
        [
          ins.id,
          cloudUserId,
          ins.report_month,
          JSON.stringify(ins.insight_data || {}),
          ins.created_at || new Date().toISOString(),
        ]
      );
      syncedInsights++;
    }
    console.log(`🤖 Synced ${syncedInsights} AI insights into cloud`);

    await client.query('COMMIT');
    console.log('🎉 All local data successfully migrated to cloud PostgreSQL database!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Sync failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

sync();
