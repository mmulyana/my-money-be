import { PrismaClient } from '@prisma/client'

export type TPrismaClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>

export type JwtPayload = {
  id: string
  username: string
  email: string
}
