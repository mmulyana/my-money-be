export function serialize(obj: any): any {
  if (obj === null || obj === undefined) return obj

  // BigInt -> string
  if (typeof obj === 'bigint') return obj.toString()

  // Date -> ISO string
  if (obj instanceof Date) return obj.toISOString()

  // Array -> serialize item
  if (Array.isArray(obj)) return obj.map(serialize)

  // Object -> rekursif serialize
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serialize(v)]),
    )
  }

  return obj
}
