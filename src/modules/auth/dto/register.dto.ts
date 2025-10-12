import { createZodDto } from 'nestjs-zod'
import { RegisterSchema } from '../auth.schema'

export class RegisterDto extends createZodDto(RegisterSchema) {}
