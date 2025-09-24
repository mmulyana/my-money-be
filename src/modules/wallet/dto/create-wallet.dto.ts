import { createZodDto } from 'nestjs-zod'
import { WalletSchema } from '../wallet.schema'

export class CreateWalletDto extends createZodDto(WalletSchema) {}
