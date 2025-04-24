import { generateText, generateTextStream } from "@/common/api";
import { showNotification, showNotificationWithAction } from "@/common/notify";
import { calculateWidthFromCharCount } from "./popup-helpers";
import { isJapaneseText, addRubyForJapanese, generateUniqueId } from '@/common/utils';
import { isEntireParagraphSelected } from './dom-helpers';
import { getLocaleFromCookie, getTranslation } from '@/common/i18n';

// 添加获取baseUrl的函数
function getBaseUrl(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'http://localhost:3000' : 'https://www.bunn.ink';
}

// 根据locale获取翻译目标语言名称
function getTargetLanguageName(locale: string): string {
    const languageMap: Record<string, string> = {
        'zh': '中文',
        'zh-TW': '繁體中文',
        'en': 'English',
        'ja': '日本語',
        'ko': '한국어',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch'
    };

    return languageMap[locale] || 'English';
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
    // 添加唯一标识
    const uniqueId = generateUniqueId();
    tempContainer.id = uniqueId;
    tempContainer.setAttribute('data-trans-id', uniqueId);

    // 清空临时容器的内容，准备接收翻译结果
    tempContainer.innerHTML = '';

    // 获取用户当前语言设置
    const locale = await getLocaleFromCookie();
    const targetLanguage = getTargetLanguageName(locale);

    // 使用流式API获取翻译
    await generateTextStream(
        `请将以下文本翻译成${targetLanguage}，要保留换行符号，只需要返回翻译结果和换行符号，其他多余的一切不需要返回：\n\n${originalText}`,
        'gpt-4o-mini',
        (chunk) => {
            // 确保我们使用的是当前存在于DOM中的元素
            const currentElement = document.getElementById(uniqueId);

            // 处理每个数据块
            if (currentElement && chunk) {
                // 处理换行符，将其转换为<br>标签
                const formattedChunk = chunk.replace(/\n/g, '<br>');
                currentElement.innerHTML += formattedChunk;
            }
        },
        (fullText) => {
            // 翻译完成后的处理
            console.log('翻译完成:', fullText);
        },
        (error) => {
            // 错误处理            
            console.log('翻译错误:', error);
            
            // 获取升级URL
            const upgradeUrl = `${getBaseUrl()}/pricing`;
            
            // 简化错误检测逻辑
            // 检查错误信息是否包含token限制关键词或错误码
            if (
                // 检查是否是403状态码（通过安全的类型检查）
                (error && typeof error === 'object' && 'status' in error && error.status === 403) ||
                // 检查是否有3001错误码(自定义错误)
                (error && typeof error === 'object' && 'errorCode' in error && error.errorCode === 3001) ||
                // 检查错误消息中是否包含token相关词
                (error && error.message && (
                    error.message.toLowerCase().includes('token') ||
                    error.message.toLowerCase().includes('limit') ||
                    error.message.toLowerCase().includes('quota')
                ))
            ) {
                showNotificationWithAction('token.limit.reached', 'warning', 'upgrade.button', upgradeUrl, true);
            } else {
                // 其他错误
                showNotification('translation.failed', 'error', true, error?.message || '');
            }

            // 翻译失败时清空内容
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
    // 获取国际化的"正在翻译..."文本
    translationDiv.textContent = await getTranslation('translating.text', undefined);
    
    // 更新翻译结果
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
    // 获取用户当前语言设置
    const locale = await getLocaleFromCookie();
    const targetLanguage = getTargetLanguageName(locale);
    
    // 使用国际化的"正在分析..."文本
    const analyzingText = await getTranslation('analyzing.text', undefined);
    
    explanationDiv.innerHTML = analyzingText;
    let explanation = '';
    let chunkCount = 0;

    await generateTextStream(
        `请严格按照以下格式回答，格式必须一致，不要添加任何多余内容：

        1. 「${fullParagraphText}」这个句子里「${selectedText}」是什么意思？用${targetLanguage}一句话简要说明。如果是一个术语的话，那么稍微补充下相关知识，要求简单易懂不要太长。

        2. 如果「${selectedText}」还有其他与该上下文不同的常见含义，请用一句话列出。不需要写"其他含义"这几个字，直接写内容。如果没有，请省略这一项，不要输出这个条目。

        3. 如果「${selectedText}」是日语外来词，请说明其来源；如果不是，请省略这一项，不要输出这个条目。

        输出时请只保留需要的条目，条目前务必不要带编号"1."、"2."、"3."，也不要添加其他说明或总结语句。输出时检查是否是用的${targetLanguage}，不是的话要用${targetLanguage}。
        `,
        'gpt-4o',
        (chunk) => {
            if (explanationDiv && chunk) {
                if (explanationDiv.innerHTML === analyzingText) {
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
            console.log('解析错误:', error);
            
            // 获取升级URL
            const upgradeUrl = `${getBaseUrl()}/pricing`;
            
            // 简化错误检测逻辑
            // 检查错误信息是否包含token限制关键词或错误码
            if (
                // 检查是否是403状态码（通过安全的类型检查）
                (error && typeof error === 'object' && 'status' in error && error.status === 403) ||
                // 检查是否有3001错误码(自定义错误)
                (error && typeof error === 'object' && 'errorCode' in error && error.errorCode === 3001) ||
                // 检查错误消息中是否包含token相关词
                (error && error.message && (
                    error.message.toLowerCase().includes('token') ||
                    error.message.toLowerCase().includes('limit') ||
                    error.message.toLowerCase().includes('quota')
                ))
            ) {
                showNotificationWithAction('token.limit.reached', 'warning', 'upgrade.button', upgradeUrl, true);
            } else {
                // 其他错误
                showNotification('analysis.failed', 'error', true, error?.message || '');
            }

            // 清空解释区域内容
            if (explanationDiv) {
                explanationDiv.innerHTML = '';
            }
        }
    );

    return;
}

function findNextCharIsNewline(str: string, sub: string) {
    // 找到子串第一次出现的位置
    const index = str.indexOf(sub);
    if (index === -1) return false; // 如果没找到子串，直接返回 false

    // 子串结束位置后面的第一个字符
    const nextChar = str.charAt(index + sub.length);

    // 判断是否是换行符（常见情况：\n 或 \r\n）
    // 如果要更完整，可以先检查 \r，再检查紧跟的 \n
    return nextChar === '\n' || nextChar === '\r';
}

// 判断是否应该按整段翻译的函数
export async function shouldTranslateAsFullParagraph(selectedText: string, paragraphNode: Element, fullParagraphText: string) {
    // 检查是否包含标点符号，如果包含则按整段处理
    const punctuationRegex = /[.,;!?，。；！？、：""''（）【】《》]/;
    if (punctuationRegex.test(selectedText)) {
        console.log('选中文本包含标点符号，按整段处理');
        return true;
    }

    if (!selectedText) return true;

    if (!fullParagraphText.includes(selectedText)) return true;
    // 检查选中文本是否是段落的一部分
    if (isEntireParagraphSelected(paragraphNode, selectedText)) return true;

    if (findNextCharIsNewline(fullParagraphText, selectedText)) return true;

    try {
        // 获取用户当前语言设置
        const locale = await getLocaleFromCookie();
        const promptLanguage = locale.startsWith('zh') ? '如果你觉得它是单词或短语回答字符串"no"，如果你觉得它是句子中的段落，返回字符串"yes"' : 
                              'If you think it is a word or phrase, answer with "no". If you think it is a paragraph in the sentence, answer with "yes"';

        const result = await generateText(`
            在「${fullParagraphText}」这个句子中用户选中了「${selectedText}」，${promptLanguage}。
        `);

        console.log(result, "result");
        return result === "yes";
    } catch (error: any) {
        console.error('判断是否整段翻译失败:', error);
        
        // 获取升级URL
        const upgradeUrl = `${getBaseUrl()}/pricing`;
        
        // 简化错误检测逻辑
        // 检查错误信息是否包含token限制关键词或错误码
        if (
            // 检查是否是403状态码（通过安全的类型检查）
            (error && typeof error === 'object' && 'status' in error && error.status === 403) ||
            // 检查是否有3001错误码(自定义错误)
            (error && typeof error === 'object' && 'errorCode' in error && error.errorCode === 3001) ||
            // 检查错误消息中是否包含token相关词
            (error && error.message && (
                error.message.toLowerCase().includes('token') ||
                error.message.toLowerCase().includes('limit') ||
                error.message.toLowerCase().includes('quota')
            ))
        ) {
            showNotificationWithAction('token.limit.reached', 'warning', 'upgrade.button', upgradeUrl, true);
        } else {
            // 其他错误 - 需要重新获取locale
            showNotification('analysis.failed', 'error', true, error?.message || '');
        }
        
        // 出错时默认按单词处理
        return false;
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
        // 获取用户当前语言设置
        const locale = await getLocaleFromCookie();
        const promptLanguage = locale.startsWith('zh') ? 
            '如果这是一个完整的单词或者短语那么直接返回即可。如果不是一个完整的短语，查看选中部分周围，把选中部分修正为完整的单词或短语并返回给我，注意只要保证完整即可不要找的太长，另外只返回这个完整的单词或短语，不要返回其他任何其他内容。' : 
            'If this is a complete word or phrase, return it directly. If it is not a complete phrase, look at the surrounding text and correct it to a complete word or phrase. Make sure it is complete but not too long. Return only the corrected word or phrase without any additional content.';

        const correctedText = await generateText(`
            在「${fullParagraphText}」这个句子中用户选中了「${selectedText}」，${promptLanguage}
        `);

        // 如果AI返回了有效的修正文本，则使用修正后的文本
        if (correctedText && correctedText.trim()) {
            console.log(`AI修正文本: 原文"${selectedText}" -> 修正后"${correctedText}"`);
            return correctedText.trim();
        }

        // 如果没有有效的修正文本，则返回原始文本
        return selectedText;
    } catch (error: any) {
        console.error('AI修正文本失败:', error);

        // 获取升级URL
        const upgradeUrl = `${getBaseUrl()}/pricing`;
        
        // 简化错误检测逻辑
        // 检查错误信息是否包含token限制关键词或错误码
        if (
            // 检查是否是403状态码（通过安全的类型检查）
            (error && typeof error === 'object' && 'status' in error && error.status === 403) ||
            // 检查是否有3001错误码(自定义错误)
            (error && typeof error === 'object' && 'errorCode' in error && error.errorCode === 3001) ||
            // 检查错误消息中是否包含token相关词
            (error && error.message && (
                error.message.toLowerCase().includes('token') ||
                error.message.toLowerCase().includes('limit') ||
                error.message.toLowerCase().includes('quota')
            ))
        ) {
            showNotificationWithAction('token.limit.reached', 'warning', 'upgrade.button', upgradeUrl, true);
        } else {
            // 其他错误 - 需要重新获取locale
            showNotification('translation.failed', 'error', true, error?.message || '');
        }
        
        // 在显示通知之后，返回原始选中文本
        return selectedText;
    }
} 