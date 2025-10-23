import { NestFactory, Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'

import { ZodValidationPipe } from './shared/pipes/zod-validation/zod-validation.pipe'
import { ResponseInterceptor } from './shared/interceptor/response.interceptor'
import { PrismaService } from './shared/prisma/prisma.service'
import { JwtAuthGuard } from './shared/guards/jwt-auth-guard'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const reflector = app.get(Reflector)
  const jwtService = app.get(JwtService)
  const prismaService = app.get(PrismaService)

  app.enableCors({
    origin: '*',
  })

  app.setGlobalPrefix('api')
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)))
  app.useGlobalPipes(new ZodValidationPipe())
  app.useGlobalGuards(new JwtAuthGuard(jwtService, reflector, prismaService))

  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
