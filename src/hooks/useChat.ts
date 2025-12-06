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

"use client"
import { useEffect, useMemo, useState } from 'react'
import type { Message, Assets } from '@/types'
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

  /**
   * 初始化会话
   * 
   * 在组件挂载时：
   * 1. 从localStorage获取或创建新的会话ID
   * 2. 加载该会话的历史消息
   */
  useEffect(() => {
    // 从localStorage获取会话ID，如果没有则创建新的
    const storedCid = localStorage.getItem('cid')
    const cid = storedCid || crypto.randomUUID()
    
    // 保存到localStorage，以便刷新页面后恢复会话
    localStorage.setItem('cid', cid)
    setConversationId(cid)

    // 加载会话的历史消息
    getJson<{ messages: Message[] }>(`/api/chat?conversationId=${cid}`)
      .then((data) => {
        setMessages(data.messages ?? [])
      })
      .catch((error) => {
        console.error('加载消息历史失败:', error)
        // 如果加载失败，初始化为空列表
        setMessages([])
      })
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
    const lastAssetMessage = reversedMessages.find(
      (msg) => msg.messageType === 'generated_assets'
    )
    
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

    // 如果没有会话ID，无法发送消息
    if (!conversationId) {
      console.error('会话ID未初始化')
      return
    }

    try {
      // 设置加载状态
      setLoading(true)

      // 创建临时用户消息（用于立即显示在UI中）
      const tempUserMessage: Message = {
        id: crypto.randomUUID(),
        conversationId,
        role: 'user',
        content: text,
        messageType: 'text',
        createdAt: Date.now()
      }

      // 立即添加用户消息到列表（乐观更新）
      setMessages((prev) => [...prev, tempUserMessage])

      // 发送消息到服务器并获取AI回复
      const data = await postJson<{ message: Message }>('/api/chat', {
        conversationId,
        text,
        imageUrl: imgUrl ?? undefined
      })

      // 更新消息列表，移除临时消息，添加服务器返回的完整消息和AI回复
      setMessages((prev) => {
        // 移除临时用户消息
        const withoutTemp = prev.filter((msg) => msg.id !== tempUserMessage.id)
        // 添加服务器返回的AI消息
        return [...withoutTemp, data.message]
      })
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

  // 返回所有状态和函数
  return {
    conversationId,
    messages,
    loading,
    imgUrl,
    setImgUrl,
    send,
    lastAssets
  }
}
