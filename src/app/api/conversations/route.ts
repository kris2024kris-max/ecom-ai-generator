import { NextRequest, NextResponse } from 'next/server'
import { listConversationsForClientWithMessages, ensureConversation } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-client-id') || ''
    const conversations = clientId ? await listConversationsForClientWithMessages(clientId) : []
    return NextResponse.json({ conversations })
  } catch (error: unknown) {
    console.error('获取会话列表错误:', error)
    const msg =
      typeof error === 'object' && error !== null && 'message' in (error as Record<string, unknown>)
        ? String((error as { message?: string }).message)
        : '服务器内部错误'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const title = body.title as string | undefined

    const conversation = await ensureConversation(undefined, title ?? null)

    return NextResponse.json({ conversation })
  } catch (error: unknown) {
    console.error('创建会话错误:', error)
    const msg =
      typeof error === 'object' && error !== null && 'message' in (error as Record<string, unknown>)
        ? String((error as { message?: string }).message)
        : '服务器内部错误'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
