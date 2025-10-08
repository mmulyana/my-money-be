import { differenceInDays, format } from 'date-fns'
import { Injectable } from '@nestjs/common'

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { paginate } from 'src/shared/utils/pagination'
import { serialize } from 'src/shared/utils'

import { CreateWishlistDto } from './dto/create-wishlist.dto'

@Injectable()
export class WishlistService {
  constructor(private db: PrismaService) {}

  async create(data: CreateWishlistDto) {
    const res = await this.db.wishlist.create({ data })
    return {
      data: serialize(res),
    }
  }

  async update(id: string, data: CreateWishlistDto) {
    return await this.db.wishlist.update({ where: { id }, data })
  }

  async destroy(id: string) {
    return await this.db.wishlist.delete({ where: { id } })
  }

  async findAll({ pagination, q }: { pagination: PaginationDto; q?: string }) {
    const res = await paginate({
      model: this.db.wishlist,
      args: {
        where: {
          AND: [q ? { name: { contains: q, mode: 'insensitive' } } : {}],
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          transaction: {
            include: {
              transaction: true,
            },
          },
        },
      },
      ...pagination,
    })

    const formatted = res.data.map((i) => {
      const funded = i.transaction.reduce(
        (prev, acc) => acc.transaction.amount + prev,
        0n,
      )
      const total = BigInt(i.total || 0)
      const progress = funded === 0n ? 0 : Number((total * 100n) / funded)

      return {
        ...i,
        deadlineAt: format(new Date(i.deadlineAt), 'dd MMM yyyy'),
        daysLeft: differenceInDays(new Date(i.deadlineAt), new Date()),
        progress,
        funded,
      }
    })

    return {
      data: serialize(formatted),
      meta: res.meta,
    }
  }
}
