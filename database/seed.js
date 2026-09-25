import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require') || connectionString.includes('replit')
    ? { rejectUnauthorized: false }
    : false,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seed...');
    await client.query('BEGIN');

    // Create demo user
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email`,
      ['Demo User', 'demo@example.com', passwordHash]
    );

    const userId = userRes.rows[0].id;
    console.log(`👤 Demo user created/updated with ID: ${userId} (demo@example.com / Password123!)`);

    // Sample expenses for current month
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const ym = `${currentYear}-${currentMonth}`;

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
      { amount: 72.80, merchant: 'Trader Joe\'s', category: 'Food & Dining', date: `${ym}-21`, notes: 'Groceries and snacks' },
      { amount: 13.99, merchant: 'Spotify', category: 'Entertainment', date: `${ym}-22`, notes: 'Music premium plan' }
    ];

    for (const exp of sampleExpenses) {
      await client.query(
        `INSERT INTO expenses (user_id, amount, merchant, category, expense_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, exp.amount, exp.merchant, exp.category, exp.date, exp.notes]
      );
    }

    console.log(`💳 Inserted ${sampleExpenses.length} sample expenses for ${ym}`);
    await client.query('COMMIT');
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
