import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { Response } from 'express'

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.service.register(data)
  }
  @Post('register/guest')
  async registerGuest() {
    return this.service.registerGuest()
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    return this.service.login(data)
  }

  @Get('google/url')
  getGoogleUrl() {
    const url = this.service.getGoogleUrl()
    return { data: { url } }
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const redirectUrl = await this.service.handleGoogleCallback(code)
    return res.redirect(redirectUrl)
  }
}
