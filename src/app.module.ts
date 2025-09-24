import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [PrismaModule, CategoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
