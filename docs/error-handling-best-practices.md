# API 错误处理最佳实践

## 概述

本文档描述了在Bunn浏览器插件中处理API错误的最佳实践，特别是处理那些返回格式化错误信息的API响应，例如：

```javascript
{
  success: false,
  error: '您已达到本日token使用限制',
  errorCode: 3001
}
```

## 错误处理层次

我们的错误处理分为以下几个层次：

1. **底层网络请求层 (fetchApi)**：识别错误并将其转换为标准格式
2. **API客户端层 (askAI, askAIStream)**：处理错误并向上传播
3. **后台处理层 (background.js)**：转发错误到内容脚本
4. **UI处理层 (翻译相关函数)**：显示友好的错误消息给用户

## 主要组件

### 1. 自定义APIError类

```typescript
export class APIError extends Error {
  success: boolean;
  errorCode?: number | string;
  
  constructor(message: string, errorCode?: number | string) {
    super(message);
    this.name = 'APIError';
    this.success = false;
    this.errorCode = errorCode;
  }
}
```

### 2. fetchApi函数

`fetchApi` 函数在底层负责：

- 发起HTTP请求
- 检查HTTP状态码
- 解析响应体
- 检查API响应中的 `success` 字段
- 如发现错误，抛出 `APIError` 异常

### 3. askAI 和 askAIStream 函数

这些函数：

- 调用 API 或与 background.js 通信
- 捕获并处理 `APIError` 异常
- 对于 `askAIStream`，增加错误处理回调函数

### 4. background.js 中的消息处理

负责：

- 转发 API 调用和流式响应
- 转发 API 错误到内容脚本
- 保持错误的结构和详细信息

### 5. UI层错误处理

在UI层：

- 检查错误对象的 `errorCode` 属性判断错误类型
- 为特定错误代码提供特定处理（如token限制）
- 显示友好的错误消息

## 特定错误码处理

### Token限制错误 (errorCode: 3001)

```typescript
// 检查是否是token限制错误
if (error && typeof error === 'object' && 'errorCode' in error) {
  if (error.errorCode === 3001) {
    showNotification('今日翻译次数已用完，请明天再来', 'warning');
  }
}
```

## 最佳实践

1. **始终使用 `try/catch` 捕获API调用可能产生的错误**
2. **使用 `instanceof APIError` 检查错误类型**
3. **检查 `errorCode` 提供特定错误的自定义处理**
4. **添加错误回调函数到异步API中，尤其是流式API**
5. **利用 `showNotification` 展示友好的错误信息**
6. **在处理未知类型错误时使用 `error instanceof Error ? error.message : String(error)` 模式**
7. **确保错误消息清晰说明问题，并在适当时提供解决方案** 