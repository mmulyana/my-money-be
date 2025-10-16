import { Controller, Get } from '@nestjs/common'
import { User } from 'src/shared/decorator/user.decorator'
import { JwtPayload } from 'src/shared/types'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
  constructor(private service: UserService) { }

  @Get('me')
  async me(@User() user: JwtPayload) {
    return this.service.getProfile(user.id)
  }
}
