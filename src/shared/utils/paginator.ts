export type OffsetMeta = {
  total: number
  page: number
  limit: number
  pageCount: number
}

export type CursorMeta = {
  cursor: string | null
  count: number
  hasMore: boolean
}

export type PaginateResult<T> = {
  data: T[]
  meta: OffsetMeta | CursorMeta
}

export function createPaginator<
  D extends {
    findMany: (...args: any[]) => any
    count: (...args: any[]) => any
  },
>(model: D) {
  return async <
    A extends Parameters<D['findMany']>[0],
    R = A extends Parameters<D['findMany']>[0]
      ? Awaited<ReturnType<D['findMany']>>[number]
      : Awaited<ReturnType<D['findMany']>>[number],
  >({
    args,
    page,
    limit = 10,
    cursor,
  }: {
    args?: A
    page?: number
    limit?: number
    cursor?: string
  }): Promise<PaginateResult<R>> => {
    // Cursor pagination
    if (cursor) {
      const cursorArgs = {
        ...(args as object),
        take: limit,
        skip: 1,
        cursor: { id: cursor },
      }

      const data = (await model.findMany(cursorArgs)) as R[]

      return {
        data,
        meta: {
          cursor: data.length ? (data.at(-1) as any).id : null,
          count: data.length,
          hasMore: data.length === limit,
        },
      }
    }

    // Offset pagination
    const currentPage = page ?? 1
    const skip = (currentPage - 1) * limit

    const offsetArgs = {
      ...(args as object),
      skip,
      take: limit,
    }

    const countArgs =
      args && 'where' in (args as object)
        ? { where: (args as { where?: unknown }).where }
        : undefined

    const [data, total] = await Promise.all([
      model.findMany(offsetArgs) as Promise<R[]>,
      model.count(countArgs),
    ])

    return {
      data,
      meta: {
        total,
        page: currentPage,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    }
  }
}
