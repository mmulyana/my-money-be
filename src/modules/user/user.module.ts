import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { SharedJwtModule } from 'src/shared/jwt/jwt.module'

@Module({
  imports: [SharedJwtModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
