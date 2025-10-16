import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { WishlistService } from './wishlist.service'
import { ResponseMessage } from 'src/shared/decorator/response-message.decorator'
import { CreateWishlistDto } from './dto/create-wishlist.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { User } from 'src/shared/decorator/user.decorator'
import { JwtPayload } from 'src/shared/types'

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly service: WishlistService) { }

  @Post()
  @ResponseMessage('Wishlist successfully created')
  create(@Body() body: CreateWishlistDto, @User() user: JwtPayload) {
    return this.service.create(body, user.id)
  }

  @Patch(':id')
  @ResponseMessage('Wishlist successfully updated')
  update(@Param('id') id: string, @Body() body: CreateWishlistDto) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @ResponseMessage('Wishlist successfully deleted')
  destroy(@Param('id') id: string) {
    return this.service.destroy(id)
  }

  @Get()
  @ResponseMessage('Wishlist successfully fetched')
  getAll(@User() user: JwtPayload, @Query() pagination: PaginationDto, @Query('q') q?: string) {
    return this.service.findAll({ pagination, q, userId: user.id })
  }
}
