import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { CreateWishlistDto } from './dto/create-wishlist.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { paginate } from 'src/shared/utils/pagination'

@Injectable()
export class WishlistService {
  constructor(private db: PrismaService) {}

  async create(data: CreateWishlistDto) {
    return await this.db.wishlist.create({ data })
  }

  async update(id: string, data: CreateWishlistDto) {
    return await this.db.wishlist.update({ where: { id }, data })
  }

  async destroy(id: string) {
    return await this.db.wishlist.delete({ where: { id } })
  }

  async findAll({ pagination, q }: { pagination: PaginationDto; q?: string }) {
    return paginate({
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
  }
}
