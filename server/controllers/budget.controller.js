import { query } from '../config/db.js';
import { budgetSchema } from '../validators/budget.validator.js';

export const getBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, user_id, monthly_income::float, savings_target_percentage::float, fixed_bills, updated_at
       FROM budgets
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json(null);
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const saveBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = budgetSchema.parse(req.body);
    const { monthly_income, savings_target_percentage, fixed_bills } = validatedData;

    const result = await query(
      `INSERT INTO budgets (user_id, monthly_income, savings_target_percentage, fixed_bills)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET monthly_income = EXCLUDED.monthly_income,
                     savings_target_percentage = EXCLUDED.savings_target_percentage,
                     fixed_bills = EXCLUDED.fixed_bills,
                     updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, monthly_income::float, savings_target_percentage::float, fixed_bills, updated_at`,
      [userId, monthly_income, savings_target_percentage, JSON.stringify(fixed_bills)]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export default {
  getBudget,
  saveBudget,
};
