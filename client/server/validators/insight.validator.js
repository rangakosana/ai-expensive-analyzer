import { z } from 'zod';

export const generateInsightSchema = z.object({
  month: z
    .string({ required_error: 'Month is required' })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
});

export const AIInsightSchema = z.object({
  total_analyzed_amount: z.coerce.number({
    required_error: 'total_analyzed_amount is required',
  }),
  category_breakdown: z.array(
    z.object({
      category: z.string({ required_error: 'category is required' }),
      total_spent: z.coerce.number({ required_error: 'total_spent is required' }),
      percentage_of_total: z.coerce.number({ required_error: 'percentage_of_total is required' }),
    })
  ),
  unnecessary_spending_identified: z.array(z.string()),
  actionable_tips: z.array(z.string()).length(3, 'actionable_tips must contain exactly 3 tips'),
  flexible_analysis: z
    .object({
      monthly_income: z.coerce.number(),
      savings_target_percentage: z.coerce.number(),
      savings_target_amount: z.coerce.number(),
      fixed_bills_total: z.coerce.number(),
      flexible_budget_total: z.coerce.number(),
      flexible_spent_so_far: z.coerce.number(),
      flexible_remaining: z.coerce.number(),
      days_elapsed: z.coerce.number(),
      days_remaining: z.coerce.number(),
      safe_daily_allowance: z.coerce.number(),
      pacing_status: z.enum(['on_track', 'caution', 'deficit', 'surplus', 'crisis']),
    })
    .optional(),
  fixed_obligations_summary: z
    .array(
      z.object({
        name: z.string(),
        amount: z.coerce.number(),
        category: z.string().optional().default('Miscellaneous'),
      })
    )
    .optional(),
});
