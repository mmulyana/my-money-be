import z, { string } from 'zod'

export const BudgetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  total: z.coerce.bigint(),
  walletId: z.string(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  categories: z
    .object({
      categoryId: z.string(),
      planned: z.coerce.bigint(),
    })
    .array()
    .optional(),
})

export const BudgetItemSchema = z.object({
  categoryId: string(),
  planned: z.coerce.bigint(),
  budgetId: z.string(),
})

export const UpdateBudgetItemSchema = z.object({
  categoryId: string(),
  planned: z.coerce.number(),
})
