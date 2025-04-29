import { showNotification } from '@/common/notify';
import { InsertPosition } from "@/common/types";
import { handlePopupDisplay } from './popup-helpers';

// 为选中文本添加下划线并关联弹窗
export function addUnderlineWithPopup(paragraphNode: Element, selectedText: string, popupId: string): HTMLSpanElement | null {
    // 获取段落文本内容
    const paragraphText = paragraphNode.textContent || '';

    // 如果段落不包含选中文本，则返回
    if (!paragraphText.includes(selectedText)) {
        console.error('段落中未找到选中文本:', selectedText);
        showNotification('无法在段落中找到选中文本', 'error', false, false);
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

    // 继承目标节点的部分样式属性
    const computedStyle = window.getComputedStyle(paragraphNode);
    span.style.fontFamily = computedStyle.fontFamily;
    span.style.fontSize = computedStyle.fontSize;
    span.style.fontWeight = computedStyle.fontWeight;
    span.style.color = computedStyle.color;

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
        showNotification('无法在DOM树中找到文本节点', 'error', false, false);
        return null;
    }

    return span;
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

/**
 * 1. 找到段落的插入位置
 * @param targetNode 目标节点
 * @returns 插入位置对象，如果找不到则返回null
 */
export function findParagraphInsertPosition(targetNode: Element): InsertPosition | { node: Element, position: string } | null {
    // 检查是否是Reddit网站且目标节点是h1标签
    const isReddit = window.location.hostname.includes('reddit.com');
    const isH1Tag = targetNode.tagName.toLowerCase() === 'h1';

    // 对于Reddit的h1标签，将插入位置设置为h1内部的尾部
    if (isReddit && isH1Tag) {
        return {
            node: targetNode,
            position: 'append' // 标记为append，表示要添加到内部尾部
        };
    }

    // 其他情况使用原来的逻辑
    const insertAfterNode = findInsertPosition(targetNode);

    if (!insertAfterNode || !insertAfterNode.parentNode) {
        showNotification('无法找到合适的插入位置', 'error', false, false);
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

// 判断是否选中了整个段落
export function isEntireParagraphSelected(targetNode: Element, selectedText: string): boolean {
    // 获取节点的文本内容
    const nodeText = targetNode.textContent?.trim() || '';

    // 或者如果选中的文本长度大于等于段落文本长度的一半，也认为选中了整个段落
    return (selectedText.length >= nodeText.length / 2);
}

/**
 * 根据鼠标位置获取最近的完整段落元素
 * @param selection 当前选区
 * @returns 段落DOM元素
 */
export function getParagraphNode(selection: Selection | null): Element | null {
    // 使用记录的鼠标位置
    let mouseX = (window as any).lastMouseX || 0;
    let mouseY = (window as any).lastMouseY || 0;

    // 使用有效坐标获取元素
    console.log(mouseX, mouseY, "mouseX, mouseY===========")
    // const elementAtPoint = document.elementFromPoint(mouseX, mouseY);
    const elementAtPoint = selection?.anchorNode as Element;
    console.log(elementAtPoint, "elementAtPoint===========")
    if (!elementAtPoint) return null;

    // 定义可能的段落标签
    const paragraphTags = ['P', 'DIV', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'ARTICLE', 'SECTION'];

    // 从当前元素开始向上遍历DOM树，查找合适的段落元素
    let currentElement: Element | null = elementAtPoint;
    let paragraphElement: Element | null = null;

    while (currentElement && currentElement !== document.body) {
        // 判断当前元素是否为段落元素
        if (paragraphTags.includes(currentElement.tagName)) {
            // 检查元素是否包含足够的文本内容
            const textContent = currentElement.textContent?.trim() || '';

            // 如果文本长度大于30个字符或者是特定的列表项/段落标签，则认为是有效的段落
            if (textContent.length > 30 ||
                ['P', 'LI', 'BLOCKQUOTE'].includes(currentElement.tagName) ||
                currentElement.classList.contains('paragraph') ||
                (currentElement.childNodes.length > 1 && textContent.length > 0)) {

                // 避免选择太大的容器如整个article或section
                const nextParent: Element | null = currentElement.parentElement;
                if (nextParent &&
                    ['ARTICLE', 'SECTION'].includes(currentElement.tagName) &&
                    nextParent.children.length <= 3) {
                    currentElement = nextParent;
                    continue;
                }

                paragraphElement = currentElement;
                break;
            }
        }

        // 继续向上查找
        currentElement = currentElement.parentElement;
    }

    // 如果没有找到合适的段落元素，则返回当前元素的父元素
    if (!paragraphElement && elementAtPoint) {
        paragraphElement = elementAtPoint.parentElement;
    }

    return paragraphElement;
} 