import { createZodDto } from 'nestjs-zod'
import { BudgetSchema } from '../budget.schema'

export class UpdateBudgetDto extends createZodDto(BudgetSchema.partial()) {}
