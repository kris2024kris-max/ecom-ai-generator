import { NextRequest } from 'next/server'
import { generateAtmosphereImage } from '@/services/imageService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const imageUrl = body.imageUrl as string
    const prompt = body.prompt as string
    const size = body.size as string | undefined
    if (!imageUrl || !prompt)
      return Response.json({ error: 'imageUrl and prompt required' }, { status: 400 })
    const url = await generateAtmosphereImage({ imageUrl, prompt, size })
    if (!url) return Response.json({ error: 'image model unavailable' }, { status: 502 })
    return Response.json({ url })
  } catch (error: unknown) {
    const msg =
      typeof error === 'object' && error !== null && 'message' in (error as Record<string, unknown>)
        ? String((error as { message?: string }).message)
        : '服务器内部错误'
    return Response.json({ error: msg }, { status: 500 })
  }
}
