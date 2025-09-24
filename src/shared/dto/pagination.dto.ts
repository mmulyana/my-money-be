import { createZodDto } from 'nestjs-zod'
import { PaginationSchema } from '../schema/pagination.schema'

export class PaginationDto extends createZodDto(PaginationSchema) {}
