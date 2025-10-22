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

import { ResponseMessage } from 'src/shared/decorator/response-message.decorator'
import { User } from 'src/shared/decorator/user.decorator'

import { CreateTransactionDto } from './dto/create-transaction.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { TransactionService } from './transaction.service'
import { JwtPayload } from 'src/shared/types'

@Controller('transaction')
export class TransactionController {
  constructor(private readonly service: TransactionService) { }

  @Get('overview')
  @ResponseMessage('overview fetched')
  getOverview(
    @User() user: JwtPayload,
    @Query('date') date: string,
    @Query('type') type: 'expense' | 'income',
  ) {
    return this.service.getOverview(date, user.id, type)
  }

  @Post()
  @ResponseMessage('New transaction created')
  create(@User() user: JwtPayload, @Body() body: CreateTransactionDto) {
    return this.service.create(body, user.id)
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
    @User() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.service.findAll({ pagination, month, year, userId: user.id })
  }

  @Get('monthly-summary')
  @ResponseMessage('monthly summary fetched')
  getMonthlySummary(
    @User() user: JwtPayload,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.service.getMonthlySummary({ month, year, userId: user.id })
  }

  @Get('chart')
  @ResponseMessage('expense range fetched')
  getExpenseByRange(
    @User() user: JwtPayload,
    @Query('date') date: string,
    @Query('range') range: string,
  ) {
    return this.service.getChartByRange({
      date,
      range: range as any,
      userId: user.id,
    })
  }
}
