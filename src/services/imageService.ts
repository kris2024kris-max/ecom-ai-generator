export async function generateAtmosphereImage(input: {
  imageUrl: string
  prompt: string
  size?: string
  model?: string
}) {
  const apiKey = process.env.DOUBAO_API_KEY
  let endpoint = process.env.DOUBAO_IMAGE_ENDPOINT
  if (!endpoint) {
    const base = process.env.DOUBAO_ENDPOINT || ''
    endpoint = base.includes('/chat/completions')
      ? base.replace('chat/completions', 'images/generations')
      : 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
  }
  const model = input.model || process.env.DOUBAO_IMAGE_MODEL || 'doubao-seedream-4-5-251128'
  if (!apiKey || !endpoint) return null
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        prompt: input.prompt,
        image: input.imageUrl,
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size: input.size || '2K',
        stream: false,
        watermark: true,
      }),
    })
    if (!r.ok) return null
    const data = await r.json()
    const url = data?.data?.[0]?.url || data?.choices?.[0]?.data?.[0]?.url
    return typeof url === 'string' ? url : null
  } catch {
    return null
  }
}
