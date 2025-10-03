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
import { ResponseMessage } from 'src/shared/utils/response-message.decorator'
import { CreateWishlistDto } from './dto/create-wishlist.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  @Post()
  @ResponseMessage('Wishlist successfully created')
  create(@Body() body: CreateWishlistDto) {
    return this.service.create(body)
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
  getAll(@Query() pagination: PaginationDto, @Query('q') q?: string) {
    return this.service.findAll({ pagination, q })
  }
}
