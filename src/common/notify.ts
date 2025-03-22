// 显示通知
export function showNotification(message: string, type: 'info' | 'error' | 'warning' | 'loading' = 'info') {
    if (!document.body) return; // 确保document.body存在
  
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
      // 添加右侧margin以与文本保持间距
      spinner.style.marginRight = '8px';
      spinner.style.height = '100%';
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
}

// 清除所有现有通知的辅助函数
function clearAllNotifications() {
  const existingNotifications = document.querySelectorAll('.netflix-subtitle-notification');
  existingNotifications.forEach(notification => {
    notification.remove();
  });
}