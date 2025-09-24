import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { AppService } from './app.service'

// module
import { TransactionModule } from './modules/transaction/transaction.module'
import { CategoryModule } from './modules/category/category.module'
import { WalletModule } from './modules/wallet/wallet.module'
import { PrismaModule } from './shared/prisma/prisma.module'

@Module({
  imports: [PrismaModule, CategoryModule, WalletModule, TransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
