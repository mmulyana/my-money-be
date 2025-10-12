import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
  constructor(private service: UserService) {}

  @Get('me')
  async me(@Req() req: any) {
    return this.service.getProfile(req.user.sub)
  }
}
