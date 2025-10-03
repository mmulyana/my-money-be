import z from 'zod'

export const WishlistSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  deadlineAt: z.coerce.date(),
  doneAt: z.coerce.date(),
})
