// 根据当前环境获取API基础URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 封装fetch请求
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  console.log('fetchApi', API_BASE_URL);
  const url = `${API_BASE_URL}${endpoint}`;

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

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  // 检查响应的内容类型
  const contentType = response.headers.get('Content-Type') || '';

  // 根据内容类型返回不同格式的数据
  if (contentType.includes('application/json')) {
    return response.json();
  } else if (contentType.includes('text/event-stream')) {
    return response;
  } else if (contentType.includes('text/')) {
    return response.text();
  } else {
    // 默认尝试解析为JSON，如果失败则返回原始响应
    try {
      return await response.json();
    } catch (error) {
      return response;
    }
  }
} 