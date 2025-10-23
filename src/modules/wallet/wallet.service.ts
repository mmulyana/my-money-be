import { PrismaClient } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { CreateWalletDto } from './dto/create-wallet.dto'
import { paginate } from 'src/shared/utils/pagination'
import { TPrismaClient } from 'src/shared/types'
import { serialize } from 'src/shared/utils'

@Injectable()
export class WalletService {
  constructor(private db: PrismaService) { }

  async create(data: CreateWalletDto, userId: string) {
    const res = await this.db.wallet.create({ data: { ...data, userId } })
    return { data: serialize(res) }
  }

  async update(id: string, data: CreateWalletDto) {
    const res = await this.db.wallet.update({ where: { id }, data })
    return { data: serialize(res) }
  }

  async destroy(id: string) {
    await this.db.$transaction(async (prisma) => {
      const transactions = await prisma.transaction.findMany({
        where: {
          walletId: id,
        },
      })
      if (transactions.length) {
        await prisma.transaction.deleteMany({ where: { walletId: id } })
      }

      const budgets = await prisma.budget.findMany({
        where: {
          walletId: id,
        },
      })
      const budgetIds = budgets.map((i) => i.id)

      if (budgets.length) {
        const items = await prisma.budgetItem.findMany({
          where: {
            budgetId: { in: budgetIds },
          },
        })

        if (items.length) {
          const itemIds = items.map((i) => i.id)
          await prisma.budgetItem.deleteMany({
            where: { id: { in: itemIds } },
          })
        }
      }

      await prisma.budget.deleteMany({
        where: {
          id: {
            in: budgetIds,
          },
        },
      })

      await prisma.wallet.delete({ where: { id } })
    })
  }

  async find(id: string) {
    await this.db.wallet.findUnique({ where: { id } })
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
    const data = await paginate({
      model: this.db.wallet,
      args: {
        where: {
          AND: [q ? { name: { contains: q } } : {}, { userId }],
        },
        orderBy: {
          name: 'asc',
        },
      },
      ...pagination,
    })

    const serialized = data.data.map(serialize)

    return {
      data: serialized,
      meta: data.meta,
    }
  }

  async updateBalance(
    id: string,
    amount: bigint,
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
