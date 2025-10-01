import { createZodDto } from 'nestjs-zod'
import { BudgetSchema } from '../budget.schema'

export class CreateBudgetDto extends createZodDto(BudgetSchema) {}
