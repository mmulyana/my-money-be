import {
  Controller,
  Delete,
  Query,
  Param,
  Patch,
  Post,
  Body,
  Get,
} from '@nestjs/common'
import { ResponseMessage } from 'src/shared/decorator/response-message.decorator'
import { User } from 'src/shared/decorator/user.decorator'

import { CreateBudgetItemDto } from './dto/create-budget-item.dto'
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { UpdateBudgetDto } from './dto/update-budget.dto'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { BudgetService } from './budget.service'
import { JwtPayload } from 'src/shared/types'

@Controller('budget')
export class BudgetController {
  constructor(private readonly service: BudgetService) { }

  @Post()
  @ResponseMessage('New Budget created')
  create(@Body() body: CreateBudgetDto, @User() user: JwtPayload) {
    return this.service.create(body, user.id)
  }

  @Patch(':id')
  @ResponseMessage('Budget updated')
  update(@Param('id') id: string, @Body() body: UpdateBudgetDto) {
    return this.service.update(id, body)
  }

  @Get()
  @ResponseMessage('budget fetched')
  findAll(
    @User() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.service.findAll({ pagination, month, year, userId: user.id })
  }

  @Post('/item')
  @ResponseMessage('New item saved')
  createItem(@Body() body: CreateBudgetItemDto,
  ) {
    return this.service.createItem(body)
  }

  @Patch('/item/:id')
  @ResponseMessage('item updated')
  updateItem(@Param('id') id: string, @Body() body: UpdateBudgetItemDto) {
    return this.service.updateItem(id, body)
  }

  @Delete('/item/:id')
  @ResponseMessage('item removed')
  destroyItem(@Param('id') id: string) {
    return this.service.removeItem(id)
  }
  @Delete(':id')
  @ResponseMessage('budget deleted')
  destroy(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
