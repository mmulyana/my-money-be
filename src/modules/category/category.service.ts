import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { paginate } from 'src/shared/utils/pagination'

@Injectable()
export class CategoryService {
  constructor(private db: PrismaService) { }

  async create(data: CreateCategoryDto, userId: string) {
    const res = await this.db.category.create({ data: { ...data, userId } })
    return { data: res }
  }

  async findAll({
    pagination,
    q,
    parentId,
    type,
    userId
  }: {
    pagination: PaginationDto
    q?: string
    parentId?: string
    type?: string
    userId: string
  }) {
    const isParentQuery = !parentId

    return paginate({
      model: this.db.category,
      args: {
        where: {
          AND: [
            q ? { name: { contains: q, mode: 'insensitive' } } : {},
            parentId ? { parentId } : { parentId: null },
            type ? { type } : {},
            { userId }
          ],
        },
        include: isParentQuery
          ? {
            children: true,
          }
          : undefined,
        orderBy: { name: 'asc' },
      },
      ...pagination,
    })
  }

  async find(id: string) {
    const data = await this.db.category.findUnique({ where: { id } })
    if (!data) {
      throw new NotFoundException('Journal not found')
    }
    return { data }
  }

  async update(id: string, data: CreateCategoryDto) {
    const res = await this.db.category.update({ where: { id }, data })
    return { data: res }
  }

  async remove(id: string) {
    await this.db.category.delete({ where: { id } })
  }
}
