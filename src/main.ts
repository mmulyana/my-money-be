import { NestFactory, Reflector } from '@nestjs/core'

import { ResponseInterceptor } from './shared/interceptor/response.interceptor'
import { ZodValidationPipe } from './shared/pipes/zod-validation/zod-validation.pipe'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: '*',
  })

  app.setGlobalPrefix('api')
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)))
  app.useGlobalPipes(new ZodValidationPipe())

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
