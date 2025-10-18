type PrismaModel = {
  findMany: (args?: unknown) => Promise<unknown[]>
  count: (args?: unknown) => Promise<number>
}

type ExtractFindManyArgs<M> = M extends {
  findMany: (args?: infer A) => unknown
}
  ? A
  : never

type ExtractFindManyResult<M> = M extends {
  findMany: (args?: unknown) => Promise<infer R>
}
  ? R extends Array<infer T>
    ? T
    : never
  : never

interface PaginateOptions<M extends PrismaModel> {
  model: M
  args?: ExtractFindManyArgs<M>
  page?: number
  limit?: number
  cursor?: string
}

type OffsetMeta = {
  total: number
  page: number | null
  limit: number | null
  pageCount: number
}

type CursorMeta = {
  cursor: string | null
  count: number
  hasMore: boolean
}

interface PaginateResult<T> {
  data: T[]
  meta: OffsetMeta | CursorMeta
}

export async function paginate<M extends PrismaModel>({
  model,
  args,
  page,
  limit,
  cursor,
}: PaginateOptions<M>): Promise<PaginateResult<ExtractFindManyResult<M>>> {
  type ResultType = ExtractFindManyResult<M>
  type RecordWithId = ResultType & { id: string }

  // No pagination
  if (!page && !limit && !cursor) {
    const data = (await model.findMany(args)) as ResultType[]
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
    const cursorArgs = {
      ...(args as object),
      take,
      skip: 1,
      cursor: { id: cursor },
    }
    const data = (await model.findMany(cursorArgs)) as RecordWithId[]

    return {
      data: data as ResultType[],
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

  const offsetArgs = {
    ...(args as object),
    skip,
    take,
  }

  const countArgs =
    args && 'where' in (args as object)
      ? { where: (args as { where?: unknown }).where }
      : undefined

  const [data, total] = await Promise.all([
    model.findMany(offsetArgs) as Promise<ResultType[]>,
    model.count(countArgs),
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
