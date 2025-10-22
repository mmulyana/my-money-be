import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  addDays,
  addHours,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns'

import { CreateTransactionDto } from './dto/create-transaction.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { paginate } from 'src/shared/utils/pagination'

import { WalletService } from '../wallet/wallet.service'
import { TPrismaClient } from 'src/shared/types'
import { PrismaClient, Transaction } from '@prisma/client'
import { serialize } from 'src/shared/utils'

@Injectable()
export class TransactionService {
  constructor(
    private db: PrismaService,
    private walletService: WalletService,
  ) { }

  async create(data: CreateTransactionDto, userId: string) {
    const { amount, walletId, type } = data

    const res = await this.db.$transaction(async (prisma) => {
      if (type === 'income') {
        await this.walletService.updateBalance(walletId, amount, prisma)
      } else if (type === 'expense') {
        await this.walletService.updateBalance(walletId, -amount, prisma)
      } else if (type === 'transfer') {
        if (!data.toWalletId) {
          throw new InternalServerErrorException(
            'toWalletId is required for transfer transactions.',
          )
        }
        await this.walletService.updateBalance(walletId, -amount, prisma)
        await this.walletService.updateBalance(data.toWalletId, amount, prisma)
      }

      let normalizedDate: Date | undefined
      if (data.date) {
        const localDate = new Date(data.date)
        normalizedDate = addHours(localDate, -7)
      } else {
        throw new Error('date is required')
      }

      const newTransaction = await prisma.transaction.create({
        data: {
          ...data,
          date: normalizedDate,
          userId,
        },
      })

      // apply contribution for budget
      await this.applyContribution(prisma, newTransaction)

      return { data: newTransaction }
    })
    return { data: serialize(res) }
  }

  async update(id: string, data: CreateTransactionDto) {
    return this.db.$transaction(async (prisma) => {
      const oldTransaction = await prisma.transaction.findUnique({
        where: { id },
      })
      if (!oldTransaction) {
        throw new Error('Transaction not found')
      }

      if (oldTransaction.type === 'income') {
        await this.walletService.updateBalance(
          oldTransaction.walletId,
          -oldTransaction.amount,
          prisma,
        )
      } else if (oldTransaction.type == 'expense') {
        await this.walletService.updateBalance(
          oldTransaction.walletId,
          oldTransaction.amount,
          prisma,
        )
      }

      const { amount, walletId, type } = data
      if (type === 'income') {
        await this.walletService.updateBalance(walletId, amount, prisma)
      } else if (type === 'expense') {
        await this.walletService.updateBalance(walletId, -amount, prisma)
      }

      let normalizedDate: Date | undefined
      if (data.date) {
        const localDate = new Date(data.date)
        normalizedDate = addHours(localDate, -7)
      } else {
        throw new Error('date is required')
      }

      // reverse budget contribution
      await this.reverseContribution(prisma, oldTransaction)

      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          ...data,
          date: normalizedDate,
        },
      })

      // apply contribution for budget
      await this.applyContribution(prisma, updatedTransaction)

      return { data: serialize(updatedTransaction) }
    })
  }

  async destroy(id: string) {
    return this.db.$transaction(async (prisma) => {
      const transactionToDelete = await prisma.transaction.findUnique({
        where: { id },
      })
      if (!transactionToDelete) {
        throw new Error('Transaction not found')
      }

      if (transactionToDelete.type === 'income') {
        await this.walletService.updateBalance(
          transactionToDelete.walletId,
          -transactionToDelete.amount,
          prisma,
        )
      } else if (transactionToDelete.type === 'expense') {
        await this.walletService.updateBalance(
          transactionToDelete.walletId,
          transactionToDelete.amount,
          prisma,
        )
      }

      // reverse budget contribution
      await this.reverseContribution(prisma, transactionToDelete)

      await prisma.transaction.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    })
  }

  async find(id: string) {
    const data = await this.db.transaction.findUnique({
      where: { id },
      include: {
        wallet: true,
        category: true,
      },
    })
    return { data }
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
    userId?: string
  }) {
    let dateFilter = {}
    if (monthIndex != null && year != null) {
      const baseDate = new Date(year, monthIndex, 1)

      const startDate = startOfMonth(baseDate)
      const endDate = endOfMonth(baseDate)

      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }
    }
    const transactions = await paginate({
      model: this.db.transaction,
      args: {
        where: {
          AND: [{ deletedAt: null, userId: userId }, dateFilter],
        },
        orderBy: { date: 'desc' },
        include: {
          wallet: true,
          category: true,
        },
      },
      ...pagination,
    })

    const grouped = Object.values(
      transactions.data.reduce(
        (acc, trx) => {
          const dateKey = format(new Date(trx.date), 'yyyy-MM-dd')

          if (!acc[dateKey]) {
            acc[dateKey] = {
              date: format(new Date(trx.date), 'd MMM'),
              total: BigInt(0),
              transactions: [],
            }
          }

          if (trx.type === 'expense' || trx.type === 'transfer') {
            acc[dateKey].total -= trx.amount
          } else if (trx.type === 'income') {
            acc[dateKey].total += trx.amount
          }

          acc[dateKey].transactions.push(trx)
          return acc
        },
        {} as Record<
          string,
          {
            date: string
            total: bigint
            transactions: typeof transactions.data
          }
        >,
      ),
    )

    // const serialized = grouped.map((g: any) => ({
    //   ...g,
    //   total: g.total.toString(),
    //   transactions: g.transactions.map(serialize),
    // }))

    return {
      data: serialize(grouped),
      meta: transactions.meta,
    }
  }

  // helper cari budget item
  private async findmatchingBudgetItems(
    prisma: PrismaClient | TPrismaClient,
    trx: Transaction,
  ) {
    if (trx.type !== 'expense') return []

    return prisma.budgetItem.findMany({
      where: {
        categoryId: trx.categoryId,
        budget: {
          walletId: trx.walletId,
          startAt: { lte: trx.date },
          endAt: { gte: trx.date },
        },
      },
    })
  }

  // tambah actual
  private async applyContribution(
    prisma: PrismaClient | TPrismaClient,
    trx: Transaction,
  ) {
    // console.log('apply contribution')
    if (trx.type !== 'expense') return

    const budgetItems = await this.findmatchingBudgetItems(prisma, trx)

    for (const budgetItem of budgetItems) {
      const existing = await prisma.budgetItemTransaction.findUnique({
        where: {
          budgetItemId_transactionId: {
            budgetItemId: budgetItem.id,
            transactionId: trx.id,
          },
        },
      })

      if (existing) continue

      // tambah actual
      await prisma.budgetItem.update({
        where: { id: budgetItem.id },
        data: {
          actual: { increment: trx.amount },
        },
      })

      await prisma.budgetItemTransaction.create({
        data: {
          budgetItemId: budgetItem.id,
          transactionId: trx.id,
        },
      })
    }
  }

  // kurangi actual
  private async reverseContribution(
    prisma: PrismaClient | TPrismaClient,
    trx: Transaction,
  ) {
    if (!trx) return
    if (trx.type !== 'expense') return
    // console.log('reverse contribution')

    const pivots = await prisma.budgetItemTransaction.findMany({
      where: { transactionId: trx.id },
    })

    for (const p of pivots) {
      // kurangi actual
      await prisma.budgetItem.update({
        where: { id: p.budgetItemId },
        data: {
          actual: { decrement: trx.amount },
        },
      })

      await prisma.budgetItemTransaction.delete({
        where: { id: p.id },
      })
    }
  }

  async getMonthlySummary({
    month,
    year,
    userId,
  }: {
    month: number
    year: number
    userId: string
  }) {
    const baseDate = new Date(year, month, 1)
    const startDate = startOfMonth(baseDate)
    const endDate = endOfMonth(baseDate)

    const transactions = await this.db.transaction.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: startDate,
          lte: endDate,
        },
        userId,
      },
      select: {
        amount: true,
        type: true,
      },
    })
    // console.log('trx', transactions)

    let totalIncome = BigInt(0)
    let totalExpense = BigInt(0)

    for (const trx of transactions) {
      if (trx.type === 'income') {
        totalIncome += trx.amount
      } else if (trx.type === 'expense' || trx.type === 'transfer') {
        totalExpense += trx.amount
      }
    }

    const balance = totalIncome - totalExpense

    const data = {
      balance: balance.toString(),
      income: totalIncome.toString(),
      expense: totalExpense.toString(),
    }
    return {
      data,
    }
  }

  async getChartByRange({
    date,
    range,
    userId,
  }: {
    date: string
    range: '1w' | '2w' | '1m'
    userId: string
  }) {
    const baseDate = new Date(date)
    let startDate: Date
    let endDate: Date

    switch (range) {
      case '1w':
        startDate = startOfWeek(baseDate, { weekStartsOn: 1 })
        endDate = endOfWeek(baseDate, { weekStartsOn: 1 })
        break
      case '2w': {
        const currentWeekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
        startDate = subWeeks(currentWeekStart, 1)
        endDate = endOfWeek(baseDate, { weekStartsOn: 1 })
        break
      }
      case '1m':
        startDate = startOfMonth(baseDate)
        endDate = endOfMonth(baseDate)
        break
      default:
        throw new Error('Invalid range value')
    }

    const transactions = await this.db.transaction.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: startDate,
          lte: endDate,
        },
        userId,
        type: { in: ['expense', 'income'] },
      },
      select: {
        date: true,
        amount: true,
        type: true
      },
    })

    const days: { date: string; expense: bigint, income: bigint }[] = []
    for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
      days.push({
        date: format(d, 'd MMM'),
        expense: 0n,
        income: 0n
      })
    }

    for (const trx of transactions) {
      const key = format(new Date(trx.date), 'd MMM')
      const found = days.find((d) => d.date === key)
      if (found) {
        if (trx.type == 'income') {
          found.income += trx.amount
        } else {
          found.expense += trx.amount
        }

      }
    }

    return { data: serialize(days) }
  }

  async getOverview(date: string, userId: string, type: 'income' | 'expense') {
    const baseDate = new Date(date)
    const startDate = startOfMonth(baseDate)
    const endDate = endOfMonth(baseDate)

    const transactions = await this.db.transaction.findMany({
      where: {
        deletedAt: null,
        type,
        date: { gte: startDate, lte: endDate },
        userId,
      },
      include: {
        category: true,
      },
    })

    const grouped = transactions.reduce(
      (acc, trx) => {
        const catId = trx.categoryId

        if (!acc[catId]) {
          acc[catId] = {
            id: catId,
            name: trx.category?.name || 'Uknown',
            color: trx.category?.color || '#ccc',
            imageUrl: trx.category?.imageUrl || undefined,
            total: BigInt(0),
            imageVariant: trx.category?.imageVariant || 'style-1',
          }
        }

        acc[catId].total += trx.amount
        return acc
      },
      {} as Record<
        string,
        {
          id: string
          name: string
          color: string
          total: bigint
          imageUrl?: string
          imageVariant?: string
        }
      >,
    )

    const res = Object.values(grouped)
    return {
      data: serialize(res),
    }
  }
}
