import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import {
  UnauthorizedException,
  ForbiddenException,
  ExecutionContext,
  CanActivate,
  Injectable,
} from '@nestjs/common'

import { IS_PUBLIC_KEY } from '../decorator/public.decorator'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly db: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    // cek kalo route nya publik
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const token = this.extractTokenFromHeader(request)
    if (!token) {
      throw new UnauthorizedException('Authorization token is missing or malformed')
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      })

      const user = await this.db.user.findUnique({
        where: { id: payload.sub },
        omit: { password: true }
      })

      if (!user) {
        throw new ForbiddenException('User not found or no longer active')
      }

      request['user'] = user

      return true
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired')
      }

      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token')
      }

      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error
      }

      throw new UnauthorizedException('Failed to authenticate request')
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization
    if (!authHeader) return undefined

    const [type, token] = authHeader.split(' ')
    return type === 'Bearer' ? token : undefined
  }
}
