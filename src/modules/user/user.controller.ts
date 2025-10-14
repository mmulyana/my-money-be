import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { JwtAuthGuard } from 'src/shared/guards/auth-guard'
import { User } from 'src/shared/decorator/user.decorator'
import { JwtPayload } from 'src/shared/types'

@Controller('user')
export class UserController {
  constructor(private service: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@User() user: JwtPayload) {
    return this.service.getProfile(user.sub)
  }
}
