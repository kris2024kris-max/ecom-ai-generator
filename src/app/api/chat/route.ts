/**
 * 聊天API路由
 *
 * 提供聊天对话相关的API端点：
 * - POST: 发送消息并生成AI回复
 * - GET: 获取指定会话的消息历史
 *
 * 路由路径: /api/chat
 */

import { NextRequest, NextResponse } from 'next/server'
import { ensureConversation, addMessage, listMessages } from '@/lib/db'
import type { Message } from '@/types'
import { generateAssets } from '@/services/aiService'

/**
 * POST /api/chat
 *
 * 处理用户发送的消息，生成AI回复并保存到数据库。
 *
 * 请求体：
 * - conversationId?: string - 可选的会话ID，如果不提供则创建新会话
 * - text: string - 用户消息内容（必填）
 * - title?: string - 可选的会话标题（通常是商品名称）
 * - imageUrl?: string - 可选的商品图片URL
 *
 * 响应：
 * - conversationId: string - 会话ID
 * - message: Message - AI生成的回复消息
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     text: '为这款商品生成营销素材',
 *     imageUrl: 'https://example.com/product.jpg'
 *   })
 * });
 * ```
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json()
    const conversationId = body.conversationId as string | undefined
    const text = body.text as string
    const title = body.title as string | undefined
    const imageUrl = body.imageUrl as string | undefined

    // 验证必填字段
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 })
    }

    // 确保会话存在（如果提供了ID则获取，否则创建新会话）
    const conv = ensureConversation(conversationId, title ?? null)

    // 保存用户消息
    addMessage({
      conversationId: conv.id,
      role: 'user',
      content: text,
      messageType: imageUrl ? 'image_upload' : 'text',
      metaData: imageUrl ? { imageUrl } : undefined,
    })

    // 获取对话历史（用于AI生成时的上下文）
    const history = listMessages(conv.id).map((m: Message) => ({
      role: m.role,
      content: m.content,
    }))

    // 调用AI服务生成素材
    const assets = await generateAssets(text, history, imageUrl)

    // 保存AI生成的回复消息
    const assistantMessage = addMessage({
      conversationId: conv.id,
      role: 'assistant',
      content: JSON.stringify(assets), // 将素材数据序列化为JSON字符串
      messageType: 'generated_assets',
      metaData: assets, // 同时保存结构化数据，方便前端直接使用
    })

    // 返回会话ID和AI消息
    return NextResponse.json({
      conversationId: conv.id,
      message: assistantMessage,
    })
  } catch (error: unknown) {
    // 错误处理
    console.error('聊天API错误:', error)
    const msg =
      typeof error === 'object' && error !== null && 'message' in (error as Record<string, unknown>)
        ? String((error as { message?: string }).message)
        : '服务器内部错误'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * GET /api/chat
 *
 * 获取指定会话的所有消息历史。
 *
 * 查询参数：
 * - conversationId: string - 会话ID（必填）
 *
 * 响应：
 * - messages: Message[] - 消息列表，按时间顺序排列
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/chat?conversationId=conv-123');
 * const data = await response.json();
 * console.log(data.messages); // 消息列表
 * ```
 */
export async function GET(req: NextRequest) {
  try {
    // 从URL查询参数中获取会话ID
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    // 验证必填参数
    if (!conversationId) {
      return NextResponse.json({ error: '缺少必要参数：conversationId' }, { status: 400 })
    }

    // 获取会话的所有消息
    const history = listMessages(conversationId)

    // 返回消息列表
    return NextResponse.json({ messages: history })
  } catch (error: unknown) {
    // 错误处理
    console.error('获取消息历史错误:', error)
    const msg =
      typeof error === 'object' && error !== null && 'message' in (error as Record<string, unknown>)
        ? String((error as { message?: string }).message)
        : '服务器内部错误'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
