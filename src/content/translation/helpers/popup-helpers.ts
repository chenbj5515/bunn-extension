import { speakText } from '@/common/tts';
import { showNotification } from '@/common/notify'; 

/**
 * 根据字符数计算适当的宽度，以保持宽高比接近368:500
 * @param charCount 字符数量
 * @returns 计算得到的宽度（像素）
 */
export function calculateWidthFromCharCount(charCount: number): number {
    // 基准数据：361字符对应368px宽，164字符对应280px宽
    let width = 0;

    if (charCount <= 100) {
        width = 250; // 字符很少时的最小宽度
    } else if (charCount <= 200) {
        width = 280; // 约164字符时的宽度
    } else if (charCount <= 300) {
        width = 320;
    } else if (charCount <= 400) {
        width = 368; // 约361字符时的宽度
    } else {
        width = 400; // 字符很多时的最大宽度
    }

    return width;
}

// 创建弹窗
export function createPopup(popupId: string): HTMLElement {
    console.log('调用createPopup函数');
    // 创建弹窗元素
    let popup = document.createElement('div');
    popup.id = popupId;
    popup.className = 'comfy-trans-popup';
    popup.style.cssText = `
        position: absolute;
        overflow: visible;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        display: block;
        opacity: 1;
        visibility: visible;
        font-size: 14px;
        line-height: 1.5;
        transition: opacity 0.3s ease;
    `;

    // 创建内容容器
    const content = document.createElement('div');
    content.className = 'comfy-trans-content';
    console.log('创建内容容器');

    // 添加到弹窗
    popup.appendChild(content);
    console.log('将内容容器添加到弹窗');

    // 添加到文档
    document.body.appendChild(popup);
    console.log('将弹窗添加到文档');

    // 点击页面其他区域关闭弹窗
    document.addEventListener('click', (e) => {
        if (popup.style.display === 'block' && !popup.contains(e.target as Node)) {
            console.log('createPopup中的全局点击事件：点击发生在弹窗外部，关闭弹窗，点击的元素:', e.target);
            popup.style.display = 'none';

            // 重置全局变量
            if ((window as any).currentVisiblePopup === popup) {
                (window as any).currentVisiblePopup = null;
            }
        }
    });
    console.log('添加点击事件监听');

    return popup;
}

// 显示弹窗
export function showPopup(text: string, x: number, y: number, popupId: string): HTMLElement {
    console.log('调用showPopup函数，文本:', text, '位置:', x, y);
    const popup = createPopup(popupId);

    // 更新当前显示的弹窗
    (window as any).currentVisiblePopup = popup;

    console.log(popup, '创建弹窗完成');
    const content = popup.querySelector('.comfy-trans-content') as HTMLElement;

    // 清空内容
    content.innerHTML = '<div class="comfy-trans-loading">正在翻译...</div>';
    console.log('设置加载提示');

    // 根据文本长度初步估计弹窗宽度
    const textLength = text.length;
    console.log('文本长度:', textLength);

    // 根据文本长度计算初始宽度
    const width = calculateWidthFromCharCount(textLength);
    popup.style.width = `${width}px`;
    popup.style.maxWidth = `${width}px`;

    // 先设置为可见，以便计算尺寸
    popup.style.display = 'block';
    popup.style.opacity = '1';
    popup.style.visibility = 'visible';
    console.log('设置弹窗为可见，以便计算尺寸');

    // 设置主题
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
        popup.classList.add('dark-theme');
        popup.classList.remove('light-theme');
        popup.style.backgroundColor = '#2d2d2d';
        popup.style.color = '#f0f0f0';
        popup.style.border = '1px solid #444';
    } else {
        popup.classList.add('light-theme');
        popup.classList.remove('dark-theme');
        popup.style.backgroundColor = '#f9f9f9';
        popup.style.color = '#333';
        popup.style.border = '1px solid #ddd';
    }
    console.log('设置主题样式完成');

    // 立即设置位置，使用absolute定位
    popup.style.position = 'absolute';
    popup.style.left = `${x + window.scrollX}px`;
    popup.style.top = `${y + window.scrollY}px`;
    console.log('设置初始位置:', x + window.scrollX, y + window.scrollY);

    // 使用setTimeout确保DOM已更新
    setTimeout(() => {
        // 获取弹窗尺寸
        const popupRect = popup.getBoundingClientRect();
        console.log('弹窗尺寸:', popupRect.width, popupRect.height);

        // 计算位置，确保在选中文本右侧偏下
        let posX = x;
        let posY = y;
        console.log('初始位置:', posX, posY);

        // 检查是否会超出视窗右侧
        if (posX + popupRect.width > window.innerWidth + window.scrollX) {
            // 如果超出右侧，则显示在左侧
            posX = x - popupRect.width - 10;
            console.log('调整水平位置，避免超出右侧:', posX);
        }

        // 检查是否会超出视窗底部
        if (posY + popupRect.height > window.innerHeight + window.scrollY) {
            // 如果超出底部，则向上调整
            posY = window.innerHeight + window.scrollY - popupRect.height - 10;
            console.log('调整垂直位置，避免超出底部:', posY);
        }

        // 设置最终位置，使用absolute定位
        popup.style.position = 'absolute';
        popup.style.left = `${posX + window.scrollX}px`;
        popup.style.top = `${posY + window.scrollY}px`;
        console.log('设置最终位置:', posX + window.scrollX, posY + window.scrollY);

        console.log('弹窗位置:', posX + window.scrollX, posY + window.scrollY, '弹窗尺寸:', popupRect.width, popupRect.height);
    }, 0);

    return popup;
}

// 处理Popup显示的统一函数
export function handlePopupDisplay(e: MouseEvent) {
    e.stopPropagation();

    const span = e.currentTarget as HTMLElement;
    const popupId = span.dataset.popup;

    // 如果是点击事件，播放文本
    if (e.type === 'click') {
        const text = span.textContent || '';
        speakText(text);
    }

    if (popupId) {
        const popup = document.getElementById(popupId);

        if (popup) {
            // 获取当前显示的弹窗
            const currentVisiblePopup = (window as any).currentVisiblePopup;
            if (currentVisiblePopup) {
                return;
            }

            // 更新当前显示的Popup
            (window as any).currentVisiblePopup = popup as HTMLElement;

            // 先设置为可见，以便计算尺寸
            popup.style.display = 'block';
            popup.style.opacity = '1';
            popup.style.visibility = 'visible';

            // 使用setTimeout确保DOM已更新
            setTimeout(() => {
                // 计算位置
                const rect = span.getBoundingClientRect();
                const popupRect = popup.getBoundingClientRect();

                // 使用存储的最终宽度，如果有的话
                if (popup.dataset.finalWidth) {
                    const finalWidth = parseInt(popup.dataset.finalWidth);
                    popup.style.width = `${finalWidth}px`;
                    popup.style.maxWidth = `${finalWidth}px`;
                }

                // 将悬浮窗定位在单词的右下角
                let posX = rect.right;
                let posY = rect.bottom;

                // 检查是否会超出视窗右侧
                if (posX + popupRect.width > window.innerWidth + window.scrollX) {
                    // 如果超出右侧，则显示在左侧
                    posX = rect.left - popupRect.width;
                }

                // 检查是否会超出视窗底部
                if (posY + popupRect.height > window.innerHeight + window.scrollY) {
                    // 如果超出底部，则显示在上方
                    posY = rect.top - popupRect.height;
                }

                // 设置最终位置，使用absolute定位而不是fixed
                popup.style.position = 'absolute';
                popup.style.left = `${posX + window.scrollX}px`;
                popup.style.top = `${posY + window.scrollY}px`;
            }, 0);
        } else {
            showNotification('无法加载译文弹窗', 'error', false, false);
        }
    } else {
    }
}