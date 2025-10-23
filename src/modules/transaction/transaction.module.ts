import { Module } from '@nestjs/common'
import { TransactionController } from './transaction.controller'
import { TransactionService } from './transaction.service'
import { WalletModule } from '../wallet/wallet.module'
import { BudgetModule } from '../budget/budget.module'

@Module({
  imports: [WalletModule, BudgetModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule { }
