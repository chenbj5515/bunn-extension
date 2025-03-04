// 根据当前环境获取API基础URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 封装fetch请求
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    console.log("API请求失败:", response)
    throw new Error(`API请求失败: ${response.status}`);
  }
  
  // 检查响应的内容类型
  const contentType = response.headers.get('Content-Type') || '';
  
  // 根据内容类型返回不同格式的数据
  if (contentType.includes('application/json')) {
    return response.json();
  } else if (contentType.includes('text/')) {
    return response.text();
  } else if (contentType.includes('application/octet-stream') || response.headers.get('Transfer-Encoding') === 'chunked') {
    return response; // 返回原始响应对象，让调用者处理流
  } else {
    // 默认尝试解析为JSON，如果失败则返回原始响应
    try {
      return await response.json();
    } catch (error) {
      return response;
    }
  }
} 