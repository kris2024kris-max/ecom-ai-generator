/**
 * 聊天Hook - useChat
 *
 * 这是一个自定义React Hook，用于管理聊天对话的状态和操作。
 * 它提供了完整的聊天功能，包括：
 * - 会话管理（自动创建或恢复会话）
 * - 消息列表管理
 * - 发送消息并获取AI回复
 * - 图片上传管理
 * - 加载状态管理
 *
 * 使用示例：
 * ```typescript
 * const { messages, loading, send, imgUrl, setImgUrl, lastAssets } = useChat();
 *
 * // 发送消息
 * await send('为这款商品生成营销素材');
 *
 * // 设置图片
 * setImgUrl('https://example.com/product.jpg');
 * ```
 */

'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import type { Message, Assets, Conversation } from '@/types'
import { getJson, postJson } from '@/lib/http'

/**
 * useChat Hook的返回值类型
 */
export interface UseChatReturn {
  /** 当前会话ID */
  conversationId: string
  /** 消息列表 */
  messages: Message[]
  /** 是否正在加载（发送消息时） */
  loading: boolean
  /** 当前上传的图片URL */
  imgUrl: string | null
  /** 设置图片URL的函数 */
  setImgUrl: (url: string | null) => void
  /** 发送消息的函数 */
  send: (text: string) => Promise<void>
  /** 最后一次生成的素材数据 */
  lastAssets: Assets | undefined
  /** 切换会话的函数 */
  switchConversation: (conversationId: string) => Promise<void>
  /** 创建新会话的函数 */
  createNewConversation: () => Promise<void>
}

/**
 * 聊天Hook
 *
 * 管理聊天对话的完整状态和操作。
 *
 * @returns UseChatReturn - 包含所有聊天相关的状态和函数
 */
export function useChat(): UseChatReturn {
  // 会话ID状态
  const [conversationId, setConversationId] = useState<string>('')

  // 消息列表状态
  const [messages, setMessages] = useState<Message[]>([])

  // 加载状态（发送消息时）
  const [loading, setLoading] = useState<boolean>(false)

  // 图片URL状态
  const [imgUrl, setImgUrl] = useState<string | null>(null)

  const [clientId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    const existing = localStorage.getItem('clientId')
    if (existing && existing.length > 0) return existing
    const cid = crypto.randomUUID()
    localStorage.setItem('clientId', cid)
    return cid
  })

  /**
   * 加载会话消息
   */
  const loadConversation = useCallback(
    async (cid: string) => {
      try {
        const data = await getJson<{ messages: Message[] }>(`/api/chat?conversationId=${cid}`, {
          'X-Client-Id': clientId,
        })
        setMessages(data.messages ?? [])
        setConversationId(cid)
        localStorage.setItem('cid', cid)
      } catch (error) {
        console.error('加载消息历史失败:', error)
        setMessages([])
      }
    },
    [clientId]
  )

  /**
   * 初始化会话
   *
   * 在组件挂载时：
   * 1. 优先从数据库加载最新的会话
   * 2. 如果没有会话，则从localStorage恢复或创建新会话
   */
  useEffect(() => {
    async function init() {
      try {
        // 先尝试从数据库加载所有会话
        const conversationsData = await getJson<{ conversations: Conversation[] }>(
          '/api/conversations',
          { 'X-Client-Id': clientId }
        )
        const conversations = conversationsData.conversations ?? []

        if (conversations.length > 0) {
          // 如果有历史会话，加载最新的一个
          const latestConv = conversations[0]
          await loadConversation(latestConv.id)
        } else {
          // 如果没有历史会话，尝试从localStorage恢复
          const storedCid = localStorage.getItem('cid')
          if (storedCid) {
            try {
              await loadConversation(storedCid)
            } catch {
              // 如果localStorage的ID无效，创建新会话
              await createNewConversation()
            }
          } else {
            // 创建新会话
            await createNewConversation()
          }
        }
      } catch (error) {
        console.error('初始化会话失败:', error)
        // 如果都失败了，尝试从localStorage恢复
        const storedCid = localStorage.getItem('cid')
        if (storedCid) {
          await loadConversation(storedCid)
        } else {
          await createNewConversation()
        }
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 计算最后一次生成的素材数据
   *
   * 从消息列表中查找最后一条类型为 'generated_assets' 的消息，
   * 并返回其metaData（素材数据）。
   */
  const lastAssets = useMemo(() => {
    // 从后往前查找最后一条生成的素材消息
    const reversedMessages = [...messages].reverse()
    const lastAssetMessage = reversedMessages.find((msg) => msg.messageType === 'generated_assets')

    // 返回素材数据
    return lastAssetMessage?.metaData as Assets | undefined
  }, [messages])

  /**
   * 发送消息
   *
   * 向服务器发送用户消息，获取AI回复，并更新消息列表。
   *
   * @param text - 要发送的消息文本
   * @returns Promise，在消息发送完成后resolve
   *
   * @example
   * ```typescript
   * await send('为这款商品生成营销素材');
   * ```
   */
  async function send(text: string): Promise<void> {
    // 验证输入
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('消息内容不能为空')
      return
    }

    try {
      // 设置加载状态
      setLoading(true)

      let cid = conversationId
      if (!cid) {
        const created = await postJson<{ conversation: Conversation }>(
          '/api/conversations',
          { title: clientId },
          { 'X-Client-Id': clientId }
        )
        cid = created.conversation.id
        await loadConversation(cid)
      }

      // 创建临时用户消息（用于立即显示在UI中）
      const tempUserMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: cid,
        role: 'user',
        content: text,
        messageType: imgUrl ? 'image_upload' : 'text',
        metaData: imgUrl ? { imageUrl: imgUrl } : undefined,
        createdAt: Date.now(),
      }

      // 立即添加用户消息到列表（乐观更新）
      setMessages((prev) => [...prev, tempUserMessage])

      // 发送消息到服务器并获取AI回复
      const data = await postJson<{ message: Message }>(
        '/api/chat',
        {
          conversationId: cid,
          text,
          imageUrl: imgUrl ?? undefined,
          title: clientId,
        },
        { 'X-Client-Id': clientId }
      )

      // 更新消息列表，移除临时消息，添加服务器返回的完整消息和AI回复
      setMessages((prev) => {
        // 移除临时用户消息
        const withoutTemp = prev.filter((msg) => msg.id !== tempUserMessage.id)
        // 创建完整的用户消息（包含图片URL）
        const userMessage: Message = {
          ...tempUserMessage,
          id: crypto.randomUUID(),
        }
        // 添加用户消息和服务器返回的AI消息
        return [...withoutTemp, userMessage, data.message]
      })

      // 发送消息后清空图片URL（可选，根据需求决定是否保留）
      // setImgUrl(null)
    } catch (error) {
      // 错误处理
      console.error('发送消息失败:', error)

      // 移除临时用户消息（因为发送失败）
      setMessages((prev) => prev.filter((msg) => msg.role !== 'user' || msg.content !== text))

      // 可以在这里添加错误提示（如使用toast库）
      alert('发送消息失败，请稍后重试')
    } finally {
      // 无论成功或失败，都要取消加载状态
      setLoading(false)
    }
  }

  /**
   * 切换会话
   *
   * @param newConversationId - 要切换到的会话ID
   */
  const switchConversation = useCallback(
    async (newConversationId: string) => {
      if (newConversationId === conversationId) return
      setImgUrl(null) // 切换会话时清空图片
      await loadConversation(newConversationId)
    },
    [conversationId, loadConversation, setImgUrl]
  )

  /**
   * 创建新会话
   */
  const createNewConversation = useCallback(async () => {
    try {
      const data = await postJson<{ conversation: Conversation }>(
        '/api/conversations',
        { title: clientId },
        { 'X-Client-Id': clientId }
      )
      await loadConversation(data.conversation.id)
    } catch (error) {
      console.error('创建新会话失败:', error)
      alert('创建新会话失败，请稍后重试')
    }
  }, [loadConversation, clientId])

  // 返回所有状态和函数
  return {
    conversationId,
    messages,
    loading,
    imgUrl,
    setImgUrl,
    send,
    lastAssets,
    switchConversation,
    createNewConversation,
  }
}
