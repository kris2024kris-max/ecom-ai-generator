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

"use client"
import React from 'react'
import type { Assets } from '@/types'

/**
 * AssetCard组件的属性
 */
interface AssetCardProps {
  /**
   * AI生成的素材数据
   */
  data: Assets
}

/**
 * 素材卡片组件
 * 
 * 以扁平化卡片形式展示AI生成的电商营销素材。
 * 
 * @param props - 组件属性
 * @returns React组件
 */
export default function AssetCard({ data }: AssetCardProps) {
  return (
    <div className="card p-6 space-y-5 bg-white border-blue-200 hover:border-blue-300 transition-all duration-200">
      {/* 标题区域 */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-1 leading-tight">
              {data.title}
            </h3>
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
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">短视频脚本</h4>
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
                  <span className="text-xs font-mono font-bold text-blue-700">
                    {segment.s}s
                  </span>
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
