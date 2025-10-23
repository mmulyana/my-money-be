import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ResponseMessage } from 'src/shared/decorator/response-message.decorator'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { User } from 'src/shared/decorator/user.decorator'
import { JwtPayload } from 'src/shared/types'

import { CreateGoalDto } from './dto/create-goal'
import { GoalService } from './goal.service'

@Controller('goal')
export class GoalController {
  constructor(private readonly service: GoalService) { }

  @Post()
  @ResponseMessage('goal successfully created')
  create(@Body() body: CreateGoalDto, @User() user: JwtPayload) {
    return this.service.create(body, user.id)
  }

  @Patch(':id')
  @ResponseMessage('goal successfully updated')
  update(@Param('id') id: string, @Body() body: CreateGoalDto) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @ResponseMessage('goal successfully deleted')
  destroy(@Param('id') id: string) {
    return this.service.destroy(id)
  }

  @Get()
  @ResponseMessage('goal successfully fetched')
  getAll(@User() user: JwtPayload, @Query() pagination: PaginationDto, @Query('q') q?: string) {
    return this.service.findAll({ pagination, q, userId: user.id })
  }
}
