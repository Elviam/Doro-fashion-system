import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/index.js'

function getDatabaseUrl(connectionUrl) {
  const url = new URL(connectionUrl)
  url.searchParams.delete('channel_binding')
  return url.toString()
}

export function createPrismaClient(connectionUrl = process.env.DATABASE_URL) {
  return new PrismaClient({
    datasources: {
      db: { url: getDatabaseUrl(connectionUrl) }
    }
  })
}

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
