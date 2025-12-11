import type { Conversation, Message } from '@/types'
import { prisma, ensureDatabaseInitialized } from './prisma'

function dateToTimestamp(date: Date | number | string): number {
  if (date instanceof Date) return date.getTime()
  if (typeof date === 'number') return date
  const t = Date.parse(String(date))
  return Number.isNaN(t) ? Date.now() : t
}

function prismaMessageToMessage(msg: unknown): Message {
  const m = msg as {
    id: string
    conversationId: string
    role: string
    content: string
    messageType: string
    metaData?: unknown
    createdAt: string | number | Date
  }
  return {
    id: m.id,
    conversationId: m.conversationId,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    messageType: m.messageType as 'text' | 'image_upload' | 'generated_assets',
    metaData: (m.metaData as unknown) ?? null,
    createdAt: dateToTimestamp(m.createdAt),
  }
}

function prismaConversationToConversation(conv: unknown): Conversation {
  const c = conv as { id: string; createdAt: string | number | Date; title: string | null }
  return {
    id: c.id,
    createdAt: dateToTimestamp(c.createdAt),
    title: c.title,
  }
}

export async function ensureConversation(
  id?: string,
  title?: string | null
): Promise<Conversation> {
  await ensureDatabaseInitialized()
  if (id) {
    const existing = await prisma.conversation.findUnique({ where: { id } })
    if (existing) return prismaConversationToConversation(existing)
  }
  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (id) data.id = id
  const created = await prisma.conversation.create({ data })
  return prismaConversationToConversation(created)
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const conv = await prisma.conversation.findUnique({ where: { id } })
  return conv ? prismaConversationToConversation(conv) : null
}

export async function listConversations(): Promise<Conversation[]> {
  await ensureDatabaseInitialized()
  const convs = await prisma.conversation.findMany({ orderBy: { createdAt: 'desc' } })
  return convs.map(prismaConversationToConversation)
}

export async function listConversationsWithMessages(): Promise<Conversation[]> {
  await ensureDatabaseInitialized()
  const convs = await prisma.conversation.findMany({
    where: { messages: { some: {} } },
    orderBy: { createdAt: 'desc' },
  })
  return convs.map(prismaConversationToConversation)
}

export async function listConversationsForClientWithMessages(
  clientId: string
): Promise<Conversation[]> {
  await ensureDatabaseInitialized()
  const convs = await prisma.conversation.findMany({
    where: { title: clientId, messages: { some: {} } },
    orderBy: { createdAt: 'desc' },
  })
  return convs.map(prismaConversationToConversation)
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  await ensureDatabaseInitialized()
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  })
  return messages.map(prismaMessageToMessage)
}

export async function addMessage(input: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
  await ensureDatabaseInitialized()
  const created = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      messageType: input.messageType,
      metaData: input.metaData ?? null,
    },
  })
  return prismaMessageToMessage(created)
}

export type { Conversation, Message }
