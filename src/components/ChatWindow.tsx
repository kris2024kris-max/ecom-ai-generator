'use client'
import React, { useState, useRef, useEffect } from 'react'
import Uploader from './UPloader'
import AssetCard from './AssetCard'
import { useChat } from '@/hooks/useChat'
import type { Conversation } from '@/types'
import { getJson } from '@/lib/http'

function hasErrorField(x: unknown): x is { error?: string } {
  return typeof x === 'object' && x !== null && 'error' in (x as Record<string, unknown>)
}

/**
 * 聊天窗口组件
 *
 * 提供完整的聊天界面，包括消息列表、输入框、上传功能等。
 *
 * @returns React组件
 */
export default function ChatWindow() {
  // 输入框的文本内容
  const [input, setInput] = useState<string>('')
  const [uploading, setUploading] = useState<boolean>(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 使用聊天Hook获取所有聊天相关的状态和函数
  const {
    conversationId,
    messages,
    loading,
    imgUrl,
    setImgUrl,
    send,
    lastAssets,
    switchConversation,
    createNewConversation,
  } = useChat()

  /**
   * 加载会话列表
   */
  const loadConversations = async () => {
    try {
      const clientId = typeof window === 'undefined' ? '' : localStorage.getItem('clientId') || ''
      const data = await getJson<{ conversations: Conversation[] }>('/api/conversations', {
        'X-Client-Id': clientId,
      })
      setConversations(data.conversations ?? [])
    } catch (error) {
      console.error('加载会话列表失败:', error)
    }
  }

  /**
   * 初始化时加载会话列表
   */
  useEffect(() => {
    loadConversations()
  }, [])

  /**
   * 当会话切换时重新加载会话列表
   */
  useEffect(() => {
    loadConversations()
  }, [conversationId])

  /**
   * 自动滚动到底部
   * 当有新消息时，自动滚动到消息列表底部
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /**
   * 处理图片上传
   *
   * 使用预签名上传方式：
   * 1. 获取预签名URL
   * 2. 使用预签名URL直接上传文件到存储服务
   * 3. 上传成功后保存图片URL
   */
  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true)

      // 第一步：获取预签名URL
      const presignResponse = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      })

      if (!presignResponse.ok) {
        throw new Error('获取预签名URL失败')
      }

      const presignData = await presignResponse.json()

      // 第二步：使用预签名URL上传文件
      const formData = new FormData()
      formData.append('file', file)
      formData.append('url', presignData.url)
      formData.append('headers', JSON.stringify(presignData.headers))

      const uploadResponse = await fetch('/api/upload/put', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        let msg = '文件上传失败'
        try {
          const data: unknown = await uploadResponse.json()
          if (hasErrorField(data)) {
            const e = data.error
            if (typeof e === 'string' && e.length > 0) msg = e
          }
        } catch {}
        throw new Error(msg)
      }

      // 第三步：上传成功，保存图片URL
      setImgUrl(presignData.publicUrl)
    } catch (error) {
      console.error('图片上传失败:', error)
      alert('图片上传失败，请稍后重试')
    } finally {
      setUploading(false)
    }
  }

  /**
   * 处理发送消息
   *
   * 当用户点击发送按钮或按Enter键时调用。
   */
  const handleSend = () => {
    if (input.trim() && !loading) {
      send(input)
      setInput('') // 清空输入框
      inputRef.current?.focus() // 重新聚焦输入框
    }
  }

  /**
   * 处理键盘事件
   *
   * 当用户按Enter键时发送消息。
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /**
   * 处理创建新会话
   */
  const handleNewConversation = async () => {
    await createNewConversation()
    setSidebarOpen(false)
  }

  /**
   * 处理切换会话
   */
  const handleSwitchConversation = async (id: string) => {
    await switchConversation(id)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* 会话列表侧边栏 */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative md:translate-x-0 z-30 w-64 bg-gray-50 border-r border-gray-200 transition-transform duration-300 ease-in-out h-screen overflow-y-auto`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">对话列表</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-200 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <button
            onClick={handleNewConversation}
            className="w-full btn-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新建对话
          </button>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSwitchConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  conv.id === conversationId
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <div className="truncate">{conv.title || '新对话'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {conv.createdAt ? new Date(conv.createdAt).toLocaleDateString('zh-CN') : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 遮罩层（移动端） */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        <div className="max-w-5xl mx-auto w-full px-4 py-8 md:px-6 lg:px-8">
          {/* 头部区域 */}
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary">
                    电商素材智能生成
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base">
                    基于AI技术，快速生成商品标题、卖点、氛围与短视频脚本
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 消息列表区域 */}
          <div className="space-y-4 mb-6 min-h-[400px]">
            {messages.length === 0 ? (
              /* 空状态 */
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                  <svg
                    className="w-12 h-12 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">开始你的创作之旅</h3>
                <p className="text-gray-500 max-w-md">
                  输入商品描述，上传商品图片，AI将为你生成专业的营销素材
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                // 查找对应的用户消息中的图片URL（用于AI消息显示主图）
                const getUserImageUrl = () => {
                  if (message.role === 'assistant' && message.messageType === 'generated_assets') {
                    // 向前查找最近的一条用户消息
                    for (let i = index - 1; i >= 0; i--) {
                      if (messages[i].role === 'user' && messages[i].metaData?.imageUrl) {
                        return messages[i].metaData.imageUrl
                      }
                    }
                  }
                  return null
                }

                const userImageUrl = getUserImageUrl()

                return (
                  <div key={message.id}>
                    <div
                      className={`message-bubble animate-fade-in ${
                        message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[75%] ${
                          message.role === 'user'
                            ? 'message-bubble-user px-4 py-3'
                            : 'message-bubble-assistant px-4 py-3'
                        }`}
                      >
                        {/* 消息角色标签 */}
                        <div
                          className={`text-xs font-medium mb-2 ${
                            message.role === 'user' ? 'text-white/90' : 'text-blue-600'
                          }`}
                        >
                          {message.role === 'user' ? '👤 你' : '🤖 AI助手'}
                        </div>

                        {/* 消息内容 */}
                        <div
                          className={`${message.role === 'user' ? 'text-white' : 'text-gray-700'}`}
                        >
                          {/* 如果是普通文本消息，显示文本内容 */}
                          {message.messageType !== 'generated_assets' && (
                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                              {message.content}
                            </div>
                          )}

                          {/* 如果是生成的素材消息，显示素材卡片 */}
                          {message.messageType === 'generated_assets' && message.metaData && (
                            <AssetCard data={message.metaData} imageUrl={userImageUrl} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 在用户消息气泡下方显示上传的图片 */}
                    {message.role === 'user' && message.metaData?.imageUrl && (
                      <div className="mt-2 flex justify-end animate-fade-in">
                        <div className="max-w-[85%] md:max-w-[75%] ml-auto">
                          <img
                            src={message.metaData.imageUrl}
                            alt="上传的商品图片"
                            className="w-full max-h-64 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {/* 加载状态指示器 */}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="message-bubble-assistant px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: '0s' }}
                      />
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                    <span className="text-sm">AI正在思考中...</span>
                  </div>
                </div>
              </div>
            )}

            {/* 滚动锚点 */}
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷操作按钮（仅在生成了素材后显示） */}
          {lastAssets && (
            <div className="flex flex-wrap gap-3 mb-6 animate-fade-in">
              <button
                className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
                onClick={() => send('请根据上次结果再优化标题与卖点，突出差异化')}
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                继续优化
              </button>
              <button
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-all duration-200 flex items-center gap-2"
                onClick={() => send('重新生成一版不同风格的素材')}
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                重新生成
              </button>
            </div>
          )}

          {/* 输入区域 */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex gap-3 items-center">
                {/* 上传按钮放在输入框左侧 */}
                <Uploader onImage={handleImageUpload} uploading={uploading} />
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入商品描述、材质、场景、受众等信息..."
                    className="input-modern w-full px-4 py-3 rounded-lg text-gray-700 placeholder-gray-400 focus:placeholder-gray-500 transition-all"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Enter 发送，Shift+Enter 换行
                  </div>
                </div>
                <button
                  disabled={loading || !input.trim()}
                  className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 min-w-[100px] justify-center"
                  onClick={handleSend}
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      生成中
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      发送
                    </>
                  )}
                </button>
              </div>
              {/* 显示当前待上传的图片预览 */}
              {imgUrl && (
                <div className="mt-3 flex items-center gap-2 justify-end">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden ml-auto">
                    <img src={imgUrl} alt="待上传的图片" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImgUrl(null)}
                      className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-bl-lg flex items-center justify-center text-xs hover:bg-red-600"
                      aria-label="删除图片"
                    >
                      ×
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">已选择图片，发送消息时将自动上传</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
