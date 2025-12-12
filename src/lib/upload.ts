/**
 * 文件上传服务模块
 *
 * 本模块提供了与S3兼容的对象存储服务（如阿里云OSS、AWS S3等）的集成功能。
 * 支持两种上传方式：
 * 1. 直接上传：服务器端直接上传文件到存储服务
 * 2. 预签名上传：生成预签名URL，允许客户端直接上传到存储服务
 *
 * 环境变量配置说明：
 * - UPLOAD_ACCESS_KEY_ID: 存储服务的访问密钥ID
 * - UPLOAD_SECRET_ACCESS_KEY: 存储服务的访问密钥（支持Base64编码）
 * - UPLOAD_BUCKET: 存储桶名称
 * - UPLOAD_ENDPOINT: 存储服务端点（如：oss-cn-beijing.aliyuncs.com）
 * - UPLOAD_REGION: 存储区域（默认：cn-beijing）
 * - UPLOAD_SERVICE_NAME: 服务名称（默认：s3）
 * - UPLOAD_PUBLIC_BASE: 公共访问的基础URL（可选，用于CDN加速）
 */

import crypto from 'crypto'
// @ts-expect-error - aws4库的类型定义不完整，但功能正常
import aws4 from 'aws4'

type AwsRequest = {
  host: string
  path: string
  method: 'PUT' | 'GET' | 'POST' | 'DELETE'
  headers: Record<string, string>
  service: string
  region: string
  signQuery?: boolean
}

/**
 * 从环境变量获取配置
 *
 * @returns 配置对象，包含所有必要的上传配置
 * @throws 如果缺少必要的环境变量，抛出错误
 */
function getUploadConfig() {
  const accessKeyId = process.env.UPLOAD_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.UPLOAD_SECRET_ACCESS_KEY || ''
  const bucket = process.env.UPLOAD_BUCKET || ''
  const endpoint = process.env.UPLOAD_ENDPOINT || ''
  const region = process.env.UPLOAD_REGION || 'cn-beijing'
  const service = process.env.UPLOAD_SERVICE_NAME || 's3'
  const base = process.env.UPLOAD_PUBLIC_BASE

  // 验证必要的环境变量
  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error(
      '缺少必要的上传配置环境变量：UPLOAD_ACCESS_KEY_ID, UPLOAD_SECRET_ACCESS_KEY, UPLOAD_BUCKET, UPLOAD_ENDPOINT'
    )
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    region,
    service,
    base,
  }
}

/**
 * 解码可能被Base64编码的密钥
 *
 * 某些部署环境可能会将密钥进行Base64编码存储，此函数尝试解码。
 *
 * @param secretAccessKey - 可能是Base64编码的密钥
 * @returns 解码后的密钥，如果解码失败则返回原密钥
 */
function decodeSecretKey(secretAccessKey: string): string {
  try {
    // 尝试Base64解码
    const decoded = Buffer.from(secretAccessKey, 'base64').toString('utf8')

    // 验证解码后的内容是否看起来像有效的密钥
    // 密钥通常包含字母、数字和特殊字符
    if (decoded && /[A-Za-z0-9!@#$%^&*()_+\-=]/.test(decoded)) {
      return decoded
    }
  } catch {
    // 解码失败，返回原密钥
  }

  return secretAccessKey
}

/**
 * 直接上传文件缓冲区到S3兼容的存储服务
 *
 * 此函数在服务器端执行，直接将文件数据上传到存储服务。
 * 适用于小文件或需要服务器端处理的场景。
 *
 * @param buf - 文件的二进制数据缓冲区
 * @param contentType - 文件的MIME类型（如：'image/jpeg', 'image/png'）
 * @returns 上传后文件的公共访问URL
 * @throws 如果上传失败，抛出包含错误信息的异常
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from(imageData);
 * const url = await uploadBufferToS3Like(buffer, 'image/jpeg');
 * console.log('文件上传成功，URL:', url);
 * ```
 */
export async function uploadBufferToS3Like(buf: Buffer, contentType: string): Promise<string> {
  // 获取配置
  const config = getUploadConfig()
  const secretAccessKey = decodeSecretKey(config.secretAccessKey)

  // 生成唯一的文件键名（文件名）
  // 格式：时间戳-UUID.扩展名
  const key = `${Date.now()}-${crypto.randomUUID()}.jpg`

  // 构建存储服务的完整URL
  const host = `${config.bucket}.${config.endpoint}`
  const url = `https://${host}/${key}`
  const urlObj = new URL(url)

  // 准备AWS签名请求选项
  // UNSIGNED-PAYLOAD表示不对请求体进行哈希计算（适用于大文件）
  const payloadHash = 'UNSIGNED-PAYLOAD'
  const opts: AwsRequest = {
    host: urlObj.hostname,
    path: urlObj.pathname,
    method: 'PUT',
    headers: {
      'content-type': contentType,
      'x-amz-content-sha256': payloadHash,
    },
    service: config.service,
    region: config.region,
  }

  // 使用AWS签名算法对请求进行签名
  aws4.sign(opts, { accessKeyId: config.accessKeyId, secretAccessKey })

  // 执行上传请求
  const response = await fetch(url, {
    method: 'PUT',
    headers: opts.headers,
    body: new Uint8Array(buf),
  })

  // 检查上传是否成功
  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`文件上传失败: HTTP ${response.status} - ${errorText}`)
  }

  // 如果配置了公共基础URL（如CDN），使用它；否则使用原始URL
  return config.base ? `${config.base}/${key}` : url
}

/**
 * 预签名上传URL的返回类型
 */
export interface PresignedPutResult {
  /** 用于上传的预签名URL */
  url: string
  /** 上传时需要使用的HTTP头信息 */
  headers: Record<string, string>
  /** 上传后文件的公共访问URL */
  publicUrl: string
  /** 文件在存储服务中的键名（路径） */
  key: string
}

/**
 * 创建预签名PUT请求URL
 *
 * 此函数生成一个预签名的URL，允许客户端直接上传文件到存储服务，
 * 而无需通过服务器中转。这种方式可以减少服务器负载，提高上传速度。
 *
 * 工作流程：
 * 1. 服务器生成预签名URL和必要的请求头
 * 2. 客户端使用这些信息直接上传文件到存储服务
 * 3. 上传完成后，客户端获得文件的公共访问URL
 *
 * @param filename - 原始文件名（用于确定文件扩展名）
 * @param contentType - 文件的MIME类型
 * @returns 包含预签名URL、请求头和公共URL的对象
 * @throws 如果配置错误，抛出异常
 *
 * @example
 * ```typescript
 * const presigned = createPresignedPut('product.jpg', 'image/jpeg');
 * // 客户端可以使用 presigned.url 和 presigned.headers 直接上传文件
 * ```
 */
export function createPresignedPut(filename: string, contentType: string): PresignedPutResult {
  // 获取配置
  const config = getUploadConfig()
  const secretAccessKey = decodeSecretKey(config.secretAccessKey)

  // 从文件名中提取扩展名，如果没有则默认为jpg
  const ext = filename.split('.').pop() || 'jpg'

  // 生成唯一的文件键名
  const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`

  // 构建存储服务的host和path
  const host = `${config.bucket}.${config.endpoint}`
  const path = `/${key}`

  // 准备上传所需的HTTP头信息
  const headers: Record<string, string> = {
    'content-type': contentType || 'application/octet-stream',
  }

  // 准备AWS签名请求选项
  // signQuery: true 表示将签名信息放在URL查询参数中（预签名URL的标准做法）
  const opts: AwsRequest = {
    host,
    path,
    method: 'PUT',
    headers,
    service: config.service,
    region: config.region,
    signQuery: true,
  }

  // 对请求进行签名，签名信息会被添加到opts.path中
  aws4.sign(opts, { accessKeyId: config.accessKeyId, secretAccessKey })

  // 构建完整的预签名URL（包含签名查询参数）
  const url = `https://${host}${opts.path}`

  // 构建公共访问URL（如果配置了CDN基础URL则使用它）
  const publicUrl = config.base ? `${config.base}/${key}` : `https://${host}/${key}`

  return {
    url,
    headers,
    publicUrl,
    key,
  }
}
