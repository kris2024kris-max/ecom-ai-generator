# 电商素材智能生成

一个基于 Next.js 16 与 React 19 的电商素材生成应用，支持商品文案（标题/卖点/氛围/短视频脚本）与主图生成，内置稳健降级策略，确保在外部模型不可用时亦可用。

## 快速开始

- Node.js 18+
- 复制 `.env.example` 为 `.env` 并填写必要环境变量
- 安装依赖并启动开发服务：

```
npm install
npm run dev
```

打开 `http://localhost:3000/`。

## 环境变量

- 文本生成：`DOUBAO_API_KEY`、`DOUBAO_ENDPOINT`、`DOUBAO_MODEL`
- 图片生成：`DOUBAO_IMAGE_ENDPOINT`、`DOUBAO_IMAGE_MODEL`
- 对象存储直传：`UPLOAD_ACCESS_KEY_ID`、`UPLOAD_SECRET_ACCESS_KEY`、`UPLOAD_BUCKET`、`UPLOAD_ENDPOINT`、`UPLOAD_REGION`、`UPLOAD_SERVICE_NAME`、`UPLOAD_PUBLIC_BASE`
- 数据库（可选）：`DATABASE_URL`

## 主要模块

- 前端发送与界面：`src/components/ChatWindow.tsx`、`src/hooks/useChat.ts`
- 素材生成服务：`src/services/aiService.ts`
- 文本模型封装：`src/lib/volcano.ts`
- 图片生成服务：`src/services/imageService.ts`
- 上传预签名：`src/lib/upload.ts`
- 数据读写：`src/lib/db.ts`、`src/lib/prisma.ts`

## 运行说明

- 首次发送自动创建会话；所有会话相关请求携带 `X-Client-Id`
- 外部模型不可用时：
  - 文本生成回退到内置模拟数据
  - 图片生成回退到前端 Canvas 合成

## 可选命令

- `npm run build` 构建生产
- `npm start` 启动生产
