/**
 * 项目类型定义文件
 * 
 * 本文件定义了整个应用中使用的核心数据类型。
 * 这些类型确保了数据在整个应用中的一致性和类型安全。
 */

/**
 * 消息类型
 * 
 * 表示聊天对话中的一条消息，可以是用户发送的消息或AI助手的回复。
 * 
 * @property id - 消息的唯一标识符（UUID格式）
 * @property conversationId - 所属会话的唯一标识符
 * @property role - 消息发送者角色：'user'（用户）或 'assistant'（AI助手）
 * @property content - 消息的文本内容
 * @property messageType - 消息类型：
 *   - 'text': 普通文本消息
 *   - 'image_upload': 图片上传消息
 *   - 'generated_assets': AI生成的素材数据消息
 * @property metaData - 可选的元数据，通常用于存储AI生成的素材数据（Assets类型）
 * @property createdAt - 消息创建时间戳（毫秒）
 */
export type Message = {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  messageType: 'text' | 'image_upload' | 'generated_assets'
  metaData?: any
  createdAt?: number
}

/**
 * 会话类型
 * 
 * 表示一次完整的对话会话，包含多条消息。
 * 
 * @property id - 会话的唯一标识符（UUID格式）
 * @property createdAt - 会话创建时间戳（毫秒）
 * @property title - 会话标题，通常是商品名称，可选
 */
export type Conversation = {
  id: string
  createdAt: number
  title?: string | null
}

/**
 * 视频脚本片段
 * 
 * 表示短视频脚本中的一个时间片段。
 * 
 * @property s - 片段开始时间（秒）
 * @property v - 片段描述内容
 */
export type VideoScriptSegment = {
  s: number
  v: string
}

/**
 * AI生成的电商素材数据
 * 
 * 包含AI为商品生成的所有营销素材信息。
 * 
 * @property title - 商品标题（10-30字）
 * @property selling_points - 商品卖点列表（3-5条）
 * @property atmosphere - 营销氛围词（如"焕新季"、"限时特惠"等）
 * @property video_script - 短视频脚本，包含多个时间片段
 */
export type Assets = {
  title: string
  selling_points: string[]
  atmosphere: string
  video_script: VideoScriptSegment[]
}