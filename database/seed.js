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

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const ym = `${currentYear}-${currentMonth}`;

    // 1. Configure Budget for Demo User
    await client.query(
      `INSERT INTO budgets (user_id, monthly_income, savings_target_percentage, fixed_bills)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         monthly_income = EXCLUDED.monthly_income,
         savings_target_percentage = EXCLUDED.savings_target_percentage,
         fixed_bills = EXCLUDED.fixed_bills`,
      [
        userId,
        85000.00,
        20.00,
        JSON.stringify([
          { id: 'bill-1', name: 'Apartment Rent', amount: 22000, category: 'Housing' },
          { id: 'bill-2', name: 'Electricity & Gas Bill', amount: 3500, category: 'Utilities' },
          { id: 'bill-3', name: 'Fiber Internet & Mobile', amount: 1500, category: 'Utilities' }
        ])
      ]
    );
    console.log('🎯 Seeded Monthly Budget: ₹85,000 Income, 20% Savings, ₹27,000 Fixed Bills');

    // 2. Clear previous demo expenses and insert fresh realistic transactions
    await client.query('DELETE FROM expenses WHERE user_id = $1', [userId]);

    const sampleExpenses = [
      { amount: 22000.00, merchant: 'Prestige Apartments', category: 'Housing', date: `${ym}-01`, notes: 'Monthly Rent Payment' },
      { amount: 3250.00, merchant: 'Nature Basket Supermarket', category: 'Food & Dining', date: `${ym}-03`, notes: 'Weekly organic groceries' },
      { amount: 480.00, merchant: 'Blue Tokai Coffee', category: 'Food & Dining', date: `${ym}-04`, notes: 'Pour-over coffee & breakfast bagel' },
      { amount: 2500.00, merchant: 'Indian Oil Petrol Pump', category: 'Transportation', date: `${ym}-05`, notes: 'Vehicle fuel refill' },
      { amount: 3500.00, merchant: 'State Electricity Board', category: 'Utilities', date: `${ym}-07`, notes: 'Monthly electric power' },
      { amount: 899.00, merchant: 'Netflix 4K Ultra', category: 'Entertainment', date: `${ym}-09`, notes: 'Monthly entertainment streaming' },
      { amount: 1450.00, merchant: 'Apollo Pharmacy', category: 'Healthcare', date: `${ym}-11`, notes: 'Health supplements and eye drops' },
      { amount: 4299.00, merchant: 'Amazon India', category: 'Shopping', date: `${ym}-13`, notes: 'Ergonomic keyboard and desk mat' },
      { amount: 650.00, merchant: 'Starbucks Reserve', category: 'Food & Dining', date: `${ym}-15`, notes: 'Cold brew and sandwich' },
      { amount: 850.00, merchant: 'Toni & Guy Salon', category: 'Personal Care', date: `${ym}-16`, notes: 'Haircut and grooming' },
      { amount: 720.00, merchant: 'Swiggy Gourmet', category: 'Food & Dining', date: `${ym}-18`, notes: 'Dinner delivery with friends' },
      { amount: 1500.00, merchant: 'Airtel Fiber Broadband', category: 'Utilities', date: `${ym}-19`, notes: 'High-speed gigabit internet' },
      { amount: 650.00, merchant: 'PVR IMAX Cinemas', category: 'Entertainment', date: `${ym}-21`, notes: 'Movie ticket & popcorn' },
      { amount: 1850.00, merchant: 'Uber Premier', category: 'Transportation', date: `${ym}-22`, notes: 'Airport commute' },
      { amount: 490.00, merchant: 'Third Wave Coffee', category: 'Food & Dining', date: `${ym}-24`, notes: 'Afternoon client meeting' }
    ];

    for (const exp of sampleExpenses) {
      await client.query(
        `INSERT INTO expenses (user_id, amount, merchant, category, expense_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, exp.amount, exp.merchant, exp.category, exp.date, exp.notes]
      );
    }
    console.log(`💳 Inserted ${sampleExpenses.length} sample expenses for ${ym}`);

    // 3. Seed Realistic AI Insight Report
    const insightData = {
      total_analyzed_amount: 44638.00,
      top_spending_category: "Housing",
      category_breakdown: [
        { category: "Housing", total: 22000.00, percentage: 49.3 },
        { category: "Food & Dining", total: 5590.00, percentage: 12.5 },
        { category: "Utilities", total: 5000.00, percentage: 11.2 },
        { category: "Shopping", total: 4299.00, percentage: 9.6 },
        { category: "Transportation", total: 4350.00, percentage: 9.7 },
        { category: "Entertainment", total: 1549.00, percentage: 3.5 },
        { category: "Healthcare", total: 1450.00, percentage: 3.2 }
      ],
      unnecessary_spending_identified: "Detected daily micro-purchases in premium artisanal cafes totaling ₹2,270 this month, alongside discretionary rideshare surges. Fixed obligations remain disciplined.",
      actionable_tips: [
        "Cap daily cafe visits to 2 times a week to immediately recover ₹1,800 monthly without affecting your routine.",
        "Your current Safe Daily Limit is ₹1,350/day. Maintaining this pacing will preserve your ₹17,000 monthly savings goal.",
        "Consolidate multiple short delivery orders into weekly scheduled grocery runs to save ₹650 on convenience surcharges."
      ]
    };

    await client.query(
      `INSERT INTO ai_insights (user_id, report_month, insight_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, report_month) DO UPDATE SET
         insight_data = EXCLUDED.insight_data`,
      [userId, ym, JSON.stringify(insightData)]
    );
    console.log(`🤖 Seeded AI Insights report for ${ym}`);

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
