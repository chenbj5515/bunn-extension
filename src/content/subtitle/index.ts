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

// 业务流程：在Youtube上获取字幕和影子跟读
// 1 用户打开一个含有内置字幕的Youtube视频（比如：https://www.youtube.com/watch?v=QrwxVi9hWJg&t=374s）
// 2 用户遇到不懂的句子，按下ctrl + c键，触发handleCopySubtitle函数
// 3 在captureYoutubeSubtitle里获取到当前视频帧的截图数据，用extractSubtitlesFromImage提取出字幕文本
// 4-1 如果有存储的API Key，那么直接请求OpenAI接口，获取字幕文本
// 4-2-1 如果没有存储的API Key，那么就会发起EXTRACT_SUBTITLES消息，请求后台脚本提取字幕文本
// 4-2-2 后台脚本会调用我的后端服务器上的/api/openai/extract-subtitles接口，获取字幕文本
// 4-3 获取到字幕文本后，将一个JSON格式的数据复制到剪切板，JSON中包括字幕文本和带有当前播放位置的url
// 5 用户把剪切板内容复制到Bunn应用，Bunn支持JSON格式数据，会把相关的信息记录到DB
// 6 用户复习的时候，想要查看句子的上下文，点击查看按钮，打开步骤3中的url
// 7 youtube会自动把视频的播放位置设置为url中t参数的值，用户得以重温句子


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

  // 监听键盘事件
  window.addEventListener('keydown', handleKeyDown, true);
}

/**
 * 处理键盘事件
 */
async function handleKeyDown(e: KeyboardEvent) {
  // 处理复制快捷键 (Ctrl+Shift+C / Cmd+Shift+C)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
    await handleCopySubtitle(e);
  }
  // 处理YouTube上的左右箭头键
  else if (isYouTube && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    handleYouTubeArrowKeys(e);
  }
  // 处理调整视频时间快捷键 (Ctrl+Shift+R / Cmd+Shift+R)
  else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
    handleAdjustVideoTime(e);
  }
}

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
