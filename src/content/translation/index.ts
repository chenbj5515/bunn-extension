import { generateText } from '@/common/api';
import { initializeStyles } from "./styles";
import {
    createTranslationDiv,
    createExplanationDiv,
    createOriginalDiv,
    createPlayButton,
    createTempContainer,
    insertTempContainer,
} from './helpers/ui-helpers';

import {
    handleTranslationUpdate,
    handleExplanationStream,
    handlePlainTextTranslation,
    shouldTranslateAsFullParagraph,
    correctSelectedText
} from './helpers/translation-helpers';

import {
    findParagraphInsertPosition,
    addUnderlineWithPopup,
    getParagraphNode
} from './helpers/dom-helpers';

import {
    showPopup
} from './helpers/popup-helpers';

import {
    removeYoutubeTranslateButton,
    copyToClipboard,
    handleHighlight
} from './helpers/utils';

import { getLocaleFromCookie } from '@/common/i18n';

// 根据locale获取翻译目标语言名称
function getTargetLanguageName(locale: string): string {
    const languageMap: Record<string, string> = {
        'zh': '中文',
        'zh-TW': '繁體中文',
        'en': 'English',
        'ja': '日本語',
        'ko': '한国语',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch'
    };

    return languageMap[locale] || 'English';
}

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

        // 添加鼠标移动事件监听器，实时跟踪鼠标位置
        document.addEventListener('mousemove', (e) => {
            // 将值也存储在window对象上，以便在helpers.ts中访问
            (window as any).lastMouseX = e.clientX;
            (window as any).lastMouseY = e.clientY;
        });

        // 监听键盘事件
        window.addEventListener('keydown', (e) => {
            console.log('检测到键盘事件:', e.key);

            // 用户选中文本后按下T键，会被识别为翻译事件。
            // 翻译事件分为两种处理：处理整段翻译和处理部分文本翻译
            if (e.key.toLowerCase() === 't') {
                handleTranslation(e);
            }

            // 用户选中文本后按下Ctrl键，会被识别为复制事件
            // 复制事件会调用copyToClipboard函数，不同于普通的COPY，这里会把JSON复制到剪贴板
            // JSON中不仅包括选中文本，并且还有URL参数和滚动位置信息，这些信息会用于恢复选中文本的位置
            if (e.key === 'Control') {
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
    const selection = window.getSelection();
    // 只有在有选中文本的情况下才执行
    if (selection && selection.toString().trim()) {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(selection.toString().trim());
    }
}

// 跟踪当前显示的悬浮窗
let currentVisiblePopup: HTMLElement | null = null;

// 处理选中文本事件
async function processSelection(selection: Selection | null) {

    let selectedText = selection?.toString()?.trim() || "";

    // 使用新的函数获取段落节点
    const paragraphNode = getParagraphNode(selection);

    if (!paragraphNode) {
        console.log('未找到选中文本所在的段落节点');
        return;
    }

    const fullParagraphText = paragraphNode.textContent || '';

    console.log('选中的文本:', selectedText);
    console.log('段落文本:', fullParagraphText);

    const shouldTranslateAsFullParagraphResult = await shouldTranslateAsFullParagraph(selectedText, paragraphNode, fullParagraphText);
    // 使用判定函数决定是整段翻译还是部分文本翻译
    if (shouldTranslateAsFullParagraphResult) {
        console.log('处理整段翻译', paragraphNode);
        await translateFullParagraph(paragraphNode, fullParagraphText);
    } else {
        console.log('处理部分文本翻译');
        const range = selection?.getRangeAt(0)!;
        await translatePartialText(selectedText, range, fullParagraphText, paragraphNode);
    }
}

// 处理整个段落的翻译
async function translateFullParagraph(targetNode: Element, originalText: string) {
    // 1. 找到插入位置
    const insertPosition = findParagraphInsertPosition(targetNode);

    if (!insertPosition) {
        console.error('无法找到有效的插入位置');
        return;
    }

    // 2. 创建临时容器
    const tempContainer = createTempContainer(targetNode);

    // 3. 插入临时容器
    insertTempContainer(tempContainer, insertPosition);

    try {
        // 4. 发送原始文本到AI并处理结果
        await handlePlainTextTranslation(originalText, tempContainer);
    } catch (error) {
        console.error('翻译过程中出错:', error);
        
        // 获取用户当前语言设置
        const locale = await getLocaleFromCookie();
        const errorText = locale.startsWith('zh') ? 
            '翻译失败，请查看控制台获取详细错误信息' : 
            'Translation failed. Please check the console for detailed error information.';
            
        tempContainer.innerHTML = errorText;
    }
}

// 处理部分文本的翻译
async function translatePartialText(selectedText: string, range: Range, fullParagraphText: string, paragraphNode: Element) {
    // 使用AI修正选中内容，确保是完整的短语
    try {
        selectedText = await correctSelectedText(selectedText, fullParagraphText);
    } catch (error) {
        // 如果correctSelectedText抛出错误，则可能是token限制等严重错误，直接返回
        return;
    }

    // 获取选中文本的位置
    const rect = range.getBoundingClientRect();
    // 在选中文本右侧偏下一点显示
    const x = rect.right + 5; // 右侧偏移5px
    const y = rect.top + rect.height / 2;

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
        // 获取用户当前语言设置
        const locale = await getLocaleFromCookie();
        const targetLanguage = getTargetLanguageName(locale);
        
        const translationPromise = generateText(`「${fullParagraphText}」这个句子中的「${selectedText}」翻译成${targetLanguage}。要求你只输出「${selectedText}」对应的${targetLanguage}翻译结果就好，不要输出任何其他内容。`);
        const translation = await translationPromise;
        handleTranslationUpdate(translationDiv, originalText, selectedText, translation);

        // 7. 获取解释并流式更新
        handleExplanationStream(explanationDiv, popup, selectedText, fullParagraphText);

        // 8. 为选中文本添加下划线并创建带有悬浮提示的span
        const underlineSpan = addUnderlineWithPopup(paragraphNode, selectedText, popupId);
        if (!underlineSpan) {
            console.warn('无法为选中文本添加下划线，可能是文本在DOM中未找到');
        }
    } catch (error: any) {
        console.error('翻译过程中出错1:', error instanceof Error ? error.message : error);
        // alert('翻译失败，请查看控制台获取详细错误信息');
    }
}
