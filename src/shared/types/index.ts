import { PrismaClient } from '@prisma/client'

export type TPrismaClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>
