import { askAI } from '@/common/api';
import { initializeStyles } from "./styles";
import {
    getTranslatedHTML,
    createTranslationDiv,
    createExplanationDiv,
    createOriginalDiv,
    createPlayButton,
    handleTranslationUpdate,
    handleExplanationStream,
    handlePlainTextTranslation,
    getTargetNode,
    findParagraphInsertPosition,
    createTempContainer,
    insertTempContainer,
    replaceWithTranslatedNode,
    addUnderlineWithPopup,
    isEntireParagraphSelected,
    showPopup,
    removeYoutubeTranslateButton
} from './helpers';

// 业务流程：翻译
// 1 用户选中不理解的文本
// 2 用户按下t键，触发handleTranslation函数
// 3 通过isEntireParagraphSelected识别选中的是段落还是一个单词/短语
// 4-1 如果是段落，那么在段落下面展示一个样式和原来的段落一样的翻译后的段落
// 4-2-1 如果是单词/短语，在选中单词/短语旁边用showPopup创建一个弹窗，并且会在里面展示翻译，音标和解析。
// 4-2-2 addUnderlineWithPopup中会给翻译过的单词/短语增加样式和事件，并且绑定对应的悬浮窗。鼠标进入单词/短语所在的元素后，handlePopupDisplay中会展示之前生成的悬浮窗。

// 业务流程：回顾句子的上下文
// 1 用户选中不理解的文本
// 2 用户双击c键，触发copyToClipboard。
// 3 复制的文本和带有滚动位置信息的url的JSON会被复制到剪切板
// 4 用户把剪切板内容复制到Bunn应用
// 5 用户复习的时候，想要查看句子的上下文，点击查看按钮，打开步骤3中的url
// 6 插件识别到URL中的特殊参数scrollY和text，在highlightRestoredText中进行处理，先滚动到scrollY的位置，然后高亮text对应的元素。

// 初始化函数
export async function initializeTranslation() {
    try {
        initializeStyles();

        // 如果用于点击我的应用的上文链接进入网页，那么用户是希望查看自己之前复制的文本在哪里
        // 这里插件会根据URL参数，自动滚动到用户之前复制的文本的位置，并且高亮显示，帮助用户重温句子的上下文
        await handleHighlight();

        // 移除youtube评论区多余的翻译成中文的按钮，避免干扰翻译评论
        removeYoutubeTranslateButton()

        // 监听键盘事件
        window.addEventListener('keydown', (e) => {
            console.log('检测到键盘事件:', e.key);

            // 用户选中文本后按下T键，会被识别为翻译事件。
            // 翻译事件分为两种处理：处理整段翻译和处理部分文本翻译
            if (e.key.toLowerCase() === 't') {
                handleTranslation(e);
            }

            // 用户选中文本后连续按下C键，会被识别为复制事件。
            // 复制事件会调用copyToClipboard函数，不同于普通的COPY，这里会把JSON复制到剪贴板
            // JSON中不仅包括选中文本，并且还有URL参数和滚动位置信息，这些信息会用于恢复选中文本的位置
            if (e.key.toLowerCase() === 'c') {
                handleCopy(e);
            }
        }, true);

    } catch (error) {
        console.error('初始化插件时出错:', error);
    }
}

function handleTranslation(e: KeyboardEvent) {
    console.log('检测到按键T');
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) {
        console.log('没有选中文本');
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    processSelection(selection);
}

function handleCopy(e: KeyboardEvent) {
    const currentTime = Date.now();
    if (currentTime - lastCKeyPressTime <= 500) { // 500ms内连续按两次
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            e.preventDefault();
            e.stopPropagation();
            copyToClipboard(selection.toString().trim());
        }
    }
    lastCKeyPressTime = currentTime;
}

// 跟踪当前显示的悬浮窗
let currentVisiblePopup: HTMLElement | null = null;

// 跟踪上一次按C键的时间
let lastCKeyPressTime = 0;

// 将选中文本复制到剪贴板
async function copyToClipboard(text: string) {
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
    } catch (err) {
        console.error('复制到剪贴板失败:', err);
    }
}

// 从URL恢复文本并高亮显示
async function highlightRestoredText(decodedText: string) {
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
async function handleHighlight() {
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

// 处理选中文本事件
async function processSelection(selection: Selection) {
    if (!selection.rangeCount) {
        console.log('没有选中范围，退出');
        return;
    }

    const selectedText = selection.toString().trim();

    const range = selection.getRangeAt(0);

    const targetNode = getTargetNode(range, selectedText);

    if (!targetNode) {
        console.log('未找到选中文本所在元素');
        return;
    }

    const fullParagraphText = targetNode.textContent || '';

    // 判断是否选中了整个段落
    const isFullParagraph = isEntireParagraphSelected(targetNode, selectedText);

    if (isFullParagraph) {
        console.log('处理整段翻译');
        // 处理整个段落的翻译
        await translateFullParagraph(targetNode);
    } else {
        console.log('处理部分文本翻译');
        // 处理部分文本的翻译
        await translatePartialText(selectedText, range, fullParagraphText);
    }
}

// 处理整个段落的翻译
async function translateFullParagraph(targetNode: Element) {
    // 1. 找到插入位置
    const insertPosition = findParagraphInsertPosition(targetNode);
    if (!insertPosition) {
        console.error('无法找到有效的插入位置');
        return;
    }

    // 2. 创建临时容器
    const originalHTML = targetNode.outerHTML;
    const tempContainer = createTempContainer();

    // 3. 插入临时容器
    insertTempContainer(tempContainer, insertPosition);

    try {
        // 4. 发送原始HTML到AI并处理结果
        // 判断是否为HTML标签字符串
        const isHTMLString = /<[a-z][\s\S]*>/i.test(originalHTML);

        if (isHTMLString) {
            // 原流程：处理HTML
            const translatedHTML = await getTranslatedHTML(originalHTML);
            // 5. 创建并插入翻译后的节点
            replaceWithTranslatedNode(translatedHTML, tempContainer);
        } else {
            // 新流程：直接翻译文本
            const originalText = targetNode.textContent || '';
            await handlePlainTextTranslation(originalText, tempContainer);
        }
    } catch (error) {
        console.error('翻译过程中出错:', error);
        tempContainer.innerHTML = '翻译失败，请查看控制台获取详细错误信息';
    }
}

// 处理部分文本的翻译
async function translatePartialText(selectedText: string, range: Range, fullParagraphText: string) {
    // 获取选中文本的位置
    const rect = range.getBoundingClientRect();
    // 在选中文本右侧偏下一点显示
    const x = rect.right + 5; // 右侧偏移5px
    const y = rect.top + rect.height / 2; // 垂直居中偏下

    try {
        const popupId = `comfy-trans-popup-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 1. 创建悬浮窗popup，并且更新当前显示的弹窗为popup
        const popup = showPopup(selectedText, x, y, popupId);
        currentVisiblePopup = popup;
        const content = popup.querySelector('.comfy-trans-content') as HTMLElement;
        content.innerHTML = '';

        // 2. 创建翻译的div并插入
        const translationDiv = createTranslationDiv();
        content.appendChild(translationDiv);

        // 3. 创建解释的div并插入
        const explanationDiv = createExplanationDiv();
        content.appendChild(explanationDiv);

        // 4. 创建原文的div并插入
        const { originalDiv, originalText } = createOriginalDiv(selectedText);
        content.insertBefore(originalDiv, content.firstChild);

        // 5. 创建播放按钮并插入到原文div中
        const playButton = createPlayButton(selectedText);
        originalDiv.appendChild(playButton);

        // 6. 发起翻译请求并处理结果
        const translationPromise = askAI(`「${fullParagraphText}」这个句子中的「${selectedText}」翻译成中文。要求你只输出「${selectedText}」对应的中文翻译结果就好，不要输出任何其他内容。`);
        handleTranslationUpdate(translationDiv, originalText, selectedText, translationPromise);

        // 7. 获取解释并流式更新
        handleExplanationStream(explanationDiv, popup, selectedText, await translationPromise);

        // 8. 为选中文本添加下划线并创建带有悬浮提示的span
        addUnderlineWithPopup(range, selectedText, popupId);
    } catch (error) {
        console.error('翻译过程中出错:', error);
        alert('翻译失败，请查看控制台获取详细错误信息');
    }
}
