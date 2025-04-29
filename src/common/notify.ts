import { getTranslation } from './i18n';

// 获取baseUrl的函数
function getBaseUrl(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'http://localhost:3000' : 'https://www.bunn.ink';
}

// 通知类型
export type NotificationType = 'info' | 'error' | 'warning' | 'loading' | 'success';

// 核心通知样式类
const NOTIFICATION_CLASS = 'bunn-notification';

// 通知管理器 - 单例模式
class NotificationManager {
  private static instance: NotificationManager;
  private currentNotification: HTMLElement | null = null;
  private notificationQueue: HTMLElement[] = [];
  private isTransitioning = false;

  private constructor() {
    this.addNotificationGlobalStyles();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // 添加通知全局样式
  private addNotificationGlobalStyles() {
    if (document.getElementById('bunn-notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'bunn-notification-styles';
    style.textContent = `
      .${NOTIFICATION_CLASS} {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #FFFFFF;
        color: #000000;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 9999;
        font-size: 14px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        min-height: 28px;
        max-width: 90vw;
      }
      .${NOTIFICATION_CLASS}.show {
        opacity: 1;
        transform: translateY(0);
      }
      .${NOTIFICATION_CLASS} .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 8px;
        flex-shrink: 0;
      }
      .${NOTIFICATION_CLASS}.error {
        border-left: 4px solid #EF4444;
      }
      .${NOTIFICATION_CLASS}.warning {
        border-left: 4px solid #F59E0B;
      }
      .${NOTIFICATION_CLASS} .notification-icon {
        height: 100%;
        display: flex;
        align-items: center;
        margin-right: 8px;
      }
      .${NOTIFICATION_CLASS} .message-container {
        display: flex;
        align-items: center;
        height: 100%;
        font-size: 15px;
      }
      .${NOTIFICATION_CLASS} .bunn-link {
        text-decoration: underline;
        cursor: pointer;
        transition: opacity 0.2s ease;
        color: #000000;
        padding: 0 2px;
        margin: 0 3px;
        display: inline;
      }
      .${NOTIFICATION_CLASS} .bunn-link:hover {
        opacity: 0.7;
      }
      .${NOTIFICATION_CLASS} button {
        padding: 8px 12px;
        border-radius: 4px;
        background-color: #000000;
        color: #FFFFFF;
        border: none;
        cursor: pointer;
        font-weight: 500;
        font-size: 13px;
        white-space: nowrap;
        flex-shrink: 0;
        transition: opacity 0.2s ease;
        margin-left: 12px;
      }
      .${NOTIFICATION_CLASS} button:hover {
        opacity: 0.8;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // 创建对应类型的图标
  private createTypeIcon(type: NotificationType): HTMLElement {
    const icon = document.createElement('span');
    icon.className = 'notification-icon';

    switch (type) {
      case 'loading':
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        return spinner;
      case 'error':
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
        break;
      case 'warning':
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
        break;
      case 'success':
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>`;
        break;
      case 'info':
      default:
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
        break;
    }

    return icon;
  }

  // 创建通知元素
  private createNotificationElement(message: string, type: NotificationType): HTMLElement {
    const notification = document.createElement('div');
    notification.className = `${NOTIFICATION_CLASS} ${type}`;

    // 添加图标
    const icon = this.createTypeIcon(type);
    notification.appendChild(icon);

    // 添加消息
    const messageSpan = document.createElement('span');
    messageSpan.className = 'message-container';
    messageSpan.innerHTML = message;
    notification.appendChild(messageSpan);

    return notification;
  }

  // 显示通知
  public async showNotification(message: string, type: NotificationType, autoHide: boolean = false): Promise<HTMLElement> {
    // 创建新通知元素
    const notification = this.createNotificationElement(message, type);
    
    // 如果当前有通知正在显示，先将其加入队列
    if (this.currentNotification) {
      this.notificationQueue.push(notification);
      return notification;
    }
    
    // 直接显示新通知
    this.displayNotification(notification, autoHide);
    
    return notification;
  }

  // 显示通知并处理队列
  private displayNotification(notification: HTMLElement, autoHide: boolean = false) {
    // 将通知添加到文档
    document.body.appendChild(notification);
    
    // 设置当前通知
    this.currentNotification = notification;
    
    // 触发动画
    setTimeout(() => {
      notification.classList.add('show');
    }, 5);
    
    // 设置自动隐藏
    if (autoHide) {
      setTimeout(() => {
        this.hideNotification(notification);
      }, 1500);
    }
  }

  // 隐藏通知
  private hideNotification(notification: HTMLElement) {
    if (!notification || !document.body.contains(notification)) return;
    
    notification.classList.remove('show');
    
    // 等待动画完成后移除元素
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
      
      // 如果这是当前通知，清除引用
      if (this.currentNotification === notification) {
        this.currentNotification = null;
      }
      
      // 处理队列中的下一个通知
      this.processNextNotification();
    }, 300);
  }

  // 处理队列中的下一个通知
  private processNextNotification() {
    if (this.notificationQueue.length > 0 && !this.currentNotification) {
      const nextNotification = this.notificationQueue.shift();
      if (nextNotification) {
        this.displayNotification(nextNotification);
      }
    }
  }

  // 更新现有通知
  public async updateNotification(message: string, type: NotificationType, autoHide: boolean = false): Promise<HTMLElement> {
    // 如果当前没有通知，创建一个新的
    if (!this.currentNotification) {
      return this.showNotification(message, type, autoHide);
    }
    
    // 更新现有通知
    const notification = this.currentNotification;
    
    // 更新类型
    notification.className = `${NOTIFICATION_CLASS} ${type}`;
    
    // 清空内容
    notification.innerHTML = '';
    
    // 添加图标
    const icon = this.createTypeIcon(type);
    notification.appendChild(icon);
    
    // 添加消息
    const messageSpan = document.createElement('span');
    messageSpan.className = 'message-container';
    messageSpan.innerHTML = message;
    notification.appendChild(messageSpan);
    
    // 处理自动隐藏
    if (autoHide) {
      setTimeout(() => {
        this.hideNotification(notification);
      }, 1500);
    }
    
    return notification;
  }

  // 显示带有链接的通知
  public async showNotificationWithLink(
    message: string,
    type: NotificationType = 'info',
    linkUrl: string = getBaseUrl()
  ): Promise<HTMLElement> {
    // 替换_Bunn_为链接
    message = message.replace(/_Bunn_/g, '  <span class="bunn-link">Bunn</span>  ');
    
    // 创建通知
    const notification = await this.showNotification(message, type, false);
    
    // 添加链接点击事件
    const bunnLink = notification.querySelector('.bunn-link');
    if (bunnLink) {
      bunnLink.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(linkUrl, '_blank');
        // 点击链接后关闭通知
        this.hideNotification(notification);
      });
    }
    
    // 添加点击外部关闭功能
    const closeOnOutsideClick = (e: MouseEvent) => {
      if (notification && !notification.contains(e.target as Node)) {
        this.hideNotification(notification);
        document.removeEventListener('click', closeOnOutsideClick);
      }
    };
    
    // 延迟一下再添加事件监听，防止刚创建就触发
    setTimeout(() => {
      document.addEventListener('click', closeOnOutsideClick);
    }, 50);
    
    return notification;
  }

  // 显示带有按钮的通知
  public async showNotificationWithAction(
    message: string,
    type: NotificationType = 'info',
    actionText: string,
    actionUrl: string
  ): Promise<HTMLElement> {
    // 创建通知元素
    const notification = this.createNotificationElement(message, type);
    notification.style.justifyContent = 'space-between';
    
    // 创建消息容器
    const messageContainer = document.createElement('div');
    messageContainer.style.display = 'flex';
    messageContainer.style.alignItems = 'center';
    messageContainer.style.flex = '1';
    
    // 添加图标
    const icon = this.createTypeIcon(type);
    messageContainer.appendChild(icon);
    
    // 添加消息
    const messageSpan = document.createElement('span');
    messageSpan.className = 'message-container';
    messageSpan.innerHTML = message;
    messageContainer.appendChild(messageSpan);
    
    notification.appendChild(messageContainer);
    
    // 创建按钮
    const button = document.createElement('button');
    button.textContent = actionText;
    
    // 添加按钮点击事件
    button.onclick = (e) => {
      e.preventDefault();
      window.open(actionUrl, '_blank');
      this.hideNotification(notification);
    };
    
    notification.appendChild(button);
    
    // 显示通知
    this.displayNotification(notification, false);
    
    return notification;
  }

  // 隐藏当前通知
  public hideCurrentNotification(): void {
    if (this.currentNotification) {
      this.hideNotification(this.currentNotification);
    }
  }
}

// 导出通知管理器实例
const notificationManager = NotificationManager.getInstance();

/**
 * 显示基础通知
 */
export async function showNotification(
  messageOrKey: string,
  type: NotificationType = 'info',
  isTranslationKey: boolean = false,
  autoHide: boolean = false,
  ...args: any[]
): Promise<HTMLElement> {
  // 处理中的状态默认自动隐藏
  if (type === 'loading') {
    autoHide = true;
  }

  // 获取消息文本
  const message = isTranslationKey 
    ? await getTranslation(messageOrKey, undefined, ...args) 
    : messageOrKey;

  return notificationManager.showNotification(message, type, autoHide);
}

/**
 * 更新现有通知
 */
export async function updateNotification(
  messageOrKey: string,
  type: NotificationType = 'info',
  isTranslationKey: boolean = false,
  autoHide: boolean = false,
  ...args: any[]
): Promise<HTMLElement> {
  // 获取消息文本
  const message = isTranslationKey 
    ? await getTranslation(messageOrKey, undefined, ...args) 
    : messageOrKey;

  return notificationManager.updateNotification(message, type, autoHide);
}

/**
 * 显示带有Bunn链接的通知
 */
export async function showNotificationWithLink(
  messageOrKey: string,
  type: NotificationType = 'info',
  linkUrl: string = getBaseUrl(),
  isTranslationKey: boolean = false,
  ...args: any[]
): Promise<HTMLElement> {
  // 获取消息文本
  let message = isTranslationKey 
    ? await getTranslation(messageOrKey, undefined, ...args) 
    : messageOrKey;
  
  return notificationManager.showNotificationWithLink(message, type, linkUrl);
}

/**
 * 显示带有按钮的通知
 */
export async function showNotificationWithAction(
  messageOrKey: string,
  type: NotificationType = 'info',
  actionText: string,
  actionUrl: string,
  isTranslationKey: boolean = false,
  ...args: any[]
): Promise<HTMLElement> {
  // 获取消息和按钮文本
  const message = isTranslationKey 
    ? await getTranslation(messageOrKey, undefined, ...args) 
    : messageOrKey;
  
  const buttonText = isTranslationKey 
    ? await getTranslation(actionText, undefined, ...args) 
    : actionText;

  return notificationManager.showNotificationWithAction(message, type, buttonText, actionUrl);
}

/**
 * 隐藏当前通知
 */
export function hideNotification(): void {
  notificationManager.hideCurrentNotification();
}