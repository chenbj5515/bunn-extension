let lastSubtitle = { text: '', startTime: 0 };
let isNetflix = window.location.hostname.includes('netflix.com');
let isYouTube = window.location.hostname.includes('youtube.com');
let isRequestInProgress = false; // 新增变量，标记是否有请求正在进行中
let lastCopiedTime: number | null = null; // 新增变量，记录上次ctrl+c指令的时间

// Create and add notification element styles
function addNotificationStyle() {
  if (!document.head) return; // Ensure document.head exists

  const style = document.createElement('style');
  style.textContent = `
        .netflix-subtitle-notification {
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
            gap: 8px;
        }
        .netflix-subtitle-notification.show {
            opacity: 1;
            transform: translateY(0);
        }
        .netflix-subtitle-notification .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #ccc;
            border-top-color: transparent;
            border-radius: 50%;
            display: none;
            animation: spin 1s linear infinite;
        }
        .netflix-subtitle-notification.loading .spinner {
            display: inline-block;
        }
        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
    `;
  document.head.appendChild(style);
}

// Wait for DOM to load before adding styles
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addNotificationStyle);
} else {
  addNotificationStyle();
}

function showNotification(message: string, isLoading = false) {
  if (!document.body) return; // Ensure document.body exists

  const notification = document.createElement('div');
  notification.className = 'netflix-subtitle-notification';

  if (isLoading) {
    notification.classList.add('loading');
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    notification.appendChild(spinner);
  }

  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);

  // Remove notification after 3 seconds if not loading
  if (!isLoading) {
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

function hideNotification() {
  const notification = document.querySelector('.netflix-subtitle-notification');
  if (notification) {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }
}

function checkSubtitle() {
  const subtitleSpans = document.querySelectorAll('.player-timedtext-text-container span');
  const currentTime = document.querySelector('video')?.currentTime;

  // Concatenate all subtitle text
  const currentText = Array.from(subtitleSpans)?.[0]?.textContent?.trim();

  // If subtitle changes, update lastSubtitle
  if (currentText && currentText !== lastSubtitle.text && currentTime !== undefined) {
    lastSubtitle = { text: currentText, startTime: currentTime };
    console.log('Updated subtitle:', lastSubtitle);
  }
}

// Check subtitles every 500ms for Netflix
if (isNetflix) {
  setInterval(checkSubtitle, 500);
}

async function extractSubtitlesFromImage(imageData: Uint8Array | number[]) {
  try {
    const result = await chrome.storage.local.get(['openai_api_key']);
    console.log('result:', result);
    if (result.openai_api_key) {
      // 修改图片数据的处理方式
      const base64Image = arrayBufferToBase64(imageData);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.openai_api_key}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please extract any subtitles or captions from this image. Only return the text content, nothing else."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    }
  } catch (error) {
    console.error('Error accessing OpenAI API directly:', error);
  }

  // 如果没有 API key 或直接请求失败，回退到通过 background.js 处理
  const response = await chrome.runtime.sendMessage({
    type: "EXTRACT_SUBTITLES",
    data: {
      imageData
    }
  });

  if (response.error) {
    showNotification(response.error);
    throw new Error(response.error);
  }

  return response.result || '';
}

// 添加一个新的辅助函数来安全地转换 ArrayBuffer 到 base64
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array | number[]) {
  let binary = '';
  const bytes = buffer instanceof Uint8Array ? buffer : 
               buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : 
               new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function captureYoutubeSubtitle() {
  if (isRequestInProgress) {
    showNotification('A request is already in progress');
    return;
  }

  const video = document.querySelector('.video-stream') as HTMLVideoElement;
  if (!video) {
    showNotification('Video element not found');
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  try {
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        try {
          isRequestInProgress = true; // 标记请求开始
          showNotification('Reading current subtitles...', true);
          if (blob) {
            const arrayBuffer = await blob.arrayBuffer();
            const imageData = Array.from(new Uint8Array(arrayBuffer))  // 转换为普通数组以便传递

            const subtitleText = await extractSubtitlesFromImage(imageData);
            console.log('subtitleText:', subtitleText);
            if (subtitleText) {
              const currentTime = video.currentTime - 2;
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.set('t', Math.floor(currentTime).toString());

              const subtitleData = {
                url: currentUrl.toString(),
                text: subtitleText
              };

              await navigator.clipboard.writeText(JSON.stringify(subtitleData));
              showNotification('Subtitle data copied to clipboard');
              lastCopiedTime = currentTime; // 记录上次复制的时间
            } else {
              showNotification('Failed to recognize subtitles');
            }
          } else {
            showNotification('Failed to create image blob');
          }
        } catch (err) {
          console.error('Processing failed:', err);
          showNotification('Processing failed');
        } finally {
          isRequestInProgress = false; // 标记请求结束
          hideNotification(); // 隐藏通知
        }
      });
    } else {
      throw new Error('Failed to get canvas context');
    }
  } catch (err) {
    console.error('Screenshot failed:', err);
    showNotification('Screenshot failed');
    hideNotification(); // 隐藏通知
  }
}

// Listen for copy shortcut
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
        lastCopiedTime = lastSubtitle.startTime; // 记录上次复制的时间
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

// Listen for left and right arrow keys on YouTube
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

// Listen for ctrl+r to adjust video time
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