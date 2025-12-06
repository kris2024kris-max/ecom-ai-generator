/**
 * 数据库层 - 内存存储实现
 * 
 * 本模块提供了一个基于内存的数据存储系统，用于管理会话和消息数据。
 * 注意：这是开发阶段的临时实现，生产环境应使用持久化数据库（如Prisma + PostgreSQL）。
 * 
 * 工作原理：
 * 1. 使用Map数据结构在内存中存储会话和消息
 * 2. 通过全局变量实现单例模式，确保数据在请求间共享
 * 3. 提供简单的CRUD操作接口
 */

import type { Conversation, Message } from '@/types'

/**
 * 内存存储类
 * 
 * 使用Map数据结构存储会话和消息数据。
 * 每个会话对应一个消息列表。
 */
class MemoryStore {
  /** 存储所有会话，key为会话ID，value为会话对象 */
  conversations: Map<string, Conversation>
  
  /** 存储所有消息，key为会话ID，value为该会话的消息列表 */
  messages: Map<string, Message[]>

  /**
   * 构造函数
   * 初始化两个空的Map来存储数据
   */
  constructor() {
    this.conversations = new Map()
    this.messages = new Map()
  }

  /**
   * 创建新会话
   * 
   * @param id - 可选的会话ID，如果不提供则自动生成UUID
   * @param title - 可选的会话标题（通常是商品名称）
   * @returns 新创建的会话对象
   */
  createConversation(id?: string, title?: string | null): Conversation {
    // 如果没有提供ID，则生成一个唯一的UUID
    const cid = id ?? crypto.randomUUID()
    
    // 创建会话对象
    const conv: Conversation = {
      id: cid,
      createdAt: Date.now(),
      title: title ?? null
    }
    
    // 存储会话和初始化空消息列表
    this.conversations.set(cid, conv)
    this.messages.set(cid, [])
    
    return conv
  }

  /**
   * 根据ID获取会话
   * 
   * @param id - 会话ID
   * @returns 会话对象，如果不存在则返回null
   */
  getConversation(id: string): Conversation | null {
    return this.conversations.get(id) ?? null
  }

  /**
   * 获取指定会话的所有消息
   * 
   * @param conversationId - 会话ID
   * @returns 消息列表，如果会话不存在则返回空数组
   */
  listMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) ?? []
  }

  /**
   * 向指定会话添加消息
   * 
   * @param msg - 消息对象（不包含id和createdAt，这些会自动生成）
   * @returns 完整的消息对象（包含自动生成的id和createdAt）
   */
  addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
    // 创建完整的消息对象，自动生成ID和时间戳
    const full: Message = {
      ...msg,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    }
    
    // 获取或创建该会话的消息列表
    const list = this.messages.get(msg.conversationId) ?? []
    list.push(full)
    this.messages.set(msg.conversationId, list)
    
    return full
  }
}

/**
 * 全局存储实例
 * 
 * 使用全局变量实现单例模式，确保在Next.js的服务器端渲染中，
 * 所有请求共享同一个存储实例。
 * 注意：在开发模式下，热重载可能会导致数据丢失。
 */
const store = (globalThis as any).__ecom_ai_store ?? new MemoryStore();
(globalThis as any).__ecom_ai_store = store;

/**
 * 确保会话存在
 * 
 * 如果提供了会话ID且该会话已存在，则返回现有会话；
 * 否则创建新会话。
 * 
 * @param id - 可选的会话ID
 * @param title - 可选的会话标题
 * @returns 会话对象（保证不为null）
 * 
 * @example
 * ```typescript
 * // 创建新会话
 * const conv = ensureConversation(undefined, "商品A");
 * 
 * // 获取或创建指定ID的会话
 * const conv2 = ensureConversation("existing-id");
 * ```
 */
export function ensureConversation(id?: string, title?: string | null): Conversation {
  // 如果提供了ID且会话已存在，直接返回
  if (id) {
    const existing = store.getConversation(id)
    if (existing) {
      return existing
    }
  }
  
  // 否则创建新会话
  return store.createConversation(id, title ?? null)
}

/**
 * 根据ID获取会话
 * 
 * @param id - 会话ID
 * @returns 会话对象，如果不存在则返回null
 */
export function getConversation(id: string): Conversation | null {
  return store.getConversation(id)
}

/**
 * 获取指定会话的所有消息
 * 
 * @param conversationId - 会话ID
 * @returns 消息列表，按时间顺序排列
 */
export function listMessages(conversationId: string): Message[] {
  return store.listMessages(conversationId)
}

/**
 * 向指定会话添加消息
 * 
 * @param input - 消息对象（不包含id和createdAt）
 * @returns 完整的消息对象（包含自动生成的id和createdAt）
 * 
 * @example
 * ```typescript
 * const message = addMessage({
 *   conversationId: "conv-123",
 *   role: "user",
 *   content: "这是一款优质商品",
 *   messageType: "text"
 * });
 * ```
 */
export function addMessage(input: Omit<Message, 'id' | 'createdAt'>): Message {
  return store.addMessage(input)
}

// 导出类型供其他模块使用
export type { Conversation, Message }