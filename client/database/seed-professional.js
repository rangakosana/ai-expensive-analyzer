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
  ssl: { rejectUnauthorized: false },
});

async function seedProfessional() {
  const client = await pool.connect();
  try {
    console.log('🌱 Creating Professional Showcase Account...');
    await client.query('BEGIN');

    // 1. Create or Update "Arjun Sharma"
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET 
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash
       RETURNING id, name, email, role`,
      ['Arjun Sharma', 'arjun.sharma@techcorp.io', passwordHash, 'user']
    );

    const userId = userRes.rows[0].id;
    console.log(`👤 Professional User ready: ${userRes.rows[0].name} (${userRes.rows[0].email}) ID: ${userId}`);

    // 2. Set Up Professional Budget
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
        20.00, // 20% = ₹17,000 savings
        JSON.stringify([
          { id: 'bill-1', name: 'Apartment Rent (Indiranagar)', amount: 22000, category: 'Housing' },
          { id: 'bill-2', name: 'Power & Water Utilities', amount: 3500, category: 'Utilities' },
          { id: 'bill-3', name: 'Airtel Fiber 1Gbps', amount: 1500, category: 'Utilities' },
        ])
      ]
    );
    console.log('💼 Seeded Executive Budget: ₹85,000 Income | ₹17,000 Target Savings | ₹27,000 Fixed Bills');

    // 3. Clear existing expenses for Arjun Sharma
    await client.query('DELETE FROM expenses WHERE user_id = $1', [userId]);

    // 4. Spread Multi-Month Expenses (July, August, September 2026) - Strictly Flexible Everyday Spending
    const multiMonthExpenses = [
      // === July 2026 (Month 1) ===
      { amount: 3450, merchant: 'Nature Basket Groceries', category: 'Food & Dining', date: '2026-07-04', notes: 'Monthly grocery staples' },
      { amount: 2400, merchant: 'Indian Oil Petrol', category: 'Transportation', date: '2026-07-07', notes: 'Commute fuel' },
      { amount: 650, merchant: 'Starbucks Coffee', category: 'Food & Dining', date: '2026-07-12', notes: 'Cold brew & bagel' },
      { amount: 1450, merchant: 'Apollo Pharmacy', category: 'Healthcare', date: '2026-07-15', notes: 'Vitamins & first-aid' },
      { amount: 899, merchant: 'Netflix Premium', category: 'Entertainment', date: '2026-07-18', notes: 'Streaming plan' },
      { amount: 2800, merchant: 'Zara Men', category: 'Shopping', date: '2026-07-22', notes: 'Office casual shirts' },
      { amount: 750, merchant: 'Third Wave Coffee', category: 'Food & Dining', date: '2026-07-26', notes: 'Team catch-up' },

      // === August 2026 (Month 2) ===
      { amount: 3800, merchant: 'Food Hall Gourmet', category: 'Food & Dining', date: '2026-08-03', notes: 'Fresh produce & organic dairy' },
      { amount: 2600, merchant: 'Shell Gas Station', category: 'Transportation', date: '2026-08-08', notes: 'Fuel refill' },
      { amount: 3200, merchant: 'Amazon Tech', category: 'Shopping', date: '2026-08-14', notes: 'Ergonomic wrist rest & desk lamp' },
      { amount: 850, merchant: 'Blue Tokai Cafe', category: 'Food & Dining', date: '2026-08-17', notes: 'Coffee meetings' },
      { amount: 950, merchant: 'Toni & Guy Grooming', category: 'Personal Care', date: '2026-08-20', notes: 'Haircut and styling' },
      { amount: 720, merchant: 'PVR Gold Class', category: 'Entertainment', date: '2026-08-24', notes: 'Cinema ticket' },
      { amount: 1850, merchant: 'Uber Premier', category: 'Transportation', date: '2026-08-28', notes: 'Airport roundtrip' },

      // === September 2026 (Current Month - Well Paced & Healthy!) ===
      { amount: 2850, merchant: 'Nature Basket Supermarket', category: 'Food & Dining', date: '2026-09-03', notes: 'Weekly fresh groceries' },
      { amount: 520, merchant: 'Blue Tokai Roasters', category: 'Food & Dining', date: '2026-09-04', notes: 'Pour-over coffee & breakfast' },
      { amount: 2200, merchant: 'Indian Oil Petrol', category: 'Transportation', date: '2026-09-06', notes: 'Full tank fuel' },
      { amount: 899, merchant: 'Netflix 4K Ultra', category: 'Entertainment', date: '2026-09-10', notes: 'Monthly streaming service' },
      { amount: 1250, merchant: 'Apollo Pharmacy', category: 'Healthcare', date: '2026-09-12', notes: 'Routine health supplements' },
      { amount: 3499, merchant: 'Amazon India', category: 'Shopping', date: '2026-09-14', notes: 'Noise-canceling earphones' },
      { amount: 680, merchant: 'Starbucks Reserve', category: 'Food & Dining', date: '2026-09-16', notes: 'Cold brew and croissant' },
      { amount: 850, merchant: 'Truefitt & Hill Grooming', category: 'Personal Care', date: '2026-09-18', notes: 'Professional haircut' },
      { amount: 1200, merchant: 'Swiggy Gourmet Dinner', category: 'Food & Dining', date: '2026-09-22', notes: 'Weekend dinner with colleagues' },
      { amount: 1650, merchant: 'Uber Premier', category: 'Transportation', date: '2026-09-24', notes: 'Client meeting transit' },
      { amount: 2450, merchant: 'Fabindia Lifestyle', category: 'Shopping', date: '2026-09-26', notes: 'Living room decor' },
      { amount: 450, merchant: 'Third Wave Coffee', category: 'Food & Dining', date: '2026-09-27', notes: 'Afternoon coffee' },
    ];

    for (const exp of multiMonthExpenses) {
      await client.query(
        `INSERT INTO expenses (user_id, amount, merchant, category, expense_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, exp.amount, exp.merchant, exp.category, exp.date, exp.notes]
      );
    }
    console.log(`💳 Seeded ${multiMonthExpenses.length} flexible expenses across July, August, and September 2026!`);

    // 5. Seed Multi-Month AI Reports (strictly flexible everyday spending)
    const reports = [
      {
        month: '2026-07',
        data: {
          total_analyzed_amount: 12399.00,
          top_spending_category: "Food & Dining",
          category_breakdown: [
            { category: "Food & Dining", total: 4850, percentage: 39.1 },
            { category: "Shopping", total: 2800, percentage: 22.6 },
            { category: "Transportation", total: 2400, percentage: 19.4 },
            { category: "Healthcare", total: 1450, percentage: 11.7 },
            { category: "Entertainment", total: 899, percentage: 7.3 }
          ],
          unnecessary_spending_identified: "July maintained disciplined everyday habits. Coffee shop visits totaled ₹1,400, well within your flexible ₹41k allowance.",
          actionable_tips: [
            "Maintain your ₹17,000 monthly savings target by locking savings immediately on salary day.",
            "Consolidate retail shopping into planned quarterly purchases.",
            "Your Safe Daily Limit for uncommitted spending was healthy at ₹1,550/day."
          ]
        }
      },
      {
        month: '2026-08',
        data: {
          total_analyzed_amount: 13970.00,
          top_spending_category: "Food & Dining",
          category_breakdown: [
            { category: "Food & Dining", total: 4650, percentage: 33.3 },
            { category: "Transportation", total: 4450, percentage: 31.9 },
            { category: "Shopping", total: 3200, percentage: 22.9 },
            { category: "Personal Care", total: 950, percentage: 6.8 },
            { category: "Entertainment", total: 720, percentage: 5.2 }
          ],
          unnecessary_spending_identified: "Transportation costs experienced surge pricing on airport routes (₹1,850). Shopping desk upgrade was well-timed within discretionary budget.",
          actionable_tips: [
            "Schedule airport transfers in advance to prevent on-demand rideshare surge premiums.",
            "Discretionary spending remained strictly below your ₹41,000 ceiling, saving an extra ₹27,030.",
            "Savings target of 20% (₹17,000) was successfully preserved."
          ]
        }
      },
      {
        month: '2026-09',
        data: {
          total_analyzed_amount: 18498.00,
          top_spending_category: "Shopping",
          category_breakdown: [
            { category: "Shopping", total: 5949, percentage: 32.2 },
            { category: "Food & Dining", total: 5700, percentage: 30.8 },
            { category: "Transportation", total: 3850, percentage: 20.8 },
            { category: "Healthcare", total: 1250, percentage: 6.8 },
            { category: "Entertainment", total: 899, percentage: 4.9 },
            { category: "Personal Care", total: 850, percentage: 4.6 }
          ],
          unnecessary_spending_identified: "Detected high-frequency artisanal coffee runs (₹1,650 total). Flexible spending cushion remains strong with ₹22,502 unspent out of your ₹41k budget.",
          actionable_tips: [
            "Your Safe Daily Limit is ₹11,250/day for the rest of September—you are on track to exceed your ₹17,000 savings target with bonus savings!",
            "Cap mid-day cafe visits to twice a week to preserve an extra ₹1,400 with zero impact on lifestyle.",
            "All fixed bills (Rent ₹22k, Utilities ₹5k) are fully protected and excluded from everyday spending."
          ]
        }
      }
    ];

    for (const rep of reports) {
      await client.query(
        `INSERT INTO ai_insights (user_id, report_month, insight_data)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, report_month) DO UPDATE SET
           insight_data = EXCLUDED.insight_data`,
        [userId, rep.month, JSON.stringify(rep.data)]
      );
    }
    console.log('🤖 Seeded 3 Months of Historical AI Insights (July, August, September 2026)!');

    await client.query('COMMIT');
    console.log('====================================================');
    console.log('🎉 Professional Showcase Account Ready!');
    console.log('👤 Name:     Arjun Sharma');
    console.log('📧 Email:    arjun.sharma@techcorp.io');
    console.log('🔑 Password: Password123!');
    console.log('💰 Salary:   ₹85,000 / month');
    console.log('📅 History:  July 2026, August 2026, September 2026');
    console.log('====================================================');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedProfessional();
