// 辅助函数和工具函数

// 全局变量
export let lastSubtitle = { text: '', startTime: 0 };
export let isNetflix = window.location.hostname.includes('netflix.com');
export let isYouTube = window.location.hostname.includes('youtube.com');
export let isRequestInProgress = false; // 标记是否有请求正在进行中
export let lastCopiedTime: number | null = null; // 记录上次ctrl+c指令的时间

import { getApiKey } from '../../common/api';

// 创建并添加通知元素样式
export function addNotificationStyle() {
  if (!document.head) return; // 确保document.head存在

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
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);

  document.body.appendChild(notification);

  // 触发动画
  setTimeout(() => notification.classList.add('show'), 10);

  // 如果不是加载中状态，3秒后移除通知
  if (!isLoading) {
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// 隐藏通知
export function hideNotification() {
  const notification = document.querySelector('.netflix-subtitle-notification');
  if (notification) {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }
}

// 检查字幕
export function checkSubtitle() {
  const subtitleSpans = document.querySelectorAll('.player-timedtext-text-container span');
  const currentTime = document.querySelector('video')?.currentTime;

  // 连接所有字幕文本
  const currentText = Array.from(subtitleSpans)?.[0]?.textContent?.trim();

  // 如果字幕变化，更新lastSubtitle
  if (currentText && currentText !== lastSubtitle.text && currentTime !== undefined) {
    lastSubtitle = { text: currentText, startTime: currentTime };
    console.log('Updated subtitle:', lastSubtitle);
  }
}

// 从图像中提取字幕
export async function extractSubtitlesFromImage(imageData: Uint8Array | number[]) {
  const apiKey = await getApiKey();

  if (apiKey) {
    // 有 API Key，直接请求 OpenAI 接口
    const base64Image = arrayBufferToBase64(imageData);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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

// 将 ArrayBuffer 转换为 base64
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array | number[]) {
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

// 捕获YouTube字幕
export async function captureYoutubeSubtitle() {
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
      const currentTime = video.currentTime - 2;
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

// 更新上次复制的时间
export function updateLastCopiedTime(time: number) {
  lastCopiedTime = time;
} 