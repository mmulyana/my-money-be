import { differenceInDays, format } from 'date-fns'
import { Injectable } from '@nestjs/common'

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { paginate } from 'src/shared/utils/pagination'
import { serialize } from 'src/shared/utils'

import { CreateWishlistDto } from './dto/create-wishlist.dto'

@Injectable()
export class WishlistService {
  constructor(private db: PrismaService) { }

  async create(data: CreateWishlistDto, userId: string) {
    const res = await this.db.goal.create({ data: { ...data, userId } })
    return {
      data: serialize(res),
    }
  }

  async update(id: string, data: CreateWishlistDto) {
    return await this.db.goal.update({ where: { id }, data })
  }

  async destroy(id: string) {
    return await this.db.goal.delete({ where: { id } })
  }

  async findAll({
    pagination,
    q,
    userId,
  }: {
    pagination: PaginationDto
    q?: string
    userId: string
  }) {
    const res = await paginate({
      model: this.db.goal,
      args: {
        where: {
          AND: [q ? { name: { contains: q } } : {}, { userId }],
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          transaction: true,
        },
      },
      ...pagination,
    })

    const formatted = res.data.map((i) => {
      // const total = BigInt(i.total || 0)
      // const progress = funded === 0n ? 0 : Number((total * 100n) / funded)

      return {
        ...i,
        deadlineAt: format(new Date(i.deadlineAt), 'dd MMM yyyy'),
        daysLeft: differenceInDays(new Date(i.deadlineAt), new Date()),
        progress: 0,
        funded: 0,
      }
    })

    return {
      data: serialize(formatted),
      meta: res.meta,
    }
  }
}
