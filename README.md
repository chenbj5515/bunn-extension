# Bunn 浏览器扩展

这是一个浏览器扩展项目，从原始的 monorepo 转换为独立项目。

## 功能特性

- 浏览器扩展，提供便捷的翻译和语音转文字功能
- 使用 Microsoft 认知服务 API 进行文本到语音的转换
- 基于 React 构建的用户界面
- 使用 Tailwind CSS 和 shadcn/ui 组件库

## 开发说明

### 环境准备

1. 确保已安装 Node.js (v18+) 和 pnpm
2. 复制 `.env.example` 为 `.env` 并填入必要的 API 密钥

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

构建后的文件将位于 `dist` 目录中，可以加载到浏览器的扩展管理页面进行测试。

## 浏览器支持

- Chrome
- Edge
- Firefox (部分功能可能需要调整)

## 项目结构

```
bunn-extension/
├── dist/             # 构建输出目录
├── src/
│   ├── assets/       # 静态资源文件
│   ├── background/   # 浏览器扩展的后台脚本
│   ├── common/       # 通用代码
│   ├── components/   # React 组件
│   │   └── ui/       # UI 组件库
│   ├── content/      # 内容脚本
│   ├── lib/          # 工具库
│   ├── popup/        # 弹出窗口
│   ├── utils/        # 工具函数
│   └── manifest.json # 扩展清单文件
├── package.json
├── rollup.config.js  # Rollup 打包配置
└── tsconfig.json     # TypeScript 配置
```

## 配置

在插件弹出窗口中设置API密钥和端点。 