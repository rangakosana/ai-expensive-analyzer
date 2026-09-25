import { z } from 'zod';

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Transportation',
  'Food & Dining',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Personal Care',
  'Miscellaneous',
];

export const expenseSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .positive('Amount must be greater than zero')
    .max(10000000, 'Amount is unrealistically large'),
  merchant: z
    .string({ required_error: 'Merchant name is required' })
    .trim()
    .min(1, 'Merchant name cannot be empty')
    .max(100, 'Merchant name cannot exceed 100 characters'),
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({
      message: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`,
    }),
  }),
  expense_date: z
    .string({ required_error: 'Expense date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  notes: z
    .string()
    .trim()
    .max(255, 'Notes cannot exceed 255 characters')
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export const updateExpenseSchema = expenseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

export const expenseQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Month query must be formatted as YYYY-MM')
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date query must be formatted as YYYY-MM-DD')
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be formatted as YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be formatted as YYYY-MM-DD')
    .optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  search: z.string().trim().max(100).optional(),
});
