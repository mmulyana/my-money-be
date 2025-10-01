import { createZodDto } from 'nestjs-zod'
import { UpdateBudgetItemSchema } from '../budget.schema'

export class UpdateBudgetItemDto extends createZodDto(
  UpdateBudgetItemSchema.partial(),
) {}
