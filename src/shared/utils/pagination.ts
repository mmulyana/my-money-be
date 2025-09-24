import { Prisma } from '@prisma/client'

interface PaginateOptions<T extends Prisma.CategoryFindManyArgs> {
  model: any
  args?: T
  page?: number
  limit?: number
  cursor?: string
}

export async function paginate<T>({
  model,
  args,
  page,
  limit,
  cursor,
}: PaginateOptions<any>) {
  if (!page && !limit && !cursor) {
    const data = await model.findMany(args)
    return {
      data,
      meta: {
        total: data.length,
        page: null,
        limit: null,
        pageCount: 1,
      },
    }
  }

  // Cursor pagination
  if (cursor) {
    const take = limit ?? 10
    const data = await model.findMany({
      ...args,
      take,
      skip: 1, // skip cursor itself
      cursor: { id: cursor },
    })

    return {
      data,
      meta: {
        cursor: data.length ? data[data.length - 1].id : null,
        count: data.length,
        hasMore: data.length === take,
      },
    }
  }

  // Offset pagination
  const currentPage = page ?? 1
  const take = limit ?? 10
  const skip = (currentPage - 1) * take

  const [data, total] = await Promise.all([
    model.findMany({
      ...args,
      skip,
      take,
    }),
    model.count({ where: args?.where }),
  ])

  return {
    data,
    meta: {
      total,
      page: currentPage,
      limit: take,
      pageCount: Math.ceil(total / take),
    },
  }
}
