/**
 * AI服务模块 - 电商素材生成
 *
 * 本模块提供了生成电商营销素材的核心服务。
 * 它会调用AI模型生成包含标题、卖点、氛围词和视频脚本的完整素材数据。
 *
 * 工作流程：
 * 1. 构建包含系统提示和对话历史的完整消息列表
 * 2. 调用AI模型生成JSON格式的素材数据
 * 3. 解析并验证返回的JSON数据
 * 4. 如果解析失败，会重试一次（仅使用当前提示，不含历史）
 */

import { volcanoGenerate, ChatMessage } from '@/lib/volcano'
import type { Assets } from '@/types'

/**
 * 系统提示词
 *
 * 定义AI助手的角色和任务，指导它生成符合要求的电商素材。
 */
const SYSTEM_PROMPT = `你是电商运营专家。基于用户上传的商品信息与描述，仅返回一个JSON对象：{"title":string,"selling_points":string[],"atmosphere":string,"video_script":Array<{s:number,v:string}>}，中文输出，标题10-30字，卖点3-5条，脚本3-10秒。`

/**
 * 安全解析JSON字符串
 *
 * 从可能包含额外文本的字符串中提取并解析JSON对象。
 * AI模型有时会在JSON前后添加解释性文本，此函数会尝试提取核心JSON部分。
 *
 * @param text - 可能包含JSON的文本字符串
 * @returns 解析后的对象，如果解析失败则返回null
 *
 * @example
 * ```typescript
 * const text = '这是生成的素材：{"title":"商品标题","selling_points":["卖点1"]}';
 * const data = safeParseJson(text); // 返回解析后的对象
 * ```
 */
function safeParseJson(text: string): Assets | null {
  try {
    // 查找第一个 '{' 和最后一个 '}'
    const first = text.indexOf('{')
    const last = text.lastIndexOf('}')

    // 如果找到了完整的JSON结构，提取核心部分
    if (first >= 0 && last >= 0 && last > first) {
      const core = text.slice(first, last + 1)
      const obj = JSON.parse(core)
      return obj as Assets
    }

    // 如果没有找到，尝试直接解析整个文本
    return JSON.parse(text) as Assets
  } catch (error) {
    // 解析失败，返回null
    console.error('JSON解析失败:', error)
    return null
  }
}

/**
 * 生成电商素材
 *
 * 这是主要的素材生成函数，会根据商品描述和对话历史生成完整的营销素材。
 *
 * @param productDescription - 商品描述文本（用户输入）
 * @param history - 对话历史记录，用于上下文理解
 * @param imageUrl - 可选的商品图片URL，用于多模态生成
 * @returns 生成的素材数据对象，包含title、selling_points、atmosphere、video_script
 *
 * @example
 * ```typescript
 * const assets = await generateAssets(
 *   '这是一款高品质的蓝牙耳机',
 *   [{ role: 'user', content: '我需要为这款耳机生成营销素材' }],
 *   'https://example.com/earphone.jpg'
 * );
 * console.log(assets.title); // 生成的标题
 * console.log(assets.selling_points); // 生成的卖点列表
 * ```
 */
export async function generateAssets(
  productDescription: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  imageUrl?: string
): Promise<Assets | null> {
  // 构建完整的消息列表
  // 1. 系统提示词（定义AI的角色和任务）
  // 2. 对话历史（提供上下文）
  // 3. 当前用户输入（商品描述）
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: productDescription },
  ]

  // 第一次尝试：使用完整上下文生成
  const response = await volcanoGenerate(messages, imageUrl)
  const data = safeParseJson(response)

  // 如果第一次解析成功，直接返回
  if (data) {
    return data
  }

  // 如果第一次解析失败，进行第二次尝试
  // 这次只使用系统提示和当前输入，不使用历史记录
  // 这样可以避免历史记录中的格式问题影响生成
  const retryMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: productDescription },
  ]

  const retryResponse = await volcanoGenerate(retryMessages, imageUrl)
  const retryData = safeParseJson(retryResponse)

  // 返回重试结果（如果还是失败，返回null）
  return retryData
}
