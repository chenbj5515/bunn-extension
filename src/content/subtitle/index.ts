import {
  lastSubtitle,
  isNetflix,
  isYouTube,
  lastCopiedTime,
  addNotificationStyle,
  showNotification,
  checkSubtitle,
  captureYoutubeSubtitle,
  updateLastCopiedTime
} from './helpers';

/**
 * 处理复制字幕快捷键 (Ctrl+C / Cmd+C)
 */
async function handleCopySubtitle(e: KeyboardEvent) {
  e.preventDefault();
  
  if (isNetflix) {
    if (!lastSubtitle.text) {
      showNotification('No subtitle available to copy');
      console.log('No subtitles to copy.');
      return;
    }

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('t', Math.floor(lastSubtitle.startTime).toString());

    const subtitleData = {
      url: currentUrl.toString(),
      text: lastSubtitle.text
    };

    navigator.clipboard.writeText(JSON.stringify(subtitleData))
      .then(() => {
        showNotification('Subtitle copied successfully!');
        console.log('Copied Netflix subtitles:', subtitleData);
        updateLastCopiedTime(lastSubtitle.startTime);
      })
      .catch(err => {
        showNotification('Failed to copy subtitle');
        console.error('Failed to copy subtitles:', err);
      });
  } else if (isYouTube) {
    // YouTube处理
    await captureYoutubeSubtitle();
  }
}

/**
 * 处理YouTube上的左右箭头键
 */
function handleYouTubeArrowKeys(e: KeyboardEvent) {
  e.preventDefault();
  
  const video = document.querySelector('.video-stream') as HTMLVideoElement;
  if (video) {
    if (e.key === 'ArrowLeft') {
      video.currentTime -= 1;
    } else if (e.key === 'ArrowRight') {
      video.currentTime += 1;
    }
  }
}

/**
 * 处理调整视频时间快捷键 (Ctrl+R / Cmd+R)
 */
function handleAdjustVideoTime(e: KeyboardEvent) {
  e.preventDefault();

  const video = document.querySelector('video') as HTMLVideoElement;
  if (video) {
    console.log('lastCopiedTime:', lastCopiedTime);
    if (lastCopiedTime !== null) {
      video.currentTime = lastCopiedTime;
      showNotification('Video time adjusted to last copied time: ' + lastCopiedTime + ' seconds');
    } else {
      const currentUrl = new URL(window.location.href);
      const timeParam = currentUrl.searchParams.get('t');
      if (timeParam) {
        video.currentTime = parseFloat(timeParam);
        showNotification('Video time adjusted to ' + timeParam + ' seconds');
      } else {
        showNotification('No time parameter found in URL');
      }
    }
  } else {
    showNotification('Video element not found');
  }
}

/**
 * 处理键盘事件
 */
async function handleKeyDown(e: KeyboardEvent) {
  // 处理复制快捷键 (Ctrl+C / Cmd+C)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    await handleCopySubtitle(e);
  }
  // 处理YouTube上的左右箭头键
  else if (isYouTube && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    handleYouTubeArrowKeys(e);
  }
  // 处理调整视频时间快捷键 (Ctrl+R / Cmd+R)
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
    handleAdjustVideoTime(e);
  }
}

/**
 * 初始化字幕功能
 */
export function initializeSubtitleFeatures() {
  // 添加通知样式
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addNotificationStyle);
  } else {
    addNotificationStyle();
  }

  // 每500毫秒检查一次Netflix字幕
  if (isNetflix) {
    setInterval(checkSubtitle, 500);
  }

  // 移除YouTube评论区的翻译按钮
  try {
    // 立即执行一次移除操作
    document.querySelectorAll('.translate-button.style-scope.ytd-comment-view-model').forEach(el => el.remove());
    
    // 使用MutationObserver持续监听DOM变化，移除新出现的翻译按钮
    const observer = new MutationObserver((mutations) => {
      document.querySelectorAll('.translate-button.style-scope.ytd-comment-view-model').forEach(el => el.remove());
    });
    
    // 开始观察文档变化
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    console.log('已设置移除YouTube评论区翻译按钮的监听器');
  } catch (error) {
    console.error('移除YouTube评论区翻译按钮时出错:', error);
  }

  // 监听键盘事件
  window.addEventListener('keydown', handleKeyDown, true);
}

// 自动初始化
// initializeSubtitleFeatures();

// TODO, 宣传图片，图标设计