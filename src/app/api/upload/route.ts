/**
 * 文件上传API路由（服务器端直接上传）
 * 
 * 此路由接收文件，然后由服务器直接上传到存储服务。
 * 适用于小文件或需要服务器端处理的场景。
 * 
 * 路由路径: /api/upload
 * 
 * 注意：此路由使用服务器端上传，会增加服务器负载。
 * 对于大文件，建议使用预签名上传（/api/upload/presign）。
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadBufferToS3Like } from '@/lib/upload'

/**
 * POST /api/upload
 * 
 * 接收文件并直接上传到存储服务。
 * 
 * 请求格式：multipart/form-data
 * - file: File - 要上传的文件（必填）
 * 
 * 响应：
 * - url: string - 上传后文件的公共访问URL
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', fileBlob);
 * 
 * const response = await fetch('/api/upload', {
 *   method: 'POST',
 *   body: formData
 * });
 * const data = await response.json();
 * console.log(data.url); // 文件URL
 * ```
 */
export async function POST(req: NextRequest) {
  try {
    // 解析表单数据
    const form = await req.formData()
    const file = form.get('file') as File | null

    // 验证文件是否存在
    if (!file) {
      return NextResponse.json(
        { error: '缺少必要参数：file' },
        { status: 400 }
      )
    }

    // 将文件转换为Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上传到存储服务
    const url = await uploadBufferToS3Like(
      buffer,
      file.type || 'application/octet-stream'
    )

    // 返回文件URL
    return NextResponse.json({ url })
  } catch (error: any) {
    // 错误处理
    console.error('文件上传错误:', error)
    return NextResponse.json(
      { error: error?.message || '文件上传失败' },
      { status: 500 }
    )
  }
}
