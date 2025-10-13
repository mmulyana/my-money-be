import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { JwtAuthGuard } from 'src/shared/guards/auth-guard'

@Controller('user')
export class UserController {
  constructor(private service: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.service.getProfile(req.user.sub)
  }
}
