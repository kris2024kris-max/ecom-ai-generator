import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
const defaultDbUrl = `file:${join(dataDir, 'dev.db')}`
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? defaultDbUrl })

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

let dbInitialized = false
export async function ensureDatabaseInitialized() {
  if (dbInitialized) return
  try {
    await prisma.conversation.findFirst()
    dbInitialized = true
  } catch {
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Conversation" ("id" TEXT NOT NULL PRIMARY KEY, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "title" TEXT)'
    )
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Message" ("id" TEXT NOT NULL PRIMARY KEY, "conversationId" TEXT NOT NULL, "role" TEXT NOT NULL, "content" TEXT NOT NULL, "messageType" TEXT NOT NULL, "metaData" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE)'
    )
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId")'
    )
    dbInitialized = true
  }
}
