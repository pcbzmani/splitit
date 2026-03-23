import { z } from 'zod'

export const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Invalid currency code'),
  category: z.enum(['food', 'transport', 'accommodation', 'entertainment', 'utilities', 'shopping', 'health', 'other']),
  split_type: z.enum(['equal', 'percentage', 'exact', 'shares']).default('equal'),
  group_id: z.string().uuid().optional().nullable(),
  split_with: z.array(z.string().uuid()).optional(),
  custom_splits: z.record(z.string(), z.number()).optional(),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

export const settleSchema = z.object({
  to_user_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3),
  group_id: z.string().uuid().optional().nullable(),
})

export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general']),
  message: z.string().min(10, 'Please provide more detail').max(2000),
  rating: z.coerce.number().min(1).max(5).optional(),
  email: z.string().email().optional().or(z.literal('')),
})

export type FeedbackFormData = z.infer<typeof feedbackSchema>
