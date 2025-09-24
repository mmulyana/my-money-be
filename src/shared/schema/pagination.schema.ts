import z from 'zod'

export const PaginationSchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  cursor: z.string().optional(),
})
