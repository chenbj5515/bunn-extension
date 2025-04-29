import { showNotification, updateNotification, showNotificationWithAction, showNotificationWithLink, hideNotification as importedHideNotification } from '@/common/notify';

// 全局变量
export let lastSubtitle = { text: '', startTime: 0 };
export let isNetflix = window.location.hostname.includes('netflix.com');
export let isYouTube = window.location.hostname.includes('youtube.com');
export let isRequestInProgress = false; // 标记是否有请求正在进行中
export let lastCopiedTime: number | null = null; // 记录上次ctrl+c指令的时间

// 创建并添加通知元素样式 - 已移至common/notify.ts全局样式定义，此函数不再需要
export function addNotificationStyle() {
  // 此函数保留空实现以兼容现有代码调用，但实际不需要执行任何操作
  // 通知样式已在common/notify.ts中统一定义
}

// 隐藏通知 - 使用新的通知API
export function hideNotification() {
  // 直接调用common/notify.ts中的hideNotification函数
  importedHideNotification();
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
  const apiKey = false

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

  if (response?.error) {
    if (response.error === 'TOKEN_LIMIT_REACHED') {
      // 处理token限制的特殊情况
      // 根据环境选择不同的URL
      const upgradeUrl = 'https://www.bunn.ink/pricing' 

      // 使用新API显示带操作按钮的通知，不自动消失
      showNotificationWithAction('token.limit.reached', 'warning', 'upgrade.button', upgradeUrl, true);
      throw new Error('Token limit reached');
    } else {
      // 使用新API显示错误通知，不自动消失
      showNotification(response.error, 'error', false, false);
      throw new Error(response.error);
    }
  }

  return response?.result || '';
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
    // 正在处理请求，显示警告通知
    showNotification('processing.request', 'warning', true, false);
    return;
  }

  const video = document.querySelector('.video-stream') as HTMLVideoElement;
  if (!video) {
    // 未找到视频，显示错误通知
    showNotification('video.not.found', 'error', true, false);
    return;
  }

  // 获取channelId和channelName
  let channelId = "";
  let channelName = "";
  let avatarUrl = "";
  const channelElement = document.querySelector('ytd-channel-name a');
  if (channelElement) {
    const href = channelElement.getAttribute('href');
    if (href) {
      channelId = href.startsWith('/') ? href.substring(1) : href;
    }
    channelName = channelElement.textContent?.trim() || "";
    
    // 获取频道头像URL
    const avatarElement = document.querySelector('#avatar');
    if (avatarElement) {
      const imgElement = avatarElement.querySelector('img');
      if (imgElement) {
        avatarUrl = imgElement.getAttribute('src') || "";
      }
    }
  }

  // 获取videoTitle
  let videoTitle = "";
  const titleElement = document.querySelector('#title yt-formatted-string');
  if (titleElement) {
    const titleAttr = titleElement.getAttribute('title');
    if (titleAttr) {
      // 移除类似【アニメ】【コント】的括号内容以及#及其后面的内容
      videoTitle = titleAttr
        .replace(/【[^】]*】/g, '')  // 移除【】及其内容
        .replace(/#.*$/, '')         // 移除#及其后面的内容
        .trim();
    }
  }

  // 获取videoId
  let videoId = "";
  const urlParams = new URLSearchParams(window.location.search);
  videoId = urlParams.get('v') || "";

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
          showNotification('recognizing.subtitles', 'loading', true, false);
          
          if (blob) {
            const arrayBuffer = await blob.arrayBuffer();
            const imageData = Array.from(new Uint8Array(arrayBuffer))  // 转换为普通数组以便传递
            
            try {
              const subtitleText = await extractSubtitlesFromImage(imageData);
              
              if (subtitleText) {
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set('t', Math.floor(currentTime).toString());

                // 将字幕文本转换为全角字符
                const fullWidthText = convertToFullWidth(subtitleText);

                const subtitleData = {
                  url: currentUrl.toString(),
                  text: fullWidthText,
                  channelId: channelId,
                  channelName: channelName,
                  videoTitle: videoTitle,
                  videoId: videoId,
                  avatarUrl: avatarUrl,
                };

                await navigator.clipboard.writeText(JSON.stringify(subtitleData));
                // 显示成功通知，不自动消失，通过点击链接或外部区域关闭
                showNotificationWithLink('subtitle.copied.with.ctrl', 'success', 'https://www.bunn.ink', true);
                
                lastCopiedTime = currentTime; // 记录上次复制的时间
              } else {
                // 显示失败通知，不自动消失
                updateNotification('subtitle.recognition.failed', 'error', true, false);
              }
            } catch (error: any) {
              console.error('字幕提取失败:', error);
              // 如果错误已经由extractSubtitlesFromImage处理，则此处不再显示通知
              if (error.message !== 'Token limit reached') {
                updateNotification('subtitle.extraction.failed', 'error', true, false);
              }
            }
          } else {
            updateNotification('image.creation.failed', 'error', true, false);
          }
        } catch (err) {
          console.error('处理失败:', err);
          updateNotification('processing.failed', 'error', true, false);
        } finally {
          isRequestInProgress = false; // 标记请求结束
        }
      });
    } else {
      throw new Error('无法获取Canvas上下文');
    }
  } catch (err) {
    console.error('截图失败:', err);
    showNotification('screenshot.failed', 'error', true, false);
  }
}

// 更新上次复制的时间
export function updateLastCopiedTime(time: number) {
  lastCopiedTime = time;
}

/**
 * 将半角标点符号和数字转换为全角字符，只保留、。！？这四个标点符号
 * @param text 需要转换的文本
 * @returns 转换后的文本
 */
export function convertToFullWidth(text: string): string {
  // 先替换数字为全角数字
  let result = text.replace(/[0-9]/g, s => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
  
  // 替换指定的标点符号为全角版本
  result = result
    .replace(/,/g, '，')
    .replace(/\./g, '。')
    .replace(/!/g, '！')
    .replace(/\?/g, '？');
  
  // 移除其他所有标点符号（保留字母、数字、汉字、假名和指定的标点符号）
  // \u4e00-\u9fa5 是汉字范围
  // \u3040-\u309F 是平假名范围
  // \u30A0-\u30FF 是片假名范围
  result = result.replace(/[^\w\s\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF，。！？]/g, '');
  
  return result;
} 