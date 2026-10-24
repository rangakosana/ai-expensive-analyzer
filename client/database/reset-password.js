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
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function resetPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error('Usage: node database/reset-password.js <email> <newPassword>');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const res = await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, name, email',
      [passwordHash, email]
    );

    if (res.rowCount === 0) {
      console.log(`❌ User with email ${email} not found.`);
    } else {
      console.log(`✅ Password updated successfully for: ${email}`);
    }
  } catch (err) {
    console.error('❌ Error updating password:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

const email = process.argv[2];
const newPassword = process.argv[3];
resetPassword(email, newPassword);
