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
import { ResponseMessage } from 'src/shared/decorator/response-message.decorator'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { CreateWalletDto } from './dto/create-wallet.dto'
import { WalletService } from './wallet.service'
import { User } from 'src/shared/decorator/user.decorator'
import { JwtPayload } from 'src/shared/types'

@Controller('wallet')
export class WalletController {
  constructor(private readonly service: WalletService) { }

  @Post()
  @ResponseMessage('Wallet created')
  create(@Body() body: CreateWalletDto, @User() user: JwtPayload) {
    return this.service.create(body, user.id)
  }

  @Patch(':id')
  @ResponseMessage('Wallet updated')
  update(@Param('id') id: string, @Body() body: CreateWalletDto) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @ResponseMessage('Wallet removed')
  destroy(@Param('id') id: string) {
    return this.service.destroy(id)
  }

  @Get(':id')
  @ResponseMessage('Wallet fetched')
  find(@Param('id') id: string) {
    return this.service.find(id)
  }

  @Get()
  @ResponseMessage('Wallets fetched')
  findAll(@User() user: JwtPayload, @Query() pagination: PaginationDto, @Query('q') q?: string) {
    return this.service.findAll({
      pagination,
      q,
      userId: user.id
    })
  }
}
