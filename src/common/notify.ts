import { getTranslation } from './i18n';

// 显示通知
export function showNotification(
  messageOrKey: string, 
  type: 'info' | 'error' | 'warning' | 'loading' | 'success' = 'info',
  isTranslationKey: boolean = false,
  ...args: any[]
) {
    if (!document.body) return; // 确保document.body存在
  
    // 获取要显示的消息文本
    const message = isTranslationKey ? getTranslation(messageOrKey, undefined, ...args) : messageOrKey;

    // 清除所有现有通知，确保不会有多个通知同时显示
    clearAllNotifications();
  
    const notification = document.createElement('div');
    notification.className = 'netflix-subtitle-notification';
    // 设置通知为flex布局以确保内容垂直居中
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
  
    // 根据类型添加不同的样式
    notification.classList.add(type);
    
    if (type === 'loading') {
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      notification.appendChild(spinner);
    } else if (type === 'error') {
      const icon = document.createElement('span');
      // 使用SVG格式的shadcn风格错误图标
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
      icon.className = 'notification-icon';
      // 添加右侧margin以与文本保持间距
      icon.style.height = '100%';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      notification.appendChild(icon);
    } else if (type === 'warning') {
      const icon = document.createElement('span');
      // 使用SVG格式的shadcn风格警告图标
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
      icon.className = 'notification-icon';
      // 添加右侧margin以与文本保持间距
      icon.style.height = '100%';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      notification.appendChild(icon);
    } else if (type === 'success') {
      const icon = document.createElement('span');
      // 使用SVG格式的shadcn风格成功图标
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>`;
      icon.className = 'notification-icon';
      // 添加右侧margin以与文本保持间距
      icon.style.height = '100%';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      icon.style.marginRight = '8px';
      notification.appendChild(icon);
    } else { // info
      const icon = document.createElement('span');
      // 使用SVG格式的shadcn风格信息图标
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
      icon.className = 'notification-icon';
      // 添加右侧margin以与文本保持间距
      icon.style.height = '100%';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      notification.appendChild(icon);
    }
  
    const messageSpan = document.createElement('span');
    messageSpan.innerHTML = message; // 使用innerHTML支持HTML内容
    messageSpan.style.height = '100%';
    messageSpan.style.display = 'flex';
    messageSpan.style.alignItems = 'center';
    notification.appendChild(messageSpan);
  
    document.body.appendChild(notification);
  
    // 触发动画
    setTimeout(() => notification.classList.add('show'), 10);
  
    let isHovering = false;
    let hideTimeout: number | null = null;
    
    // 添加鼠标事件监听器
    notification.addEventListener('mouseenter', () => {
      isHovering = true;
      // 如果存在定时器，清除它
      if (hideTimeout !== null) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    });
    
    notification.addEventListener('mouseleave', () => {
      isHovering = false;
      // 鼠标离开后开始倒计时关闭 - 暂时禁用自动消失功能用于调试
      startHideTimer();
    });
    
    // 定义开始隐藏计时器的函数
    const startHideTimer = () => {
      if (type !== 'loading' && !isHovering) {
        hideTimeout = window.setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }
    };
    
    // 恢复自动消失功能
    if (type !== 'loading') {
      startHideTimer();
    }
    
    return notification;
}

// 更新现有通知
export function updateNotification(
  messageOrKey: string, 
  type: 'info' | 'error' | 'warning' | 'loading' | 'success' = 'info',
  isTranslationKey: boolean = false,
  ...args: any[]
) {
  // 获取要显示的消息文本
  const message = isTranslationKey ? getTranslation(messageOrKey, undefined, ...args) : messageOrKey;
  
  const existingNotification = document.querySelector('.netflix-subtitle-notification');
  if (existingNotification) {
    // 移除旧的所有类型
    existingNotification.classList.remove('info', 'error', 'warning', 'loading', 'success');
    // 添加新类型
    existingNotification.classList.add(type);
    
    // 清空通知内容
    existingNotification.innerHTML = '';
    
    // 根据类型添加不同的图标
    if (type === 'loading') {
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      existingNotification.appendChild(spinner);
    } else if (type === 'error') {
      const icon = document.createElement('span');
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
      icon.className = 'notification-icon';
      icon.style.height = '100%';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      existingNotification.appendChild(icon);
    } else if (type === 'warning') {
      const icon = document.createElement('span');
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
      icon.className = 'notification-icon';
      icon.style.height = '100%';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      existingNotification.appendChild(icon);
    } else if (type === 'success') {
      const icon = document.createElement('span');
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>`;
      icon.className = 'notification-icon';
      icon.style.height = '100%';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      existingNotification.appendChild(icon);
    } else { // info
      const icon = document.createElement('span');
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
      icon.className = 'notification-icon';
      icon.style.height = '100%';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      existingNotification.appendChild(icon);
    }
    
    // 添加消息内容
    const messageSpan = document.createElement('span');
    messageSpan.innerHTML = message;
    messageSpan.style.height = '100%';
    messageSpan.style.display = 'flex';
    messageSpan.style.alignItems = 'center';
    existingNotification.appendChild(messageSpan);
    
    // 如果不是loading类型，设置自动消失
    if (type !== 'loading') {
      setTimeout(() => {
        existingNotification.classList.remove('show');
        setTimeout(() => existingNotification.remove(), 300);
      }, 3000);
    }
    
    return existingNotification;
  } else {
    // 如果不存在通知，就创建一个新的
    return showNotification(messageOrKey, type, isTranslationKey, ...args);
  }
}

// 清除所有现有通知的辅助函数
function clearAllNotifications() {
  const existingNotifications = document.querySelectorAll('.netflix-subtitle-notification');
  existingNotifications.forEach(notification => {
    notification.remove();
  });
}

// 显示带有可点击链接的通知
export function showNotificationWithLink(
  messageOrKey: string, 
  type: 'info' | 'error' | 'warning' | 'loading' | 'success' = 'info',
  linkUrl: string = 'https://www.bunn.ink',
  isTranslationKey: boolean = false,
  ...args: any[]
) {
  if (!document.body) return; // 确保document.body存在
  
  // 获取要显示的消息文本
  let message = isTranslationKey ? getTranslation(messageOrKey, undefined, ...args) : messageOrKey;
  
  // 替换_Bunn_，确保其周围有足够空白
  message = message.replace(/_Bunn_/g, '  <span class="bunn-link">Bunn</span>  ');

  // 清除所有现有通知，确保不会有多个通知同时显示
  clearAllNotifications();

  const notification = document.createElement('div');
  notification.className = 'netflix-subtitle-notification';
  
  // 设置通知样式
  notification.style.backgroundColor = '#FFFFFF'; // 固定使用白色背景
  notification.style.color = '#000000'; // 文字使用黑色
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.height = '24px'; // 减小高度
  
  // 对于成功类型不添加success类名，避免显示绿色边框
  if (type !== 'success') {
    notification.classList.add(type);
  }
  
  // 添加链接样式
  const linkStyle = document.createElement('style');
  linkStyle.textContent = `
    .bunn-link {
      text-decoration: underline;
      cursor: pointer;
      transition: opacity 0.2s ease;
      color: #000000; /* 使用黑色作为链接颜色，保持黑白调性 */
      font-weight: 500;
      padding: 0 2px;
      margin: 0 3px;
      display: inline;
    }
    .bunn-link:hover {
      opacity: 0.7;
    }
  `;
  document.head.appendChild(linkStyle);
  
  // 添加图标 - 对于成功类型只显示黑色对号，保持黑白调性
  if (type === 'success') {
    const icon = document.createElement('span');
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>`;
    icon.className = 'notification-icon';
    icon.style.height = '100%';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.marginRight = '8px';
    notification.appendChild(icon);
  } else if (type === 'loading') {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    notification.appendChild(spinner);
  } else if (type === 'error') {
    const icon = document.createElement('span');
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
    icon.className = 'notification-icon';
    icon.style.height = '100%';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.marginRight = '8px';
    notification.appendChild(icon);
  } else if (type === 'warning') {
    const icon = document.createElement('span');
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
    icon.className = 'notification-icon';
    icon.style.height = '100%';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.marginRight = '8px';
    notification.appendChild(icon);
  } else { // info
    const icon = document.createElement('span');
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
    icon.className = 'notification-icon';
    icon.style.height = '100%';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.marginRight = '8px';
    notification.appendChild(icon);
  }
  
  // 添加消息内容
  const messageSpan = document.createElement('span');
  messageSpan.innerHTML = message;
  messageSpan.style.height = '100%';
  messageSpan.style.display = 'flex';
  messageSpan.style.alignItems = 'center';
  notification.appendChild(messageSpan);
  
  document.body.appendChild(notification);
  
  // 添加点击事件处理
  const bunnLink = notification.querySelector('.bunn-link');
  if (bunnLink) {
    bunnLink.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(linkUrl, '_blank');
    });
  }
  
  // 触发动画
  setTimeout(() => notification.classList.add('show'), 10);
  
  // 设置自动消失
  if (type !== 'loading') {
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000); // 增加到5秒，让用户有更多时间看到消息
  }
  
  return notification;
}

// 显示带有按钮的通知
export function showNotificationWithAction(
  messageOrKey: string, 
  type: 'info' | 'error' | 'warning' | 'loading' | 'success' = 'info',
  actionText: string,
  actionUrl: string,
  isTranslationKey: boolean = false,
  ...args: any[]
) {
  if (!document.body) return; // 确保document.body存在
  
  // 获取要显示的消息文本
  const message = isTranslationKey ? getTranslation(messageOrKey, undefined, ...args) : messageOrKey;
  // 获取按钮文本（支持国际化）
  const buttonText = isTranslationKey ? getTranslation(actionText, undefined, ...args) : actionText;

  // 清除所有现有通知，确保不会有多个通知同时显示
  clearAllNotifications();

  const notification = document.createElement('div');
  notification.className = 'netflix-subtitle-notification';
  notification.classList.add(type);
  
  // 设置通知样式为水平布局
  notification.style.display = 'flex';
  notification.style.flexDirection = 'row'; // 水平布局
  notification.style.alignItems = 'center';
  notification.style.justifyContent = 'space-between'; // 内容两端对齐
  notification.style.padding = '12px';
  notification.style.minWidth = '300px'; // 设置最小宽度，确保有足够空间
  
  // 创建消息容器，它将包含图标和文本
  const messageContainer = document.createElement('div');
  messageContainer.style.display = 'flex';
  messageContainer.style.alignItems = 'center';
  messageContainer.style.marginRight = '16px'; // 与按钮保持间距
  messageContainer.style.flex = '1'; // 让消息容器占据剩余空间
  
  // 根据类型添加不同的图标
  if (type === 'error') {
    const icon = document.createElement('span');
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
    icon.className = 'notification-icon';
    icon.style.height = '100%';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.marginRight = '8px'; // 图标与文本的间距
    messageContainer.appendChild(icon);
  } else if (type === 'warning') {
    const icon = document.createElement('span');
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
    icon.className = 'notification-icon';
    icon.style.height = '100%';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.marginRight = '8px'; // 图标与文本的间距
    messageContainer.appendChild(icon);
  }
  
  // 添加消息文本
  const messageSpan = document.createElement('span');
  messageSpan.innerHTML = message;
  messageSpan.style.height = '100%';
  messageSpan.style.display = 'flex';
  messageSpan.style.alignItems = 'center';
  messageContainer.appendChild(messageSpan);
  
  notification.appendChild(messageContainer);
  
  // 创建按钮
  const button = document.createElement('button');
  button.textContent = buttonText;
  button.style.padding = '4px 12px';
  button.style.borderRadius = '4px';
  button.style.backgroundColor = '#3B82F6';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';
  button.style.whiteSpace = 'nowrap'; // 防止按钮文本换行
  button.style.flexShrink = '0'; // 防止按钮被压缩
  
  // 添加按钮点击事件
  button.onclick = (e) => {
    e.preventDefault();
    window.open(actionUrl, '_blank');
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  };
  
  notification.appendChild(button);
  document.body.appendChild(notification);
  
  // 触发动画
  setTimeout(() => notification.classList.add('show'), 10);
  
  // 通知不会自动消失，用户需要点击按钮或手动关闭
  
  return notification;
}