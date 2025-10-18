import { BadRequestException, Injectable } from '@nestjs/common'
import { endOfMonth, startOfMonth } from 'date-fns'

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { PaginationDto } from 'src/shared/dto/pagination.dto'

import { CreateBudgetItemDto } from './dto/create-budget-item.dto'
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { UpdateBudgetDto } from './dto/update-budget.dto'
import { serialize } from 'src/shared/utils'
import { createPaginator } from 'src/shared/utils/paginator'
import { Budget, BudgetItem, Category } from '@prisma/client'
import { TPrismaClient } from 'src/shared/types'

@Injectable()
export class BudgetService {
  constructor(private db: PrismaService) { }

  async create(data: CreateBudgetDto, userId: string) {
    const res = await this.db.$transaction(async (prisma) => {
      // cek jika ada budget overlap yg category ada yg sama
      const overlapping = await prisma.budget.findMany({
        where: {
          walletId: data.walletId,
          AND: [
            { startAt: { lte: data.endAt } },
            { endAt: { gte: data.startAt } },
          ],
        },
        include: { items: true },
      })

      if (overlapping.length > 0 && data.categories?.length) {
        for (const cat of data.categories) {
          for (const b of overlapping) {
            if (b.items.some((i) => i.categoryId === cat.categoryId)) {
              throw new BadRequestException(
                `Category ${cat.categoryId} sudah ada di budget ${b.name} dengan periode bertabrakan`,
              )
            }
          }
        }
      }

      const newBudget = await prisma.budget.create({
        data: {
          name: data.name,
          startAt: data.startAt,
          endAt: data.endAt,
          total: data.total,
          walletId: data.walletId,
          items: {
            create: data.categories?.map((c) => ({
              categoryId: c.categoryId,
              planned: c.planned,
            })),
          },
          userId,
        },
        include: {
          items: true,
        },
      })

      await this.attachExistingTransactions(prisma, newBudget)
      return newBudget
    })
    return {
      data: serialize(res),
    }
  }

  async update(id: string, data: UpdateBudgetDto) {
    const res = await this.db.budget.update({
      where: { id },
      data,
    })
    return {
      data: serialize(res),
    }
  }

  async remove(id: string) {
    const data = await this.db.$transaction(async (prisma) => {
      const items = await prisma.budgetItem.findMany({
        where: { budgetId: id },
        select: { id: true },
      })

      if (items.length > 0) {
        const itemIds = items.map((i) => i.id)

        await prisma.budgetItemTransaction.deleteMany({
          where: {
            budgetItemId: { in: itemIds },
          },
        })

        await prisma.budgetItem.deleteMany({
          where: { id: { in: itemIds } },
        })
      }

      return await prisma.budget.delete({
        where: {
          id,
        },
      })
    })
    return {
      data: serialize(data),
    }
  }

  async findAll({
    pagination,
    month: monthIndex,
    year,
    userId,
  }: {
    pagination: PaginationDto
    month?: number
    year?: number
    userId: string
  }) {
    let dateFilter = {}
    if (monthIndex != null && year != null) {
      const baseDate = new Date(year, monthIndex, 1)

      const startDate = startOfMonth(baseDate)
      const endDate = endOfMonth(baseDate)

      dateFilter = {
        OR: [
          {
            startAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            startAt: {
              lte: endDate,
            },
            endAt: {
              gte: startDate,
            },
          },
        ],
      }
    }

    const paginateBudget = createPaginator(this.db.budget)
    const data = await paginateBudget({
      args: {
        where: {
          AND: [dateFilter, { userId }],
        },
        orderBy: {
          startAt: 'asc',
        },
        include: {
          items: {
            include: {
              category: true,
            },
          },
          wallet: true,
        },
      },
      ...pagination,
    })

    const budgets = data.data.map(
      (budget: Budget & { items: (BudgetItem & { category: Category })[] }) => {
        const totalActual = budget.items.reduce(
          (acc, item) => acc + item.actual,
          0n,
        )

        const usage =
          budget.total > 0n
            ? Math.round((Number(totalActual) / Number(budget.total)) * 100)
            : 0

        const categories = budget.items.map((i) => {
          const plannedNum = Number(i.planned)
          const actualNum = Number(i.actual)
          const progress =
            plannedNum > 0 ? Math.round((actualNum / plannedNum) * 100) : 0

          return {
            id: i.id,
            category: i.category,
            planned: i.planned,
            actual: i.actual,
            progress,
          }
        })

        return {
          id: budget.id,
          name: budget.name,
          startAt: budget.startAt,
          endAt: budget.endAt,
          wallet: (budget as any).wallet,
          total: budget.total.toString(),
          remaining: (budget.total - totalActual).toString(),
          spent: totalActual,
          usage,
          categories,
        }
      },
    )

    return {
      data: serialize(budgets),
      meta: data.meta,
    }
  }

  async createItem(body: CreateBudgetItemDto) {
    const budget = await this.db.budget.findUnique({
      where: { id: body.budgetId },
    })
    if (!budget) throw new BadRequestException('Budget not found')

    // cari budget lain di wallet yang overlap
    const overlapping = await this.db.budget.findMany({
      where: {
        walletId: budget.walletId,
        id: { not: budget.id }, // selain budget ini
        AND: [
          { startAt: { lte: budget.endAt } },
          { endAt: { gte: budget.startAt } },
        ],
      },
      include: { items: true },
    })

    for (const b of overlapping) {
      if (b.items.some((i) => i.categoryId === body.categoryId)) {
        throw new BadRequestException(
          `This category already exists in budget "${b.name}" with overlapping period and same wallet`,
        )
      }
    }

    // cek duplikat di budget sendiri
    const exists = await this.db.budgetItem.findFirst({
      where: { budgetId: body.budgetId, categoryId: body.categoryId },
    })
    if (exists)
      throw new BadRequestException('Category is exist in this budget')

    const res = await this.db.budgetItem.create({
      data: {
        planned: body.planned,
        budgetId: body.budgetId,
        categoryId: body.categoryId,
      },
    })
    return {
      data: serialize(res),
    }
  }

  async updateItem(id: string, body: UpdateBudgetItemDto) {
    const data = await this.db.budgetItem.update({
      data: {
        planned: body.planned,
        categoryId: body.categoryId,
      },
      where: {
        id,
      },
    })
    return {
      data: serialize(data),
    }
  }

  async removeItem(id: string) {
    console.log('=========== ' + id + ' =============')
    const res = await this.db.$transaction(async (prisma) => {
      await prisma.budgetItemTransaction.deleteMany({
        where: { budgetItemId: id },
      })

      const exists = await prisma.budgetItem.findUnique({ where: { id } })
      if (!exists) return null // atau bisa return info khusus

      return prisma.budgetItem.delete({ where: { id } })
    })

    return { data: serialize(res) }
  }

  private async attachExistingTransactions(
    prisma: TPrismaClient,
    budget: Budget & { items: BudgetItem[] },
  ) {
    for (const item of budget.items) {
      const transactions = await prisma.transaction.findMany({
        where: {
          walletId: budget.walletId,
          categoryId: item.categoryId,
          type: 'expense',
          date: { gte: budget.startAt, lte: budget.endAt },
          deletedAt: null,
        },
      })

      if (transactions.length > 0) {
        const totalAmount = transactions.reduce(
          (sum, trx) => sum + BigInt(trx.amount),
          BigInt(0),
        )

        await prisma.budgetItem.update({
          where: { id: item.id },
          data: { actual: { increment: totalAmount } },
        })
        try {
          await prisma.budgetItemTransaction.createMany({
            data: transactions.map((trx) => ({
              budgetItemId: item.id,
              transactionId: trx.id,
            })),
          })
        } catch (err: any) {
          if (err.code !== 'P2002') throw err
        }
      }
    }
  }
}
