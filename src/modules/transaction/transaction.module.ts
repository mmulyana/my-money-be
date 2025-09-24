import { Module } from '@nestjs/common'
import { TransactionController } from './transaction.controller'
import { TransactionService } from './transaction.service'
import { WalletModule } from '../wallet/wallet.module'

@Module({
  imports: [WalletModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
