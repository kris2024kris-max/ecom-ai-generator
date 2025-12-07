'use client'
import React, { useRef, useState, useCallback } from 'react'

/**
 * Uploader组件的属性
 */
interface UploaderProps {
  /**
   * 当用户选择文件后的回调函数
   *
   * @param file - 用户选择的文件对象
   */
  onImage: (file: File) => void

  /**
   * 是否正在上传
   */
  uploading?: boolean
}

/**
 * 文件上传组件
 *
 * 提供现代化的文件上传界面，支持点击和拖拽两种方式。
 *
 * @param props - 组件属性
 * @returns React组件
 */
export default function Uploader({ onImage, uploading = false }: UploaderProps) {
  // 使用ref引用隐藏的文件输入框
  const inputRef = useRef<HTMLInputElement | null>(null)

  // 拖拽状态
  const [isDragging, setIsDragging] = useState<boolean>(false)

  /**
   * 处理文件选择
   *
   * 验证文件类型并调用回调函数。
   */
  const handleFile = useCallback(
    (file: File) => {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }

      // 验证文件大小（限制为10MB）
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert('图片大小不能超过10MB')
        return
      }

      // 调用回调函数
      onImage(file)
    },
    [onImage]
  )

  /**
   * 处理文件选择事件
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      handleFile(file)
    }

    // 清空input的值，以便用户可以选择同一个文件再次触发onChange
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  /**
   * 打开文件选择对话框
   */
  const handleButtonClick = () => {
    if (!uploading) {
      inputRef.current?.click()
    }
  }

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!uploading) {
      setIsDragging(true)
    }
  }

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  /**
   * 处理文件放下
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (uploading) {
      return
    }

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  return (
    <div
      className={`relative transition-all duration-300 ${isDragging ? 'scale-105' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 上传按钮 - 小图标样式 */}
      <button
        className={`
          relative w-10 h-10 rounded-lg
          transition-all duration-200 flex items-center justify-center
          ${
            uploading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isDragging
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700'
          }
        `}
        onClick={handleButtonClick}
        type="button"
        disabled={uploading}
        title="上传商品图片"
      >
        {uploading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>

      {/* 隐藏的文件输入框 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  )
}
