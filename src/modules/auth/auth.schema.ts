import z from 'zod'

export const RegisterSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().optional(),
  password: z.string().min(8),
})

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string().min(8),
})
