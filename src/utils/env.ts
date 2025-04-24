/**
 * 环境相关的工具函数
 */

/**
 * 根据当前环境返回适当的基础URL
 * 在开发环境返回localhost，在生产环境返回实际网站URL
 * @returns {string} 基础URL
 */
export function getBaseUrl(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'http://localhost:3000' : 'https://www.bunn.ink';
}

/**
 * 判断当前是否为开发环境
 * @returns {boolean} 如果是开发环境则返回true，否则返回false
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 判断当前是否为生产环境
 * @returns {boolean} 如果是生产环境则返回true，否则返回false
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
} 