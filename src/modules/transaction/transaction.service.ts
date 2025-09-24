import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { addHours, format } from 'date-fns'

import { CreateTransactionDto } from './dto/create-transaction.dto'
import { PaginationDto } from 'src/shared/dto/pagination.dto'

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { paginate } from 'src/shared/utils/pagination'

import { WalletService } from '../wallet/wallet.service'

@Injectable()
export class TransactionService {
  constructor(
    private db: PrismaService,
    private walletService: WalletService,
  ) {}

  async create(data: CreateTransactionDto) {
    const { amount, walletId, type } = data

    return this.db.$transaction(async (prisma) => {
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
        },
      })
      return { data: newTransaction }
    })
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

      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          ...data,
          date: normalizedDate,
        },
      })
      return { data: updatedTransaction }
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
  }: {
    pagination: PaginationDto
    month?: number
    year?: number
  }) {
    let dateFilter = {}
    if (monthIndex != null && year != null) {
      const startDate = new Date(year, monthIndex, 1, 0, 0, 0)
      const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59)
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
          AND: [{ deletedAt: null }, dateFilter],
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
              date: dateKey,
              total: 0,
              transactions: [],
            }
          }

          acc[dateKey].total += trx.amount
          acc[dateKey].transactions.push(trx)

          return acc
        },
        {} as Record<
          string,
          {
            date: string
            total: number
            transactions: typeof transactions.data
          }
        >,
      ),
    )

    return {
      data: grouped,
      meta: transactions.meta,
    }
  }
}
