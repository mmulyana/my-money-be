import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CategoryModule } from './modules/category/category.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [PrismaModule, CategoryModule, WalletModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
