import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { endOfMonth, startOfMonth } from 'date-fns'
import { paginate } from 'src/shared/utils/pagination'
import { CreateBudgetItemDto } from './dto/create-budget-item.dto'
import { UpdateBudgetDto } from './dto/update-budget.dto'
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto'

@Injectable()
export class BudgetService {
  constructor(private db: PrismaService) {}

  async create(data: CreateBudgetDto) {
    return this.db.$transaction(async (prisma) => {
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

      return await prisma.budget.create({
        data: {
          endAt: data.endAt,
          name: data.name,
          startAt: data.startAt,
          total: data.total,
          walletId: data.walletId,
          items: {
            create: data.categories?.map((c) => ({
              categoryId: c.categoryId,
              planned: c.planned,
            })),
          },
        },
        include: {
          items: true,
        },
      })
    })
  }

  async update(id: string, data: UpdateBudgetDto) {
    return await this.db.budget.update({
      where: { id },
      data,
    })
  }

  async remove(id: string) {
    return await this.db.budget.delete({ where: { id } })
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
      const baseDate = new Date(year, monthIndex, 1)

      const startDate = startOfMonth(baseDate)
      const endDate = endOfMonth(baseDate)

      dateFilter = {
        // event dimulai di bulan ini
        OR: [
          {
            startAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          // atau event mulai sebelum bulan ini
          // tapi masih berakhir di bulan ini atau setelahnya
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

    const data = await paginate({
      model: this.db.budget,
      args: {
        where: {
          AND: [dateFilter],
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

    const budgets = data?.data?.map((budget) => {
      const totalActual = budget.items.reduce(
        (acc, item) => acc + item.actual,
        0,
      )
      const usage =
        budget.total > 0 ? Math.round((totalActual / budget.total) * 100) : 0

      const categories = budget.items.map((i) => {
        const progress =
          i.planned > 0 ? Math.round((i.actual / i.planned) * 100) : 0

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
        wallet: budget.wallet,
        total: budget.total,
        remaining: budget.total - totalActual,
        spent: totalActual,
        usage,
        categories,
      }
    })

    return {
      data: budgets,
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

    return this.db.budgetItem.create({
      data: {
        planned: body.planned,
        budgetId: body.budgetId,
        categoryId: body.categoryId,
      },
    })
  }

  async updateItem(id: string, body: UpdateBudgetItemDto) {
    return this.db.budgetItem.update({
      data: {
        planned: body.planned,
        categoryId: body.categoryId,
      },
      where: {
        id,
      },
    })
  }

  async removeItem(id: string) {
    return this.db.$transaction(async (prisma) => {
      await prisma.budgetItemTransaction.deleteMany({
        where: { budgetItemId: id },
      })

      return prisma.budgetItem.delete({ where: { id } })
    })
  }
}
