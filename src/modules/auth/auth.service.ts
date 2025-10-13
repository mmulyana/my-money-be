import {
  BadRequestException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common'
import { UserService } from '../user/user.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { ConfigService } from '@nestjs/config'
import { OAuth2Client } from 'google-auth-library'
import { nanoid } from 'nanoid'

@Injectable()
export class AuthService {
  private oauth2Client: OAuth2Client

  constructor(
    private userService: UserService,
    private jwt: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.oauth2Client = new OAuth2Client({
      clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    })
  }

  async register(data: RegisterDto) {
    const exists = await this.userService.findByUsernameAndEmail(
      data?.email ?? data?.username,
    )
    if (exists) {
      throw new BadRequestException('email or username already registered')
    }

    const password = await bcrypt.hash(data.password, 10)
    const user = await this.userService.create({
      username: data.username,
      email: data?.email,
      isGuest: false,
      password,
    })
    const { access_token } = await this.signToken(user.id, user?.username!)
    return {
      data: {
        access_token,
      },
    }
  }

  async login(data: LoginDto) {
    const user = await this.userService.findByUsernameAndEmail(data?.username)

    if (!user) throw new BadRequestException('Email or password is wrong')

    // case login with email/username
    if (!user.password) {
      throw new BadRequestException('Password is required')
    }

    const match = await bcrypt.compare(data?.password, user.password)
    if (!match) throw new UnauthorizedException('Email or password is wrong')

    const { access_token } = await this.signToken(user.id, user?.username!)
    return {
      data: {
        access_token,
      },
    }
  }

  async handleGoogleCallback(code: string) {
    const tokens = await this.exchangeCodeForToken(code)
    const googleUser = await this.getGoogleUser(tokens)

    if (!googleUser.email) {
      throw new BadRequestException('Google email not found')
    }

    let user = await this.userService.findByEmail(googleUser.email)
    if (!user) {
      user = await this.userService.create({
        email: googleUser.email,
        username: googleUser.email,
        password: null,
        isGuest: false,
        photoUrl: googleUser.picture,
      })
    }

    const { access_token } = await this.signToken(
      user?.id as string,
      user.username,
    )
    const redirectUrl = `${this.configService.get('FRONTEND_URL')}/app?token=${access_token}`
    return redirectUrl
  }

  async registerGuest() {
    const user = await this.userService.create({
      username: this.generateUniqueUsername(),
      password: null,
      email: '',
      isGuest: true,
    })

    const payload = { sub: user.id, username: user.username }
    const access_token = await this.jwt.signAsync(payload)
    return {
      data: { access_token },
    }
  }

  private async signToken(userId: string, username: string) {
    const payload = { sub: userId, username }
    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
    })
    return { access_token }
  }

  async exchangeCodeForToken(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code)
    return tokens
  }

  async getGoogleUser(tokens: any) {
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    })

    const payload = ticket.getPayload()
    return {
      id: payload?.sub,
      email: payload?.email,
      name: payload?.name,
      picture: payload?.picture,
    }
  }

  getGoogleUrl() {
    const scopes = (this.configService.get<string>('GOOGLE_SCOPES') || '')
      .split(' ')
      .filter(Boolean)

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    })
  }

  private generateUniqueUsername(): string {
    const randomSuffix = nanoid(5)
    return `user_${randomSuffix}`
  }
}
