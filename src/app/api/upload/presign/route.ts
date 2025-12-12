/**
 * 预签名上传API路由
 *
 * 此路由生成预签名URL，允许客户端直接上传文件到存储服务，
 * 而无需通过服务器中转。这种方式可以减少服务器负载，提高上传速度。
 *
 * 路由路径: /api/upload/presign
 *
 * 工作流程：
 * 1. 客户端调用此API获取预签名URL和请求头
 * 2. 客户端使用这些信息直接上传文件到存储服务
 * 3. 上传完成后，客户端获得文件的公共访问URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPresignedPut } from '@/lib/upload'

/**
 * POST /api/upload/presign
 *
 * 生成预签名上传URL。
 *
 * 请求体：
 * - filename: string - 文件名（必填）
 * - contentType: string - 文件的MIME类型（必填，如：'image/jpeg'）
 *
 * 响应：
 * - url: string - 用于上传的预签名URL
 * - headers: Record<string, string> - 上传时需要使用的HTTP头信息
 * - publicUrl: string - 上传后文件的公共访问URL
 * - key: string - 文件在存储服务中的键名（路径）
 *
 * @example
 * ```typescript
 * // 1. 获取预签名URL
 * const presignResponse = await fetch('/api/upload/presign', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     filename: 'product.jpg',
 *     contentType: 'image/jpeg'
 *   })
 * });
 * const presignData = await presignResponse.json();
 *
 * // 2. 使用预签名URL直接上传文件
 * const uploadResponse = await fetch(presignData.url, {
 *   method: 'PUT',
 *   headers: presignData.headers,
 *   body: fileBlob
 * });
 *
 * // 3. 上传成功后，使用 presignData.publicUrl 访问文件
 * ```
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json()
    const filename = body.filename as string
    const contentType = body.contentType as string

    // 验证必填字段
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: '缺少必要参数：filename' }, { status: 400 })
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: '缺少必要参数：contentType' }, { status: 400 })
    }

    // 生成预签名URL
    const presigned = createPresignedPut(filename, contentType)

    // 返回预签名信息
    return NextResponse.json(presigned)
  } catch (error: unknown) {
    // 错误处理
    console.error('生成预签名URL错误:', error)
    return NextResponse.json(
      {
        error:
          typeof error === 'object' &&
          error !== null &&
          'message' in (error as Record<string, unknown>)
            ? String((error as { message?: string }).message)
            : '生成预签名URL失败',
      },
      { status: 500 }
    )
  }
}
