import z from 'zod'

export const TransactionSchema = z.object({
  amount: z.coerce.bigint(),
  walletId: z.string().min(1, 'wallet is required'),
  categoryId: z.string().min(1, 'category is required'),
  type: z.enum(['expense', 'income', 'transfer']),
  date: z.coerce.date(),
  toWalletId: z.string().nullable().optional(),
  remark: z.string().nullable().optional(),
})
