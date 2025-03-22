// 根据当前环境获取API基础URL
export const API_BASE_URL = process.env.API_BASE_URL;

// 定义自定义API错误类
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

// 封装fetch请求
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // console.log('fetchApi', API_BASE_URL);
  const url = `${API_BASE_URL}${endpoint}`;

  console.log(url, "url===========")
  // 检查是否是FormData类型
  const isFormData = options.body instanceof FormData;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      // 只有当不是FormData时才设置默认的Content-Type
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  // 检查响应的内容类型
  const contentType = response.headers.get('Content-Type') || '';

  let result;
  
  // 根据内容类型解析响应
  if (contentType.includes('application/json')) {
    result = await response.json();
    
    // 检查API返回的错误信息
    if (result && result.success === false) {
      throw new APIError(result.error || '未知API错误', result.errorCode);
    }
    
    return result;
  } else if (contentType.includes('text/event-stream')) {
    return response;
  } else if (contentType.includes('text/')) {
    return response.text();
  } else {
    // 默认尝试解析为JSON，如果失败则返回原始响应
    try {
      result = await response.json();
      
      // 检查API返回的错误信息
      if (result && result.success === false) {
        throw new APIError(result.error || '未知API错误', result.errorCode);
      }
      
      return result;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      return response;
    }
  }
} 