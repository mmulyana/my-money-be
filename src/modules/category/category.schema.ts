import z from 'zod'

export const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().min(1, 'color is required'),
  parentId: z.string().nullable(),
  type: z.string().min(1, 'type is required'),
})
