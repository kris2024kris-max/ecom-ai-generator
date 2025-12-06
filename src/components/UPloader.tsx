"use client"
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
  const handleFile = useCallback((file: File) => {
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
  }, [onImage])

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
      className={`relative transition-all duration-300 ${
        isDragging ? 'scale-105' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 上传按钮 */}
      <button
        className={`
          relative px-5 py-2.5 rounded-lg font-semibold text-sm
          transition-all duration-200 flex items-center gap-2
          ${
            uploading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isDragging
              ? 'btn-primary'
              : 'btn-primary'
          }
        `}
        onClick={handleButtonClick}
        type="button"
        disabled={uploading}
      >
        {uploading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            上传中...
          </>
        ) : isDragging ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            松开以上传
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            上传商品图
          </>
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
