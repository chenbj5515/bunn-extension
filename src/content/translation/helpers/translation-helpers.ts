import { askAI, askAIStream } from "@/common/api";
import { showNotification } from "@/common/notify";
import { calculateWidthFromCharCount } from "./popup-helpers";
import { API_BASE_URL } from "@/utils/api";
import { isJapaneseText, addRubyForJapanese, generateUniqueId } from '@/common/utils';
import { isEntireParagraphSelected } from './dom-helpers';

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

    // 保留原始容器的class和data属性
    if (tempContainer.className) {
        translatedElement.className = tempContainer.className;
    }

    // 复制所有dataset属性
    for (const key in tempContainer.dataset) {
        if (Object.prototype.hasOwnProperty.call(tempContainer.dataset, key)) {
            translatedElement.dataset[key] = tempContainer.dataset[key] || '';
        }
    }

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
        },
        (error) => {
            // 错误处理
            // 检查是否是API错误
            if (error && typeof error === 'object' && 'errorCode' in error) {
                // 特定API错误处理，比如token限制
                showNotification(`翻译失败: ${error.message}`, 'error');
                
                // 如果是token限制，可以添加特别的提示
                if (error.errorCode === 3001) {
                    showNotification(`今日使用的token已达上限，<a href="${API_BASE_URL}/pricing" target="_blank" style="text-decoration:underline;color:inherit;">立即升级</a>`, 'warning');
                }
            } else {
                // 一般错误处理
                showNotification('翻译失败，请稍后重试', 'error');
            }
            
            // 移除翻译元素，因为翻译失败
            const currentElement = document.getElementById(uniqueId);
            if (currentElement) {
                currentElement.innerHTML = '';
            }
        }
    );
}

/**
 * 处理翻译结果的更新
 */
export async function handleTranslationUpdate(
    translationDiv: HTMLDivElement,
    originalText: HTMLSpanElement,
    selectedText: string,
    translation: string
): Promise<void> {
    translationDiv.textContent = '正在翻译...';
    // const translation = await translationPromise;
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
    fullParagraphText: string
): Promise<void> {
    explanationDiv.innerHTML = '正在分析...';
    let explanation = '';
    let chunkCount = 0;

    await askAIStream(
        `请严格按照以下格式回答，格式必须一致，不要添加任何多余内容：

        1. 「${fullParagraphText}」这个句子里「${selectedText}」是什么意思？用中文一句话简要说明。如果是一个术语的话，那么稍微补充下相关知识，要求简单易懂不要太长。

        2. 如果「${selectedText}」还有其他与该上下文不同的常见含义，请用一句话列出。不需要写"其他含义"这几个字，直接写内容。如果没有，请省略这一项，不要输出这个条目。

        3. 如果「${selectedText}」是日语外来词，请说明其来源；如果不是，请省略这一项，不要输出这个条目。

        输出时请只保留需要的条目，条目前务必不要带编号"1."、"2."、"3."，也不要添加其他说明或总结语句。输出时检查是否是用的中文，不是的话要用中文。
        `,
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
                    const totalChars = explanation.length;

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
        },
        (error) => {
            // 错误处理
            // 检查是否是API错误
            if (error && typeof error === 'object' && 'errorCode' in error) {
                // 特定API错误处理
                showNotification(`分析失败: ${error.message}`, 'error');
            } else {
                // 一般错误处理
                showNotification('分析失败，请稍后重试', 'error');
            }
            
            // 清空解释区域内容
            if (explanationDiv) {
                explanationDiv.innerHTML = '';
            }
        }
    );

    return;
}

// 判断是否应该按整段翻译的函数
export function shouldTranslateAsFullParagraph(selectedText: string, paragraphNode: Element, fullParagraphText: string): boolean {
    // 检查是否包含标点符号，如果包含则按整段处理
    const punctuationRegex = /[.,;!?，。；！？、：""''（）【】《》]/;
    if (punctuationRegex.test(selectedText)) {
        console.log('选中文本包含标点符号，按整段处理');
        return true;
    }

    if (!selectedText) return true;

    // 检查选中文本是否是段落的一部分
    if (fullParagraphText.includes(selectedText)) {
        // 是段落文本的一部分，判断是否选中整段
        return isEntireParagraphSelected(paragraphNode, selectedText);
    } else {
        // 选中文本不是段落的一部分，按整段处理
        console.log('选中文本不是段落的一部分，按整段处理');
        return true;
    }
}

/**
 * 修正用户选中的文本，确保它是一个完整的单词或短语
 * @param selectedText 用户选中的文本
 * @param fullParagraphText 完整段落文本
 * @returns 修正后的文本，如果修正失败则返回原始文本
 */
export async function correctSelectedText(selectedText: string, fullParagraphText: string): Promise<string> {
    try {
        const correctedText = await askAI(`在「${fullParagraphText}」这个句子中用户选中了「${selectedText}」，如果这是一个完整的单词或者短语那么直接返回即可。如果不是一个完整的短语，查看选中部分周围，把选中部分修正为完整的单词或短语并返回给我，注意只要保证完整即可不要找的太长，另外只返回这个完整的单词或短语，不要返回其他任何其他内容。`);

        // 如果AI返回了有效的修正文本，则使用修正后的文本
        if (correctedText && correctedText.trim()) {
            console.log(`AI修正文本: 原文"${selectedText}" -> 修正后"${correctedText}"`);
            return correctedText.trim();
        }
        
        // 如果没有有效的修正文本，则返回原始文本
        return selectedText;
    } catch (error: any) {
        console.error('AI修正文本失败:', error instanceof Error ? error.message : String(error));
        
        // 检查是否是API错误，特别是token限制
        if (error && typeof error === 'object' && 'errorCode' in error) {
            // 显示错误通知
            showNotification(`翻译失败: ${String(error.message || '未知错误')}`, 'error');
            
            // 如果是token限制，给出特定提示
            if (error.errorCode === 3001) {
                showNotification(`今日使用的token已达上限，<a href="${API_BASE_URL}/pricing" target="_blank" style="text-decoration:underline;color:inherit;">立即升级</a>`, 'warning');
            }
            throw error; // 重新抛出错误，让调用方决定如何处理
        }
        
        // 修正失败时返回原始选中文本
        return selectedText;
    }
} 