import { Budget, BudgetItem, Category, TransactionType } from '@prisma/client'
import { BadRequestException, Injectable } from '@nestjs/common'
import { endOfMonth, startOfMonth } from 'date-fns'

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { createPaginator } from 'src/shared/utils/paginator'
import { serialize } from 'src/shared/utils'

import { CreateBudgetItemDto } from './dto/create-budget-item.dto'
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { UpdateBudgetDto } from './dto/update-budget.dto'

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
    const res = await this.db.$transaction(async (prisma) => {

      const exists = await prisma.budgetItem.findUnique({ where: { id } })
      if (!exists) return null

      return prisma.budgetItem.delete({ where: { id } })
    })

    return { data: serialize(res) }
  }

  async recalculateByBudgetId(budgetId: string) {
    const budget = await this.db.budget.findUnique({
      where: { id: budgetId },
      include: { items: true },
    })

    if (!budget) {
      throw new BadRequestException("budget not found")
    }

    for (const item of budget.items) {
      const actual = await this.db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          walletId: budget.walletId,
          categoryId: item.categoryId,
          type: 'expense',
          date: { gte: budget.startAt, lte: budget.endAt },
          deletedAt: null,
        },
      })
      await this.db.budgetItem.update({
        where: { id: item.id },
        data: { actual: actual._sum.amount ?? 0n },
      })
    }
  }

  async recalculateByDate(date: Date) {
    const budgets = await this.db.budget.findMany({
      where: {
        startAt: { lte: date },
        endAt: { gte: date },
      },
      include: { items: true },
    })

    if (budgets.length === 0) return []

    const minStart = budgets.reduce((min, b) => b.startAt < min ? b.startAt : min, budgets[0].startAt)
    const maxEnd = budgets.reduce((max, b) => b.endAt > max ? b.endAt : max, budgets[0].endAt)

    const transactions = await this.db.transaction.findMany({
      where: {
        type: 'expense',
        deletedAt: null,
        date: { gte: minStart, lte: maxEnd },
      },
      select: {
        amount: true,
        categoryId: true,
        walletId: true,
        date: true,
      },
    })

    for (const budget of budgets) {
      for (const item of budget.items) {
        const total = transactions
          .filter(
            (trx) =>
              trx.walletId === budget.walletId &&
              trx.categoryId === item.categoryId &&
              trx.date >= budget.startAt &&
              trx.date <= budget.endAt,
          )
          .reduce((sum, trx) => sum + BigInt(trx.amount), 0n)

        await this.db.budgetItem.update({
          where: { id: item.id },
          data: { actual: total },
        })
      }
    }
  }

  async recalculateByTransaction({
    amount,
    categoryId,
    date,
    type,
    walletId,
    prisma
  }: { categoryId: string, walletId: string, amount: bigint, date: Date, type: TransactionType, prisma?: typeof this.db }) {
    if (type !== 'expense') return null

    const db = prisma ?? this.db

    const budgets = await this.db.budget.findMany({
      where: {
        walletId,
        startAt: { lte: date },
        endAt: { gte: date }
      },
      include: {
        items: true
      }
    })

    if (budgets.length === 0) return

    for (const budget of budgets) {
      const item = budget.items.find(i => i.categoryId === categoryId)
      if (item) {
        await this.db.budgetItem.update({
          where: {
            id: item.id,
          },
          data: {
            actual: { increment: amount }
          }
        })
      }
    }
  }

  // handle update trx
  async recalculateOnTrxUpdate({
    oldData,
    newData,
    prisma
  }: {
    oldData: {
      amount: bigint
      categoryId: string
      date: Date
      walletId: string
      type: TransactionType
    }
    newData: {
      amount: bigint
      categoryId: string
      date: Date
      walletId: string
      type: TransactionType
    },
    prisma?: typeof this.db
  }): Promise<void> {
    if (oldData.type !== 'expense' && newData.type !== 'expense') return

    // kategori/walet/tanggal beda
    const hasBudgetScopeChanged =
      oldData.walletId !== newData.walletId ||
      oldData.categoryId !== newData.categoryId ||
      oldData.date.getTime() !== newData.date.getTime()

    if (hasBudgetScopeChanged) {
      // Kurangi dari budget lama
      await this.recalculateByTransaction({
        amount: -oldData.amount,
        categoryId: oldData.categoryId,
        date: oldData.date,
        walletId: oldData.walletId,
        type: oldData.type,
        prisma
      })

      await this.recalculateByTransaction({
        amount: newData.amount,
        categoryId: newData.categoryId,
        date: newData.date,
        walletId: newData.walletId,
        type: newData.type,
        prisma
      })
    } else {
      // amount beda
      const diff = newData.amount - oldData.amount
      if (diff !== 0n) {
        await this.recalculateByTransaction({
          amount: diff,
          categoryId: newData.categoryId,
          date: newData.date,
          walletId: newData.walletId,
          type: newData.type,
          prisma
        })
      }
    }
  }

  // handle delete trx
  async recalculateOnTrxDelete({
    amount,
    categoryId,
    date,
    type,
    walletId,
    prisma
  }: {
    categoryId: string
    walletId: string
    amount: bigint
    date: Date
    type: TransactionType,
    prisma?: typeof this.db
  }): Promise<void> {
    if (type !== 'expense') return

    await this.recalculateByTransaction({
      amount: -amount,
      categoryId,
      date,
      walletId,
      type,
      prisma
    })
  }
}
