import { speakText } from '@/common/tts';
import { InsertPosition } from "@/common/types";
import { showNotification } from '@/common/notify';

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
 * 2. 创建临时容器
 * @param targetNode 目标节点，用于获取class和id属性
 * @param paragraphNode 原始段落节点，用于获取文字颜色
 * @returns 创建的临时容器元素
 */
export function createTempContainer(targetNode?: Element): HTMLDivElement {
    const tempContainer = document.createElement('div');
    tempContainer.className = 'comfy-trans-temp-container';
    tempContainer.innerHTML = '<div class="comfy-trans-loading">正在翻译...</div>';

    // 如果提供了目标节点，复制其class和id属性
    if (targetNode) {
        // 获取目标节点的class并追加
        if (targetNode.className) {
            tempContainer.className += ' ' + targetNode.className;
        }

        // 获取目标节点的id并设置到dataset中，避免id冲突
        if (targetNode.id) {
            tempContainer.dataset.originalNodeId = targetNode.id;
        }
    }

    // 获取并应用段落节点的文字颜色
    if (targetNode) {
        const computedStyle = window.getComputedStyle(targetNode);
        const textColor = computedStyle.color;
        const fontSize = computedStyle.fontSize;
        
        if (textColor) {
            console.log(textColor, "textColor");
            tempContainer.style.color = textColor;
        }
        
        if (fontSize) {
            console.log(fontSize, "fontSize");
            // 确保字体大小不小于14px
            const size = parseInt(fontSize);
            tempContainer.style.fontSize = `${Math.max(14, size)}px`;
        }
    }

    return tempContainer;
}

/**
 * 3. 插入临时容器到DOM
 * @param tempContainer 临时容器元素
 * @param insertPosition 插入位置
 */
export function insertTempContainer(tempContainer: HTMLDivElement, insertPosition: InsertPosition | { node: Element, position: string }): void {
    insertTranslatedParagraph(tempContainer, insertPosition);
}

// 插入翻译段落
export function insertTranslatedParagraph(translatedParagraph: HTMLParagraphElement, insertPosition: InsertPosition | { node: Element, position: string }) {
    // 处理特殊的"append"位置，表示添加到元素内部尾部
    if ('position' in insertPosition && insertPosition.position === 'append') {
        // 将翻译添加到元素的内部尾部
        insertPosition.node.appendChild(translatedParagraph);
    } else {
        // 使用原来的插入逻辑
        (insertPosition as InsertPosition).parentNode.insertBefore(translatedParagraph, (insertPosition as InsertPosition).nextSibling);
    }
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