import { showNotification, showNotificationWithLink } from '@/common/notify';
// import { API_BASE_URL } from "@/utils/api";

// 添加获取baseUrl的函数
function getBaseUrl(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'http://localhost:3000' : 'https://www.bunn.ink';
}

/**
 * 将半角标点符号和数字转换为全角字符，只保留、。！？这四个标点符号
 * @param text 需要转换的文本
 * @returns 转换后的文本
 */
function convertToFullWidth(text: string): string {
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

// 将选中文本复制到剪贴板
export async function copyToClipboard(text: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('scrollY', window.scrollY.toString());
    
    // 将文本转换为全角字符
    const fullWidthText = convertToFullWidth(text);
    
    url.searchParams.set('text', encodeURIComponent(fullWidthText));
    const data = {
        text: fullWidthText,
        url: url.toString()
    };

    try {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        console.log('成功复制到剪贴板:', data);
        // 使用showNotificationWithLink函数并传入false作为autoHide参数，使弹窗不会自动消失
        showNotificationWithLink('subtitle.copied.with.ctrl', 'success', getBaseUrl(), true, false);
    } catch (err) {
        console.error('复制到剪贴板失败:', err);
        showNotification('复制失败，请重试。', 'error', false, false);
    }
}

// 从URL恢复文本并高亮显示
export async function highlightRestoredText(decodedText: string) {
    // 等待滚动完成后查找并高亮文本
    setTimeout(() => {
        // 使用 TreeWalker 遍历 DOM 树查找文本节点
        const treeWalker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    return node.textContent?.includes(decodedText)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            }
        );

        let currentNode;
        while (currentNode = treeWalker.nextNode()) {
            const range = document.createRange();
            range.selectNode(currentNode);
            const rect = range.getBoundingClientRect();

            // 检查元素是否在可视区域内
            if (rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= window.innerHeight &&
                rect.right <= window.innerWidth) {

                // 创建 span 包裹匹配文本
                const span = document.createElement('span');
                span.textContent = currentNode.textContent;
                currentNode.parentNode?.replaceChild(span, currentNode);

                // 添加动画类
                span.classList.add('highlight-animation');

                // 动画结束后移除类
                span.addEventListener('animationend', () => {
                    span.classList.remove('highlight-animation');
                });

                break; // 只高亮第一个匹配的可见元素
            }
        }
    }, 1000); // 给滚动动画留出足够时间
}

// 处理URL参数，包括滚动和文本高亮
export async function handleHighlight() {
    const url = new URL(window.location.href);
    const scrollY = url.searchParams.get('scrollY');
    const encodedText = url.searchParams.get('text');

    if (encodedText) {
        const decodedText = decodeURIComponent(encodedText);
        console.log('从 URL 恢复的文本:', decodedText);

        // 调用高亮函数
        await highlightRestoredText(decodedText);
    }

    if (scrollY) {
        window.scrollTo({
            top: parseInt(scrollY),
            behavior: 'smooth'
        });
    }
}

export function removeYoutubeTranslateButton() {
    // 移除YouTube评论区的翻译按钮
    try {
        // 移除youtube上多余的翻译成中文的按钮，避免
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
        showNotification('移除YouTube翻译按钮时出错', 'error', false, false);
    }
} 