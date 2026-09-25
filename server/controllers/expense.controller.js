import { query } from '../config/db.js';
import {
  expenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
} from '../validators/expense.validator.js';
import { extractExpenseFromReceiptImage } from '../services/ai.service.js';

export const getExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedQuery = expenseQuerySchema.parse(req.query);
    const { month, date, startDate, endDate, category, search } = validatedQuery;

    let sql = `
      SELECT id, user_id, amount::float, merchant, category,
             TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date,
             notes, created_at, updated_at
      FROM expenses
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (date) {
      sql += ` AND TO_CHAR(expense_date, 'YYYY-MM-DD') = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    } else if (startDate && endDate) {
      sql += ` AND expense_date >= $${paramIndex} AND expense_date <= $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    } else if (startDate) {
      sql += ` AND expense_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    } else if (endDate) {
      sql += ` AND expense_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    } else if (month) {
      sql += ` AND TO_CHAR(expense_date, 'YYYY-MM') = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (merchant ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY expense_date DESC, created_at DESC';

    const result = await query(sql, params);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    const result = await query(
      `SELECT id, user_id, amount::float, merchant, category,
              TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date,
              notes, created_at, updated_at
       FROM expenses
       WHERE id = $1 AND user_id = $2`,
      [expenseId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense record not found.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = expenseSchema.parse(req.body);
    const { amount, merchant, category, expense_date, notes } = validatedData;

    const result = await query(
      `INSERT INTO expenses (user_id, amount, merchant, category, expense_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, amount::float, merchant, category,
                 TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date,
                 notes, created_at, updated_at`,
      [userId, amount, merchant, category, expense_date, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;
    const validatedData = updateExpenseSchema.parse(req.body);

    // Build dynamic UPDATE query
    const fields = [];
    const params = [expenseId, userId];
    let paramIndex = 3;

    if (validatedData.amount !== undefined) {
      fields.push(`amount = $${paramIndex}`);
      params.push(validatedData.amount);
      paramIndex++;
    }

    if (validatedData.merchant !== undefined) {
      fields.push(`merchant = $${paramIndex}`);
      params.push(validatedData.merchant);
      paramIndex++;
    }

    if (validatedData.category !== undefined) {
      fields.push(`category = $${paramIndex}`);
      params.push(validatedData.category);
      paramIndex++;
    }

    if (validatedData.expense_date !== undefined) {
      fields.push(`expense_date = $${paramIndex}`);
      params.push(validatedData.expense_date);
      paramIndex++;
    }

    if (validatedData.notes !== undefined) {
      fields.push(`notes = $${paramIndex}`);
      params.push(validatedData.notes);
      paramIndex++;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE expenses
      SET ${fields.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, amount::float, merchant, category,
                TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date,
                notes, created_at, updated_at
    `;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense record not found or unauthorized.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    const result = await query(
      `DELETE FROM expenses
       WHERE id = $1 AND user_id = $2`,
      [expenseId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Expense record not found or unauthorized.' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    // Total spent & transaction count
    const totalResult = await query(
      `SELECT COALESCE(SUM(amount), 0)::float AS total_spent,
              COUNT(*)::int AS transaction_count
       FROM expenses
       WHERE user_id = $1 AND TO_CHAR(expense_date, 'YYYY-MM') = $2`,
      [userId, month]
    );

    // Spend by category
    const categoryResult = await query(
      `SELECT category,
              SUM(amount)::float AS total_spent,
              COUNT(*)::int AS count
       FROM expenses
       WHERE user_id = $1 AND TO_CHAR(expense_date, 'YYYY-MM') = $2
       GROUP BY category
       ORDER BY total_spent DESC`,
      [userId, month]
    );

    // Recent 5 expenses
    const recentResult = await query(
      `SELECT id, amount::float, merchant, category,
              TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date, notes
       FROM expenses
       WHERE user_id = $1
       ORDER BY expense_date DESC, created_at DESC
       LIMIT 5`,
      [userId]
    );

    const totalSpent = totalResult.rows[0].total_spent;
    const categoryBreakdown = categoryResult.rows.map((row) => ({
      category: row.category,
      total_spent: row.total_spent,
      percentage: totalSpent > 0 ? Number(((row.total_spent / totalSpent) * 100).toFixed(1)) : 0,
      count: row.count,
    }));

    res.status(200).json({
      month,
      total_spent: totalSpent,
      transaction_count: totalResult.rows[0].transaction_count,
      top_category: categoryBreakdown.length > 0 ? categoryBreakdown[0].category : null,
      category_breakdown: categoryBreakdown,
      recent_expenses: recentResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const scanReceipt = async (req, res, next) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Receipt image data is required.' });
    }

    const extracted = await extractExpenseFromReceiptImage({
      imageBase64: image,
      mimeType: mimeType || 'image/jpeg',
    });

    res.status(200).json({
      success: true,
      data: extracted,
    });
  } catch (error) {
    console.error('Scan receipt error:', error);
    res.status(500).json({
      error: error.message || 'Failed to scan receipt image.',
    });
  }
};

export default {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getSummary,
  scanReceipt,
};
