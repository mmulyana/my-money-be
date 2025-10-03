import { createZodDto } from 'nestjs-zod'
import { WishlistSchema } from '../wishlist.schema'

export class CreateWishlistDto extends createZodDto(WishlistSchema) {}
