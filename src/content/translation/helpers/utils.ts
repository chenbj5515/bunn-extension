import { showNotification } from '@/common/notify';
import { API_BASE_URL } from "@/utils/api";

// 将选中文本复制到剪贴板
export async function copyToClipboard(text: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('scrollY', window.scrollY.toString());
    url.searchParams.set('text', encodeURIComponent(text));
    const data = {
        text,
        url: url.toString()
    };

    try {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        console.log('成功复制到剪贴板:', data);
        // 创建带有Bunn链接的通知
        const successMessage = '复制成功！请将内容粘贴到<a href="https://www.bunn.ink/zh/memo-cards" target="_blank" style="text-decoration:underline;color:inherit;">Bunn</a>应用中以保存和复习。';
        showNotification(successMessage);
    } catch (err) {
        console.error('复制到剪贴板失败:', err);
        showNotification('复制失败，请重试。');
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
        showNotification('移除YouTube翻译按钮时出错', 'error');
    }
} 