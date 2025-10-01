import { Injectable } from '@nestjs/common'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { PaginationDto } from 'src/shared/dto/pagination.dto'
import { endOfMonth, startOfMonth } from 'date-fns'
import { paginate } from 'src/shared/utils/pagination'
import { UpdateBudgetDto } from './dto/update-budget.dto'

@Injectable()
export class BudgetService {
  constructor(private db: PrismaService) {}

  async create(data: CreateBudgetDto) {
    return this.db.$transaction(async (prisma) => {
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

    // const data = await this.db.budget.findMany({
    //   include: {
    //     items: {
    //       include: {
    //         category: true,
    //       },
    //     },
    //   },
    //   orderBy: {
    //     startAt: 'desc',
    //   },
    // })

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
          category: i.category,
          planned: i.planned,
          actual: i.actual,
          progress,
        }
      })

      return {
        ...budget,
        remaining: budget.total - totalActual,
        usage,
        categories,
      }
    })

    return {
      data: budgets,
      meta: data.meta,
    }
  }
}
