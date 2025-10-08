import {
  Controller,
  Delete,
  Param,
  Patch,
  Body,
  Post,
  Get,
  Query,
} from '@nestjs/common'

import { ResponseMessage } from 'src/shared/utils/response-message.decorator'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { TransactionService } from './transaction.service'

@Controller('transaction')
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Post()
  @ResponseMessage('New transaction created')
  create(@Body() body: CreateTransactionDto) {
    return this.service.create(body)
  }

  @Patch(':id')
  @ResponseMessage('Transaction updated')
  update(@Param('id') id: string, @Body() body: CreateTransactionDto) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @ResponseMessage('Transaction removed')
  destroy(@Param('id') id: string) {
    return this.service.destroy(id)
  }
  
  @Get()
  @ResponseMessage('Transactions fetched')
  findAll(
    @Query() pagination: PaginationDto,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.service.findAll({ pagination, month, year })
  }

  @Get('monthly-summary')
  @ResponseMessage('monthly summary fetched')
  getMonthlySummary(
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.service.getMonthlySummary({ month, year })
  }
}
