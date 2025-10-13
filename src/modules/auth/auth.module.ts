import { Module } from '@nestjs/common'

import { AuthController } from './auth.controller'
import { UserModule } from '../user/user.module'
import { AuthService } from './auth.service'
import { SharedJwtModule } from 'src/shared/jwt/jwt.module'

@Module({
  imports: [UserModule, SharedJwtModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
