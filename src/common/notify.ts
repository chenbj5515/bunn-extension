// 显示通知
export function showNotification(message: string, isLoading = false) {
    if (!document.body) return; // 确保document.body存在
  
    const notification = document.createElement('div');
    notification.className = 'netflix-subtitle-notification';
  
    if (isLoading) {
      notification.classList.add('loading');
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      notification.appendChild(spinner);
    }
  
    const messageSpan = document.createElement('span');
    messageSpan.innerHTML = message; // 使用innerHTML支持HTML内容
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
      // 鼠标离开后开始倒计时关闭
      startHideTimer();
    });
    
    // 定义开始隐藏计时器的函数
    const startHideTimer = () => {
      if (!isLoading && !isHovering) {
        hideTimeout = window.setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }
    };
    
    // 如果不是加载中状态，启动隐藏计时器
    if (!isLoading) {
      startHideTimer();
    }
}