import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 声明返回类型模块增强
declare module 'axios' {
  export interface AxiosInstance {
    get<T = any>(url: string, config?: any): Promise<T>;
    post<T = any>(url: string, data?: any, config?: any): Promise<T>;
    put<T = any>(url: string, data?: any, config?: any): Promise<T>;
    delete<T = any>(url: string, config?: any): Promise<T>;
  }
}

// 根据环境决定基础URL
const getBaseUrl = (): string => {
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'http://localhost:3000' : 'https://www.bunn.ink';
  // return isDevelopment ? 'http://localhost:3000' : 'https://bunn-web.vercel.app';

};

// 创建配置好的axios实例
const api: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 直接返回response.data
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      console.error('API请求错误:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('API请求无响应:', error.request);
    } else {
      console.error('API请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 