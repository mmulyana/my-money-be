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
import { ResponseMessage } from 'src/shared/utils/response-message.decorator'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { CreateWalletDto } from './dto/create-wallet.dto'
import { WalletService } from './wallet.service'

@Controller('wallet')
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Post()
  @ResponseMessage('Wallet created')
  create(@Body() body: CreateWalletDto) {
    return this.service.create(body)
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
  findAll(@Query() pagination: PaginationDto, @Query('q') q?: string) {
    return this.service.findAll({
      pagination,
      q,
    })
  }
}
