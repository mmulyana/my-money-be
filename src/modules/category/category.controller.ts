import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { CategoryService } from './category.service'
import { ResponseMessage } from 'src/shared/utils/response-message.decorator'
import { CreateCategoryDto } from './dto/create-category.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'

@Controller('category')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Post()
  @ResponseMessage('Category created successfully')
  create(@Body() body: CreateCategoryDto) {
    return this.service.create(body)
  }

  @Get()
  @ResponseMessage('Category fetched successfully')
  findAll(
    @Query() pagination: PaginationDto,
    @Query('q') q?: string,
    @Query('parentId') parentId?: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll({ pagination, q, parentId, type })
  }
}
