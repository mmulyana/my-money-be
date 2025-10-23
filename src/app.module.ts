import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { AppService } from './app.service'

// module
import { TransactionModule } from './modules/transaction/transaction.module'
import { CategoryModule } from './modules/category/category.module'
import { WalletModule } from './modules/wallet/wallet.module'
import { BudgetModule } from './modules/budget/budget.module'
import { PrismaModule } from './shared/prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { GoalModule } from './modules/goal/goal.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CategoryModule,
    WalletModule,
    TransactionModule,
    BudgetModule,
    AuthModule,
    UserModule,
    GoalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
