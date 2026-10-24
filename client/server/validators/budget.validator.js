import { z } from 'zod';

export const fixedBillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Fixed bill name is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.string().default('Housing'),
});

export const budgetSchema = z.object({
  monthly_income: z.number().min(0, 'Monthly income must be at least 0'),
  savings_target_percentage: z.number().min(0).max(100).default(20),
  fixed_bills: z.array(fixedBillSchema).default([]),
});

export default {
  fixedBillSchema,
  budgetSchema,
};
