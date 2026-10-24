import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

/**
 * Get platform-wide overview statistics
 */
export const getPlatformStats = async (req, res, next) => {
  try {
    const userCountResult = await query('SELECT COUNT(*)::int AS total_users FROM users');
    const expenseStatsResult = await query(
      'SELECT COUNT(*)::int AS total_expenses, COALESCE(SUM(amount), 0)::numeric AS total_volume FROM expenses'
    );
    const budgetCountResult = await query('SELECT COUNT(*)::int AS total_budgets FROM budgets');
    const insightCountResult = await query('SELECT COUNT(*)::int AS total_insights FROM ai_insights');

    // Recent 5 expenses across platform
    const recentExpensesResult = await query(
      `SELECT e.id, e.amount, e.merchant, e.category, e.expense_date, u.name AS user_name, u.email AS user_email
       FROM expenses e
       JOIN users u ON e.user_id = u.id
       ORDER BY e.created_at DESC
       LIMIT 5`
    );

    res.status(200).json({
      totalUsers: userCountResult.rows[0].total_users,
      totalExpenses: expenseStatsResult.rows[0].total_expenses,
      totalVolume: parseFloat(expenseStatsResult.rows[0].total_volume),
      totalBudgets: budgetCountResult.rows[0].total_budgets,
      totalInsights: insightCountResult.rows[0].total_insights,
      recentExpenses: recentExpensesResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with expense count and total spent
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const usersResult = await query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.role, 
         u.created_at,
         COUNT(e.id)::int AS expense_count,
         COALESCE(SUM(e.amount), 0)::numeric AS total_spent,
         b.monthly_income AS budget_income
       FROM users u
       LEFT JOIN expenses e ON e.user_id = u.id
       LEFT JOIN budgets b ON b.user_id = u.id
       GROUP BY u.id, u.name, u.email, u.role, u.created_at, b.monthly_income
       ORDER BY u.created_at DESC`
    );

    const users = usersResult.rows.map((row) => ({
      ...row,
      total_spent: parseFloat(row.total_spent),
      budget_income: row.budget_income ? parseFloat(row.budget_income) : null,
    }));

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all expenses for a specific user
 */
export const getUserExpenses = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check user exists
    const userResult = await query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const expensesResult = await query(
      `SELECT id, amount, merchant, category, expense_date, notes, created_at
       FROM expenses
       WHERE user_id = $1
       ORDER BY expense_date DESC`,
      [userId]
    );

    res.status(200).json({
      user: userResult.rows[0],
      expenses: expensesResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (admin <-> user)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user".' });
    }

    // Prevent admin from removing their own admin role
    if (userId === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot revoke your own administrator privileges.' });
    }

    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      message: `User role successfully updated to ${role}.`,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset a user's password as Admin
 */
export const resetUserPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, email',
      [passwordHash, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      message: `Password successfully updated for ${result.rows[0].email}.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user and cascade delete their data
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting their own account
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own administrator account.' });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, name, email', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      message: `User ${result.rows[0].email} and associated data successfully deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getPlatformStats,
  getAllUsers,
  getUserExpenses,
  updateUserRole,
  resetUserPassword,
  deleteUser,
};
