import { createZodDto } from 'nestjs-zod'
import { TransactionSchema } from '../transaction.schema'

export class CreateTransactionDto extends createZodDto(TransactionSchema) {}
