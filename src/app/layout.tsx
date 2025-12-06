/**
 * 根布局组件
 * 
 * 这是Next.js应用的根布局组件，定义了整个应用的HTML结构。
 * 包括：
 * - 页面元数据（标题、描述）
 * - 字体配置（Geist字体族）
 * - 全局样式
 * 
 * 所有页面都会使用此布局作为基础。
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Geist Sans字体配置
 * 
 * 用于应用的主要文本显示。
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Geist Mono字体配置
 * 
 * 用于代码和等宽文本显示。
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 页面元数据
 * 
 * 定义页面的SEO信息和浏览器标签页显示的内容。
 */
export const metadata: Metadata = {
  title: "电商素材智能生成",
  description: "基于对话生成商品标题、卖点、氛围与短视频脚本",
};

/**
 * 根布局组件
 * 
 * 定义整个应用的HTML结构，包括html和body标签。
 * 所有页面内容会作为children渲染在body中。
 * 
 * @param props - 组件属性
 * @param props.children - 子组件（页面内容）
 * @returns React组件
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
