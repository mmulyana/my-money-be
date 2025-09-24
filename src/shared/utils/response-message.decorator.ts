import { SetMetadata } from '@nestjs/common'

export const key = 'response_message'
export const ResponseMessage = (message: string) => SetMetadata(key, message)
