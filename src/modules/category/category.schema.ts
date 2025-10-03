import z from 'zod'

export const CategorySchema = z.object({
  name: z.string().min(1, 'name is required'),
  color: z.string().min(1, 'color is required'),
  parentId: z.string().nullable().optional(),
  type: z.enum(['expense', 'income', 'transfer']),
  imageUrl: z.string().nullable(),
  imageVariant: z.string().nullable(),
})
