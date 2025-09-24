import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common'
import { ZodError } from 'zod'

interface ZodSchemaClass {
  schema: any
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    const metatype = metadata.metatype

    if (this.isZodSchema(metatype)) {
      const schema = (metatype as ZodSchemaClass).schema

      let result:
        | { success: true; data: any }
        | { success: false; error: ZodError<any> }

      if (typeof (schema as any).safeParseAsync === 'function') {
        result = await (schema as any).safeParseAsync(value)
      } else {
        result = (schema as any).safeParse(value)
      }

      if (!result.success) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: result.error.issues.map((err) => ({
            path: err.path.length > 0 ? err.path.join('.') : '<root>',
            message: err.message,
          })),
        })
      }

      return result.data
    }

    return value
  }

  private isZodSchema(metatype?: unknown): metatype is ZodSchemaClass {
    if (!metatype || typeof metatype !== 'function') return false

    const maybe = metatype as any
    return maybe.schema && typeof maybe.schema.safeParse === 'function'
  }
}
