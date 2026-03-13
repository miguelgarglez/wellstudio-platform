import { PrismaClient } from '@prisma/client'

declare global {
  var __wellstudioPrisma__: PrismaClient | undefined
}

export const prisma =
  globalThis.__wellstudioPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__wellstudioPrisma__ = prisma
}
