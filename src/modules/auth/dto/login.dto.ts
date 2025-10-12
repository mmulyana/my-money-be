import { createZodDto } from 'nestjs-zod'
import { LoginSchema } from '../auth.schema'

export class LoginDto extends createZodDto(LoginSchema) {}
