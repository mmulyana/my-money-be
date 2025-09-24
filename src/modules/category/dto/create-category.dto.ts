import { createZodDto } from 'nestjs-zod'
import { CategorySchema } from '../category.schema'

export class CreateCategoryDto extends createZodDto(CategorySchema) {}
