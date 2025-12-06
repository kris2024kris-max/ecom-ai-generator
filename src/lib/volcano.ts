/**
 * AI生成服务 - 火山引擎（豆包）集成
 * 
 * 本模块集成了火山引擎的豆包AI模型，用于生成电商营销素材。
 * 如果AI服务不可用，会回退到模拟数据生成。
 * 
 * 环境变量配置：
 * - DOUBAO_API_KEY: 豆包API密钥
 * - DOUBAO_ENDPOINT: 豆包API端点URL
 * - DOUBAO_MODEL: 使用的模型名称（默认：doubao-seed-1-6-251015）
 */

/**
 * 聊天消息类型
 * 
 * @property role - 消息角色：'system'（系统提示）、'user'（用户）、'assistant'（AI助手）
 * @property content - 消息内容
 */
type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 尝试调用豆包AI API生成内容
 * 
 * 此函数会调用火山引擎的豆包API，支持文本和图片输入。
 * 
 * @param messages - 对话消息列表，包含系统提示和用户消息
 * @param imageUrl - 可选的图片URL，用于多模态输入（图片+文本）
 * @param model - 可选的模型名称，如果不提供则使用环境变量中的默认模型
 * @returns AI生成的文本内容，如果调用失败则返回null
 * 
 * @example
 * ```typescript
 * const messages = [
 *   { role: 'system', content: '你是一个电商专家' },
 *   { role: 'user', content: '为这款商品生成标题和卖点' }
 * ];
 * const result = await tryDoubao(messages, 'https://example.com/product.jpg');
 * ```
 */
async function tryDoubao(
  messages: ChatMessage[],
  imageUrl?: string,
  model?: string
): Promise<string | null> {
  // 获取API配置
  const apiKey = process.env.DOUBAO_API_KEY
  const endpoint = process.env.DOUBAO_ENDPOINT
  
  // 如果缺少必要的配置，直接返回null
  if (!apiKey || !endpoint) {
    return null
  }

  try {
    // 选择使用的模型（优先使用传入的模型，否则使用环境变量，最后使用默认值）
    const chosenModel = model || process.env.DOUBAO_MODEL || 'doubao-seed-1-6-251015'
    
    // 将消息转换为API所需的格式
    // 如果最后一条用户消息有图片，则将其转换为多模态格式
    const mapped = messages.map((m, idx) => {
      // 如果是最后一条用户消息且提供了图片URL，则添加图片输入
      if (m.role === 'user' && imageUrl && idx === messages.length - 1) {
        return {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: m.content }
          ]
        }
      }
      
      // 普通文本消息
      return {
        role: m.role,
        content: [{ type: 'text', text: m.content }]
      }
    })

    // 调用豆包API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: mapped,
        max_completion_tokens: 2048 // 最大生成token数
      })
    })

    // 检查响应状态
    if (!response.ok) {
      return null
    }

    // 解析响应并提取生成的文本
    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content ?? ''
    
    return text as string
  } catch (error) {
    // 发生任何错误都返回null，让调用方使用备用方案
    console.error('豆包API调用失败:', error)
    return null
  }
}

/**
 * 模拟生成电商素材数据
 * 
 * 当AI服务不可用时，使用此函数生成模拟数据。
 * 这是一个简单的备用方案，确保系统始终能够返回数据。
 * 
 * @param prompt - 用户输入的商品描述
 * @returns JSON格式的素材数据字符串
 */
function mockGenerate(prompt: string): string {
  // 从提示词中提取标题（前24个字符），如果没有则使用默认值
  const title = prompt.slice(0, 24) || '优选好物'
  
  // 默认卖点列表
  const selling_points = [
    '品质保障',
    '便捷实用',
    '性价比高',
    '口碑推荐'
  ]
  
  // 默认氛围词
  const atmosphere = '焕新季'
  
  // 默认视频脚本（时间片段）
  const video_script = [
    { s: 0, v: '开场特写' },
    { s: 2, v: '使用场景展示' },
    { s: 6, v: '卖点字幕与下单引导' }
  ]
  
  // 返回JSON格式的字符串
  return JSON.stringify({ title, selling_points, atmosphere, video_script })
}

/**
 * 使用火山引擎生成内容
 * 
 * 这是主要的生成函数，会先尝试调用豆包API，如果失败则使用模拟数据。
 * 
 * @param messages - 对话消息列表
 * @param imageUrl - 可选的图片URL
 * @param model - 可选的模型名称
 * @returns 生成的文本内容（JSON格式的素材数据）
 * 
 * @example
 * ```typescript
 * const messages = [
 *   { role: 'system', content: '你是电商运营专家' },
 *   { role: 'user', content: '为这款商品生成营销素材' }
 * ];
 * const result = await volcanoGenerate(messages, 'https://example.com/product.jpg');
 * ```
 */
export async function volcanoGenerate(
  messages: ChatMessage[],
  imageUrl?: string,
  model?: string
): Promise<string> {
  // 首先尝试调用豆包API
  const text = await tryDoubao(messages, imageUrl, model)
  
  // 如果API调用成功且返回了有效内容，直接返回
  if (text && typeof text === 'string' && text.trim().length > 0) {
    return text
  }
  
  // 如果API调用失败，使用模拟数据
  // 从消息历史中找到最后一条用户消息作为提示词
  const reversedMessages = [...messages].reverse()
  const lastUserMessage = reversedMessages.find(m => m.role === 'user')?.content ?? ''
  
  return mockGenerate(lastUserMessage)
}

// 导出类型供其他模块使用
export type { ChatMessage }
