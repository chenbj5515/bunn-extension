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

// 等待DOM加载完成后添加样式
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addNotificationStyle);
} else {
  addNotificationStyle();
}

// 每500毫秒检查一次Netflix字幕
if (isNetflix) {
  setInterval(checkSubtitle, 500);
}

// 监听复制快捷键
window.addEventListener('keydown', async (e) => {
  const isCopyShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c';
  if (!isCopyShortcut) return;

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
}, true);

// 监听YouTube上的左右箭头键
window.addEventListener('keydown', (e) => {
  if (isYouTube) {
    const video = document.querySelector('.video-stream') as HTMLVideoElement;
    if (video) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        video.currentTime -= 1;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        video.currentTime += 1;
      }
    }
  }
}, true);

// 监听ctrl+r调整视频时间
window.addEventListener('keydown', (e) => {
  const isAdjustTimeShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r';
  if (!isAdjustTimeShortcut) return;

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
}, true);

// TODO, 宣传图片，图标设计