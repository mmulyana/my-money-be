import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ZodValidationPipe } from './shared/pipes/zod-validation/zod-validation.pipe'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ZodValidationPipe())
  
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
