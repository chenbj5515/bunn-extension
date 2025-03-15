import { askAI, askAIStream } from "@/common/api";
import { speakText } from '@/common/tts';
import { isJapaneseText, addRubyForJapanese, generateUniqueId } from '@/common/utils';
import { InsertPosition } from "@/common/types";


/**
 * 获取翻译后的HTML
 * @param originalHTML 原始HTML
 * @returns 翻译后的HTML
 */
export async function getTranslatedHTML(originalHTML: string): Promise<string> {
    const result = await askAI(
        `
        我会给你一个HTML标签及其内容，请将其中的文本内容翻译成中文，但保持HTML结构和属性不变。
        原始HTML:
        ${originalHTML}
        请返回完整的HTML标签，只将文本内容替换为中文翻译。不要添加任何解释或前缀，直接返回翻译后的HTML。
        `,
        'gpt-4o',
    );

    // 清理可能的前缀和后缀文本
    let translatedHTML = result.trim();

    // 如果AI返回了带有代码块的回答，提取代码块内容
    if (translatedHTML.includes('```html')) {
        translatedHTML = translatedHTML.split('```html')[1].split('```')[0].trim();
    } else if (translatedHTML.includes('```')) {
        translatedHTML = translatedHTML.split('```')[1].split('```')[0].trim();
    }

    return translatedHTML;
}

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

/**
 * 创建翻译的div元素
 */
export function createTranslationDiv(): HTMLDivElement {
    const translationDiv = document.createElement('div');
    translationDiv.className = 'comfy-trans-translation';
    translationDiv.style.marginBottom = '10px';
    translationDiv.style.fontWeight = 'bold';
    translationDiv.style.wordBreak = 'break-word';
    translationDiv.style.whiteSpace = 'normal';
    translationDiv.style.fontSize = '14px';
    translationDiv.style.lineHeight = '1.9';
    return translationDiv;
}

/**
 * 创建解释的div元素
 */
export function createExplanationDiv(): HTMLDivElement {
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'comfy-trans-explanation';
    explanationDiv.style.wordBreak = 'break-word';
    explanationDiv.style.whiteSpace = 'normal';
    explanationDiv.style.fontSize = '14px';
    explanationDiv.style.lineHeight = '1.9';
    return explanationDiv;
}

/**
 * 创建原文的div元素
 */
export function createOriginalDiv(selectedText: string): { originalDiv: HTMLDivElement; originalText: HTMLSpanElement } {
    const originalDiv = document.createElement('div');
    originalDiv.className = 'comfy-trans-original';
    originalDiv.style.display = 'flex';
    originalDiv.style.alignItems = 'center';
    originalDiv.style.fontSize = '14px';
    originalDiv.style.lineHeight = '1.9';

    const originalText = document.createElement('span');
    originalText.textContent = selectedText;
    originalText.style.fontWeight = 'bold';
    originalText.style.fontSize = '14px';
    originalText.style.lineHeight = '1.9';
    originalText.style.cursor = 'pointer';
    originalText.addEventListener('click', () => {
        speakText(selectedText);
    });

    originalDiv.appendChild(originalText);
    return { originalDiv, originalText };
}

/**
 * 创建播放按钮
 */
export function createPlayButton(selectedText: string): HTMLSpanElement {
    const playButton = document.createElement('span');
    playButton.style.display = 'flex';
    playButton.style.alignItems = 'center';
    playButton.style.padding = '5px';
    playButton.style.cursor = 'pointer';
    playButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" height="18" width="18" style="cursor: pointer;">
            <path clip-rule="evenodd" fill-rule="evenodd" d="M11.26 3.691A1.2 1.2 0 0 1 12 4.8v14.4a1.199 1.199 0 0 1-2.048.848L5.503 15.6H2.4a1.2 1.2 0 0 1-1.2-1.2V9.6a1.2 1.2 0 0 1 1.2-1.2h3.103l4.449-4.448a1.2 1.2 0 0 1 1.308-.26Z"></path>
        </svg>
    `;
    playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        speakText(selectedText);
    });
    return playButton;
}

/**
 * 处理翻译结果的更新
 */
export async function handleTranslationUpdate(
    translationDiv: HTMLDivElement,
    originalText: HTMLSpanElement,
    selectedText: string,
    translationPromise: Promise<string>
): Promise<void> {
    translationDiv.textContent = '正在翻译...';
    const translation = await translationPromise;
    translationDiv.textContent = translation;

    // 检查是否为日语文本
    if (isJapaneseText(selectedText)) {
        const textWithFurigana = await addRubyForJapanese(selectedText);
        originalText.innerHTML = textWithFurigana;
    }
}

/**
 * 处理解释内容的流式更新
 */
export async function handleExplanationStream(
    explanationDiv: HTMLDivElement,
    popup: HTMLElement,
    selectedText: string,
    translation: string
): Promise<void> {
    explanationDiv.innerHTML = '正在分析...';
    let explanation = '';
    let chunkCount = 0;

    await askAIStream(
        `「${selectedText}」这个单词/短语的含义是什么？简洁明了地分析它。如果这个词的词源可考的话也要说明出来。`,
        'gpt-4o',
        (chunk) => {
            if (explanationDiv && chunk) {
                if (explanationDiv.innerHTML === '正在分析...') {
                    explanationDiv.innerHTML = '';
                }
                explanationDiv.innerHTML += chunk;
                explanation += chunk;
                chunkCount++;
                if (chunkCount % 10 === 0 || explanation.length % 50 === 0) {
                    // 计算总字符数
                    const totalChars = selectedText.length + translation.length + explanation.length;

                    // 计算宽度
                    const width = calculateWidthFromCharCount(totalChars);

                    // 应用新宽度
                    popup.style.width = `${width}px`;
                    popup.style.maxWidth = `${width}px`;
                }
            }
        },
        (fullText) => {
            // 流式响应完成后的处理
        }
    );

    return;
}

/**
 * 处理纯文本的翻译，使用流式API
 * @param originalText 原始文本
 * @param tempContainer 临时容器，用于显示翻译结果
 */
export async function handlePlainTextTranslation(
    originalText: string,
    tempContainer: HTMLElement
): Promise<void> {
    // 创建翻译元素
    const translatedElement = document.createElement('div');

    // 添加唯一标识
    const uniqueId = generateUniqueId();
    translatedElement.id = uniqueId;
    translatedElement.setAttribute('data-trans-id', uniqueId);

    tempContainer.replaceWith(translatedElement);

    // 使用流式API获取翻译
    await askAIStream(
        `请将以下文本翻译成中文，只需要返回翻译结果：\n\n${originalText}`,
        'gpt-4o',
        (chunk) => {
            // 确保我们使用的是当前存在于DOM中的元素
            const currentElement = document.getElementById(uniqueId);
            console.log(uniqueId, "uniqueId");

            // 处理每个数据块
            if (currentElement && chunk) {
                currentElement.innerHTML += chunk;
            }
        },
        (fullText) => {
            // 翻译完成后的处理
            console.log('翻译完成:', fullText);
        }
    );
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

/**
 * 5. 创建并插入翻译后的节点
 * @param translatedHTML 翻译后的HTML
 * @param tempContainer 临时容器，将被替换
 */
export function replaceWithTranslatedNode(translatedHTML: string, tempContainer: HTMLDivElement): void {
    // 创建翻译后的元素
    const translatedElement = document.createElement('div');
    translatedElement.innerHTML = translatedHTML;

    // 获取翻译后的节点
    const translatedNode = translatedElement.firstChild as HTMLElement;

    if (translatedNode) {
        // 直接使用AI返回的结果，不添加额外的类名和样式
        // 替换临时容器
        tempContainer.replaceWith(translatedNode);
    } else {
        console.error('无法解析翻译后的HTML');
        tempContainer.innerHTML = '翻译失败，无法解析翻译后的HTML';
    }
}

// 为选中文本添加下划线并关联弹窗
export function addUnderlineWithPopup(paragraphNode: Element, selectedText: string, popupId: string): HTMLSpanElement | null {
    // 获取段落文本内容
    const paragraphText = paragraphNode.textContent || '';
    
    // 如果段落不包含选中文本，则返回
    if (!paragraphText.includes(selectedText)) {
        console.error('段落中未找到选中文本:', selectedText);
        return null;
    }
    
    // 创建带下划线的span
    const span = document.createElement('span');
    span.style.textDecoration = 'underline';
    span.style.cursor = 'pointer';
    span.style.position = 'relative';
    span.textContent = selectedText;
    
    // 设置popup id到dataset
    span.dataset.popup = popupId;
    
    // 添加鼠标悬停事件
    span.addEventListener('mouseenter', handlePopupDisplay);
    
    // 添加点击事件，防止点击下划线文本时关闭Popup
    span.addEventListener('click', handlePopupDisplay);
    
    // 使用TreeWalker遍历段落中的文本节点，查找选中文本
    const walker = document.createTreeWalker(
        paragraphNode,
        NodeFilter.SHOW_TEXT,
        null
    );
    
    let currentNode;
    let found = false;
    
    while (currentNode = walker.nextNode()) {
        const nodeText = currentNode.textContent || '';
        const index = nodeText.indexOf(selectedText);
        
        if (index !== -1) {
            // 找到了包含选中文本的节点
            const beforeText = nodeText.substring(0, index);
            const afterText = nodeText.substring(index + selectedText.length);
            
            // 替换原始文本节点
            const fragment = document.createDocumentFragment();
            fragment.appendChild(document.createTextNode(beforeText));
            fragment.appendChild(span);
            fragment.appendChild(document.createTextNode(afterText));
            
            if (currentNode.parentNode) {
                currentNode.parentNode.replaceChild(fragment, currentNode);
                found = true;
                break;
            }
        }
    }
    
    if (!found) {
        console.error('无法在DOM树中找到文本节点');
        return null;
    }
    
    return span;
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
            console.log('设置Popup为可见，当前状态:', popup.style.display, popup.style.opacity, popup.style.visibility);

            // 使用setTimeout确保DOM已更新
            setTimeout(() => {
                console.log('setTimeout回调执行，设置Popup位置');
                // 计算位置
                const rect = span.getBoundingClientRect();
                const popupRect = popup.getBoundingClientRect();
                console.log('span位置:', rect);
                console.log('Popup尺寸:', popupRect);

                // 使用存储的最终宽度，如果有的话
                if (popup.dataset.finalWidth) {
                    const finalWidth = parseInt(popup.dataset.finalWidth);
                    console.log('使用存储的最终宽度:', finalWidth);
                    popup.style.width = `${finalWidth}px`;
                    popup.style.maxWidth = `${finalWidth}px`;
                }

                // 将悬浮窗定位在单词的右下角
                let posX = rect.right;
                let posY = rect.bottom;
                console.log('初始计算位置(右下角):', posX, posY);

                // 检查是否会超出视窗右侧
                if (posX + popupRect.width > window.innerWidth + window.scrollX) {
                    // 如果超出右侧，则显示在左侧
                    posX = rect.left - popupRect.width;
                    console.log('调整水平位置，避免超出右侧:', posX);
                }

                // 检查是否会超出视窗底部
                if (posY + popupRect.height > window.innerHeight + window.scrollY) {
                    // 如果超出底部，则显示在上方
                    posY = rect.top - popupRect.height;
                    console.log('调整垂直位置，避免超出底部:', posY);
                }

                // 设置最终位置，使用absolute定位而不是fixed
                popup.style.position = 'absolute';
                popup.style.left = `${posX + window.scrollX}px`;
                popup.style.top = `${posY + window.scrollY}px`;
                console.log('设置Popup最终位置:', posX + window.scrollX, posY + window.scrollY, '当前状态:', popup.style.display, popup.style.opacity);
            }, 0);
        } else {
            console.error('未找到Popup元素，ID:', popupId);
        }
    } else {
        console.log('span没有关联的Popup ID');
    }
}

// 判断是否选中了整个段落
export function isEntireParagraphSelected(targetNode: Element, selectedText: string): boolean {
    // 获取节点的文本内容
    const nodeText = targetNode.textContent?.trim() || '';

    // 或者如果选中的文本长度大于等于段落文本长度的一半，也认为选中了整个段落
    return (selectedText.length >= nodeText.length / 2);
}

// 获取目标节点
export function getTargetNode(range: Range, selectedText: string): Element | null {
    let targetNode: Node | null = range.startContainer;

    // 如果选中文本长度大于当前节点文本长度,继续往上找父元素
    while (targetNode && selectedText.length > (targetNode.textContent?.length || 0)) {
        const parentElement = targetNode.parentElement as Element;
        if (!parentElement) break;
        targetNode = parentElement;
    }

    return targetNode as Element;
}

// 查找插入位置
export function findInsertPosition(startContainer: Node): Node {
    let insertAfterNode = startContainer;

    if (insertAfterNode.nodeType === Node.TEXT_NODE) {
        let nextSibling = insertAfterNode.nextSibling;
        while (nextSibling) {
            if (nextSibling.nodeName === 'BR') {
                insertAfterNode = nextSibling;
                break;
            }
            if (nextSibling.nodeType === Node.TEXT_NODE) {
                break;
            }
            nextSibling = nextSibling.nextSibling;
        }
    }

    return insertAfterNode;
}

// 插入翻译段落
export function insertTranslatedParagraph(translatedParagraph: HTMLParagraphElement, insertPosition: InsertPosition) {
    insertPosition.parentNode.insertBefore(translatedParagraph, insertPosition.nextSibling);
}

// 添加含义和音标到翻译中
export function appendLexicalUnit(translationParagraph: HTMLParagraphElement, selectedText: string, phoneticText: string, selectedTextID: string) {
    const playButtonID = `play-button-${Math.random().toString(36).substring(2, 15)}`;

    // 创建外层容器
    const selectedTextDiv = document.createElement('div');
    selectedTextDiv.className = 'selected-text';

    // 创建文本和音标容器
    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'display: flex; align-items: center; white-space: nowrap; font-weight: bold;';

    // 添加文本和音标
    const displayText = phoneticText ? `${selectedText}(${phoneticText})` : selectedText;
    textContainer.appendChild(document.createTextNode(displayText));

    // 添加间隔
    const spacer = document.createElement('span');
    spacer.style.width = '10px';
    textContainer.appendChild(spacer);

    // 创建播放按钮
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('height', '20');
    svg.setAttribute('width', '24');
    svg.id = playButtonID;
    svg.style.cursor = 'pointer';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('clip-rule', 'evenodd');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('d', 'M11.26 3.691A1.2 1.2 0 0 1 12 4.8v14.4a1.199 1.199 0 0 1-2.048.848L5.503 15.6H2.4a1.2 1.2 0 0 1-1.2-1.2V9.6a1.2 1.2 0 0 1 1.2-1.2h3.103l4.449-4.448a1.2 1.2 0 0 1 1.308-.26Zm6.328-.176a1.2 1.2 0 0 1 1.697 0A11.967 11.967 0 0 1 22.8 12a11.966 11.966 0 0 1-3.515 8.485 1.2 1.2 0 0 1-1.697-1.697A9.563 9.563 0 0 0 20.4 12a9.565 9.565 0 0 0-2.812-6.788 1.2 1.2 0 0 1 0-1.697Zm-3.394 3.393a1.2 1.2 0 0 1 1.698 0A7.178 7.178 0 0 1 18 12a7.18 7.18 0 0 1-2.108 5.092 1.2 1.2 0 1 1-1.698-1.698A4.782 4.782 0 0 0 15.6 12a4.78 4.78 0 0 0-1.406-3.394 1.2 1.2 0 0 1 0-1.698Z');

    svg.appendChild(path);
    textContainer.appendChild(svg);

    // 创建含义容器
    const meaningDiv = document.createElement('div');
    meaningDiv.className = 'selected-text-meaning';
    meaningDiv.id = selectedTextID;

    // 组装所有元素
    selectedTextDiv.appendChild(textContainer);
    selectedTextDiv.appendChild(meaningDiv);
    translationParagraph.appendChild(selectedTextDiv);

    // 添加点击事件监听器
    svg.addEventListener('click', () => {
        speakText(selectedText);
    });
}

// 为选中文本添加下划线
export function addUnderlineToSelection(range: Range): HTMLSpanElement {
    const textNode = range.startContainer as Text;
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    const beforeText = textNode.textContent?.substring(0, startOffset) || '';
    const selectedContent = textNode.textContent?.substring(startOffset, endOffset) || '';
    const afterText = textNode.textContent?.substring(endOffset) || '';

    const span = document.createElement('span');
    span.style.textDecoration = 'underline';
    span.style.cursor = 'pointer';
    span.textContent = selectedContent;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createTextNode(beforeText));
    fragment.appendChild(span);
    fragment.appendChild(document.createTextNode(afterText));

    if (textNode.parentNode) {
        textNode.parentNode.replaceChild(fragment, textNode);
    }

    return span;
}

/**
 * 1. 找到段落的插入位置
 * @param targetNode 目标节点
 * @returns 插入位置对象，如果找不到则返回null
 */
export function findParagraphInsertPosition(targetNode: Element): InsertPosition | null {
    const insertAfterNode = findInsertPosition(targetNode);

    if (!insertAfterNode || !insertAfterNode.parentNode) {
        return null;
    }

    return {
        parentNode: {
            insertBefore: (node: Node, reference: Node | null) =>
                insertAfterNode.parentNode!.insertBefore(node, reference)
        },
        nextSibling: insertAfterNode.nextSibling
    };
}

/**
 * 2. 创建临时容器
 * @returns 创建的临时容器元素
 */
export function createTempContainer(): HTMLDivElement {
    const tempContainer = document.createElement('div');
    tempContainer.className = 'comfy-trans-temp-container';
    tempContainer.innerHTML = '<div class="comfy-trans-loading">正在翻译...</div>';
    return tempContainer;
}

/**
 * 3. 插入临时容器到DOM
 * @param tempContainer 临时容器元素
 * @param insertPosition 插入位置
 */
export function insertTempContainer(tempContainer: HTMLDivElement, insertPosition: InsertPosition): void {
    insertTranslatedParagraph(tempContainer, insertPosition);
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
    }
}

// 获取包含选中文本的段落节点
export function getParagraphNode(selection: Selection): Element | null {
    if (!selection.rangeCount) return null;

    let node = selection.anchorNode;

    console.log('node:', node);
    console.log('node.parentNode:', node?.parentNode);

    // 确保 node 是一个元素，而不是文本节点
    while (node && node.nodeType !== 1) {
        node = node.parentNode;
    }

    return node as Element;
}