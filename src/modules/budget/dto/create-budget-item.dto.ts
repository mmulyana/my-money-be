import { createZodDto } from 'nestjs-zod'
import { BudgetItemSchema } from '../budget.schema'

export class CreateBudgetItemDto extends createZodDto(BudgetItemSchema) {}
