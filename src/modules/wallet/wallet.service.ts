import { PrismaClient } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { CreateWalletDto } from './dto/create-wallet.dto'
import { paginate } from 'src/shared/utils/pagination'
import { TPrismaClient } from 'src/shared/types'

@Injectable()
export class WalletService {
  constructor(private db: PrismaService) {}

  async create(data: CreateWalletDto) {
    const res = await this.db.wallet.create({ data })
    return { data: res }
  }

  async update(id: string, data: CreateWalletDto) {
    const res = await this.db.wallet.update({ where: { id }, data })
    return { data: res }
  }

  async destroy(id: string) {
    await this.db.wallet.delete({ where: { id } })
  }

  async find(id: string) {
    await this.db.wallet.findUnique({ where: { id } })
  }

  async findAll({ pagination, q }: { pagination: PaginationDto; q?: string }) {
    return paginate({
      model: this.db.wallet,
      args: {
        where: {
          AND: [q ? { name: { contains: q, mode: 'insensitive' } } : {}],
        },
        orderBy: {
          name: 'asc',
        },
      },
      ...pagination,
    })
  }

  async updateBalance(
    id: string,
    amount: number,
    prismaClient?: PrismaClient | TPrismaClient,
  ) {
    const prisma = prismaClient || this.db
    return prisma.wallet.update({
      where: { id },
      data: {
        balance: {
          increment: amount,
        },
      },
    })
  }
}
