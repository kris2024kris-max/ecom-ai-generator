/**
 * 预签名上传执行API路由
 *
 * 此路由用于执行预签名上传操作。
 * 客户端从 /api/upload/presign 获取预签名URL后，可以使用此路由上传文件。
 *
 * 路由路径: /api/upload/put
 *
 * 注意：虽然此路由存在，但更推荐的方式是客户端直接使用预签名URL上传，
 * 这样可以减少服务器负载。此路由主要用于某些特殊场景。
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/upload/put
 *
 * 使用预签名URL上传文件。
 *
 * 请求格式：multipart/form-data
 * - file: File - 要上传的文件（必填）
 * - url: string - 预签名URL（必填）
 * - headers: string - JSON格式的HTTP头信息（必填）
 *
 * 响应：
 * - ok: boolean - 上传是否成功
 *
 * @example
 * ```typescript
 * // 1. 获取预签名信息
 * const presignData = await fetch('/api/upload/presign', {...}).then(r => r.json());
 *
 * // 2. 使用此API上传文件
 * const formData = new FormData();
 * formData.append('file', fileBlob);
 * formData.append('url', presignData.url);
 * formData.append('headers', JSON.stringify(presignData.headers));
 *
 * const response = await fetch('/api/upload/put', {
 *   method: 'POST',
 *   body: formData
 * });
 * ```
 */
export async function POST(req: NextRequest) {
  try {
    // 解析表单数据
    const form = await req.formData()
    const file = form.get('file') as File | null
    const url = form.get('url') as string | null
    const headersStr = form.get('headers') as string | null

    // 验证必填字段
    if (!file) {
      return NextResponse.json({ error: '缺少必要参数：file' }, { status: 400 })
    }

    if (!url) {
      return NextResponse.json({ error: '缺少必要参数：url' }, { status: 400 })
    }

    if (!headersStr) {
      return NextResponse.json({ error: '缺少必要参数：headers' }, { status: 400 })
    }

    // 解析HTTP头信息
    let headers: Record<string, string>
    try {
      headers = JSON.parse(headersStr)
    } catch (parseError) {
      return NextResponse.json(
        { error: 'headers参数格式错误，必须是有效的JSON字符串' },
        { status: 400 }
      )
    }

    // 将文件转换为Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 使用预签名URL上传文件
    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: buffer,
    })

    // 检查上传是否成功
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return NextResponse.json(
        { error: `文件上传失败: HTTP ${response.status} - ${errorText}` },
        { status: 500 }
      )
    }

    // 返回成功响应
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    // 错误处理
    console.error('预签名上传错误:', error)
    return NextResponse.json(
      {
        error:
          typeof error === 'object' &&
          error !== null &&
          'message' in (error as Record<string, unknown>)
            ? String((error as { message?: string }).message)
            : '文件上传失败',
      },
      { status: 500 }
    )
  }
}
