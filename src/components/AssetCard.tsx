/**
 * 素材卡片组件 - AssetCard
 *
 * 用于展示AI生成的电商营销素材，包括：
 * - 商品标题
 * - 营销氛围词
 * - 商品卖点列表
 * - 短视频脚本
 *
 * 使用示例：
 * ```tsx
 * <AssetCard data={{
 *   title: '优质蓝牙耳机',
 *   selling_points: ['音质清晰', '续航持久'],
 *   atmosphere: '限时特惠',
 *   video_script: [
 *     { s: 0, v: '开场特写' },
 *     { s: 2, v: '使用场景展示' }
 *   ]
 * }} />
 * ```
 */

'use client'
import React, { useState, useEffect } from 'react'
import type { Assets } from '@/types'

/**
 * AssetCard组件的属性
 */
interface AssetCardProps {
  /**
   * AI生成的素材数据
   */
  data: Assets
  /**
   * 可选的商品图片URL，如果提供则会在卡片中显示生成的主图
   */
  imageUrl?: string | null
}

/**
 * 素材卡片组件
 *
 * 以扁平化卡片形式展示AI生成的电商营销素材。
 *
 * @param props - 组件属性
 * @returns React组件
 */
export default function AssetCard({ data, imageUrl }: AssetCardProps) {
  const [heroUrl, setHeroUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // 生成主图的函数
  async function composeLocal(url: string, text: string, color: string) {
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const size = 1024
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        const ratio = Math.min(size / img.width, size / img.height)
        const w = img.width * ratio
        const h = img.height * ratio
        const x = (size - w) / 2
        const y = (size - h) / 2
        ctx.drawImage(img, x, y, w, h)
        ctx.strokeStyle = color
        ctx.lineWidth = 8
        ctx.strokeRect(16, 16, size - 32, size - 32)
        ctx.fillStyle = color
        ctx.font = 'bold 48px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(text, size / 2, size - 72)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('加载图片失败'))
      img.src = url
    })
  }

  // 自动生成主图
  useEffect(() => {
    if (!imageUrl || heroUrl) return

    async function generateHero() {
      setGenerating(true)
      // 构建完整的商品信息文本
      const title = data.title
      const sellingPoints = Array.isArray(data.selling_points)
        ? data.selling_points.slice(0, 3)
        : []
      const atmosphere = data.atmosphere || ''

      // 构建详细的提示词
      const primary =
        (typeof window !== 'undefined'
          ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
          : '') || '#3b82f6'

      // 构建卖点文本
      const pointsText = sellingPoints.length > 0 ? `核心卖点：${sellingPoints.join('、')}` : ''

      // 构建氛围词文本
      const atmosphereText = atmosphere ? `氛围标识：${atmosphere}` : ''

      // 组合所有文本信息
      const infoText = [title, pointsText, atmosphereText].filter(Boolean).join(' | ')

      const prompt = `在商品图片上设计专业的电商主图，要求：

1. 商品标题"${title}"以大号粗体文字显示在图片左侧（垂直排列）或顶部（水平排列），字体足够大且醒目，可用饱和度高渐变色。

2. ${sellingPoints.length > 0 ? `从以下核心卖点中选择2-3个最重要的添加到图片中：${sellingPoints.join('、')}。卖点文字使用中等大小粗体，配合对勾或星星图标，位置在图片右侧或底部，使用背景色块或边框突出显示。` : ''}

3. ${atmosphere ? `添加"${atmosphere}"作为质量保证或特色标识，使用小号文字配合图标显示在顶部或角落。` : ''}

4. 设计要求：
   - 商品图片必须清晰完整可见，文字不能遮挡商品主体
   - 使用饱和度高吸睛色作为边框、背景色块或装饰元素
   - 文字颜色与背景形成强烈对比（白色、深色等）
   - 布局平衡，留白合理，整体风格专业现代
   - 参考专业电商主图设计，类似东方甄选等品牌风格

5. 确保商品主体突出，文字信息作为辅助说明，整体视觉效果吸引消费者购买。`
      try {
        const r = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, prompt, size: '2K' }),
        })
        if (r.ok) {
          const d = await r.json()
          setHeroUrl(d.url)
        } else {
          const dataUrl = await composeLocal(String(imageUrl), infoText, primary)
          setHeroUrl(dataUrl)
        }
      } catch {
        const dataUrl = await composeLocal(String(imageUrl), infoText, primary)
        setHeroUrl(dataUrl)
      } finally {
        setGenerating(false)
      }
    }

    generateHero()
  }, [imageUrl, data, heroUrl])

  return (
    <div className="card p-6 space-y-5 bg-white border-blue-200 hover:border-blue-300 transition-all duration-200">
      {/* 生成的主图区域 */}
      {imageUrl && (
        <div className="border-b border-gray-200 pb-4">
          <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            商品主图
            {generating && <span className="text-xs text-blue-500">生成中...</span>}
          </div>
          {heroUrl ? (
            <div className="relative overflow-hidden rounded-lg border border-gray-200">
              {/* --- 开始复制（修复版） --- */}
              {/* 外面的壳子：去掉高度限制，只负责定位 */}
              <div className="relative w-full rounded-lg overflow-hidden group border border-gray-100 bg-gray-50 flex items-center justify-center">
                {/* 图片本体：恢复你原来的 max-h-80 设置 */}
                <img
                  src={heroUrl}
                  alt="商品主图"
                  // 这里改回了 max-h-80，并去掉了 h-full
                  className="w-full max-h-80 object-contain"
                />

                {/* ✨ 抖音风格水印（保持不变） ✨ */}
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg select-none pointer-events-none">
                  {/* 模拟抖音 Logo 红点 */}
                  <div className="relative w-2.5 h-2.5 flex items-center justify-center">
                    <div className="absolute w-full h-full bg-rose-500 rounded-full opacity-75 animate-pulse"></div>
                    <div className="relative w-1.5 h-1.5 bg-rose-600 rounded-full"></div>
                  </div>

                  {/* 水印文字 */}
                  <span className="text-[10px] text-white font-medium tracking-wide">
                    抖音电商前端训练营
                  </span>
                </div>
              </div>
              {/* --- 结束复制 --- */}
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-gray-400 text-sm">正在生成主图...</div>
            </div>
          )}
        </div>
      )}

      {/* 标题区域 */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-1 leading-tight">{data.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">氛围</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {data.atmosphere}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 卖点区域 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">核心卖点</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.selling_points.map((point, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 视频脚本区域 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            短视频脚本
          </h4>
        </div>
        <div className="space-y-2">
          {data.video_script.map((segment, index) => (
            <div
              key={index}
              className="flex gap-3 items-start p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all group"
            >
              {/* 时间标签 */}
              <div className="flex-shrink-0 w-16 text-center">
                <div className="px-2 py-1 rounded-md bg-blue-50 border border-blue-200">
                  <span className="text-xs font-mono font-bold text-blue-700">{segment.s}s</span>
                </div>
              </div>

              {/* 场景描述 */}
              <div className="flex-1 pt-0.5">
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors leading-relaxed">
                  {segment.v}
                </span>
              </div>

              {/* 进度指示器 */}
              <div className="flex-shrink-0 w-1 h-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="w-full bg-blue-500 rounded-full transition-all"
                  style={{ height: `${((index + 1) / data.video_script.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>AI生成内容</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>已生成</span>
          </div>
        </div>
      </div>
    </div>
  )
}
