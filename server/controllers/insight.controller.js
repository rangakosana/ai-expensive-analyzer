import { query } from '../config/db.js';
import { generateInsightSchema } from '../validators/insight.validator.js';
import { generateFinancialReport, chatWithFinancialAdvisor } from '../services/ai.service.js';

export const getInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, user_id, report_month, insight_data, created_at
       FROM ai_insights
       WHERE user_id = $1
       ORDER BY report_month DESC, created_at DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getInsightByMonth = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month } = req.params;

    const result = await query(
      `SELECT id, user_id, report_month, insight_data, created_at
       FROM ai_insights
       WHERE user_id = $1 AND report_month = $2`,
      [userId, month]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No AI insight found for month ${month}.` });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const generateInsight = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedBody = generateInsightSchema.parse(req.body);
    const { month } = validatedBody;

    // Fetch user's expenses for the specified month
    const expensesResult = await query(
      `SELECT amount::float, merchant, category, TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date
       FROM expenses
       WHERE user_id = $1 AND TO_CHAR(expense_date, 'YYYY-MM') = $2
       ORDER BY expense_date ASC`,
      [userId, month]
    );

    const expenses = expensesResult.rows;

    if (expenses.length === 0) {
      return res.status(400).json({
        error: `No expenses found for ${month}. Please record at least one expense for this month before generating an AI financial analysis.`,
      });
    }

    // Fetch user's budget settings if configured
    const budgetResult = await query(
      `SELECT monthly_income::float, savings_target_percentage::float, fixed_bills
       FROM budgets
       WHERE user_id = $1`,
      [userId]
    );
    const userBudget = budgetResult.rows[0] || null;

    // Generate report via Gemini service with budget & runway pacing
    const insightData = await generateFinancialReport(month, expenses, userBudget);

    // Save to PostgreSQL using ON CONFLICT UPSERT
    const upsertResult = await query(
      `INSERT INTO ai_insights (user_id, report_month, insight_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, report_month)
       DO UPDATE SET insight_data = EXCLUDED.insight_data, created_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, report_month, insight_data, created_at`,
      [userId, month, JSON.stringify(insightData)]
    );

    res.status(201).json(upsertResult.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const chatWithAdvisor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userName = req.user.name || 'User';
    const { message, history, month = new Date().toISOString().slice(0, 7) } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch user's expenses for this month
    const expensesResult = await query(
      `SELECT amount::float, merchant, category, TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date
       FROM expenses
       WHERE user_id = $1 AND TO_CHAR(expense_date, 'YYYY-MM') = $2
       ORDER BY expense_date DESC`,
      [userId, month]
    );

    // Fetch user's budget settings
    const budgetResult = await query(
      `SELECT monthly_income::float, savings_target_percentage::float, fixed_bills
       FROM budgets
       WHERE user_id = $1`,
      [userId]
    );
    const userBudget = budgetResult.rows[0] || null;

    const chatResponse = await chatWithFinancialAdvisor({
      userMessage: message.trim(),
      conversationHistory: history || [],
      month,
      expenses: expensesResult.rows,
      userBudget,
      userName,
    });

    res.json(chatResponse);
  } catch (error) {
    next(error);
  }
};

export default {
  getInsights,
  getInsightByMonth,
  generateInsight,
  chatWithAdvisor,
};
