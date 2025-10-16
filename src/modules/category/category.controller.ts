import {
  Controller,
  Delete,
  Param,
  Patch,
  Query,
  Body,
  Post,
  Get,
} from '@nestjs/common'

import { ResponseMessage } from 'src/shared/decorator/response-message.decorator'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { CategoryService } from './category.service'
import { User } from 'src/shared/decorator/user.decorator'
import { JwtPayload } from 'src/shared/types'

@Controller('category')
export class CategoryController {
  constructor(private readonly service: CategoryService) { }

  @Post()
  @ResponseMessage('Category successfully created')
  create(@Body() body: CreateCategoryDto, @User() user: JwtPayload) {
    return this.service.create(body, user.id)
  }

  @Get()
  @ResponseMessage('Category fetched successfully')
  findAll(
    @User() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query('q') q?: string,
    @Query('parentId') parentId?: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll({ pagination, q, parentId, type, userId: user.id })
  }

  @Patch(':id')
  @ResponseMessage('Category successfully updated')
  update(@Param('id') id: string, @Body() body: CreateCategoryDto) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @ResponseMessage('Category successfully removed')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
