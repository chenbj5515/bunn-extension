import { handleExtractSubtitles } from "./handle-extract-subtitles";
import { handleGenerateText } from "./handle-generate-text";
import { handleGenerateTextStream } from "./handle-generate-text-stream";

// 获取当前语言环境 - 直接从 cookie 读取，而不是调用 i18n.ts 中的函数
async function getLocale(): Promise<string> {
    return new Promise((resolve) => {
        chrome.cookies.get({
            // url: 'http://localhost:3000',
            url: 'https://www.bunn.ink',
            name: 'NEXT_LOCALE'
        }, (cookie) => {
            if (cookie) {
                resolve(cookie.value);
            } else {
                resolve('en'); // 默认英语
            }
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 处理获取 locale cookie 的请求
    if (message.action === 'GET_LOCALE_COOKIE') {
        chrome.cookies.get({
            // url: 'http://localhost:3000', 
            url: 'https://www.bunn.ink',
            name: 'NEXT_LOCALE'
        }, (cookie) => {
            if (cookie) {
                sendResponse({ locale: cookie.value });
            } else {
                sendResponse({ locale: 'en' }); // 默认英语
            }
        });
        return true; // 保持消息通道开放，等待异步响应
    }
    
    // 处理设置 locale cookie 的请求
    if (message.action === 'SET_LOCALE_COOKIE') {
        chrome.cookies.set({
            // url: 'http://localhost:3000',
            url: 'https://www.bunn.ink',
            name: 'NEXT_LOCALE',
            value: message.locale,
            path: '/'
        }, (cookie) => {
            sendResponse({ success: !!cookie });
        });
        return true; // 保持消息通道开放，等待异步响应
    }

    if (message.type === "EXTRACT_SUBTITLES") {
        handleExtractSubtitles(message.data.imageData, sender, sendResponse);
        return true; // 添加返回 true，表示会异步发送响应
    }
    if (message.type === "START_AI_STREAM") {
        // 不再使用导入的 getLocaleFromCookie，改用本地的 getLocale 函数
        getLocale().then(locale => {
            handleGenerateTextStream(message, sender, sendResponse);
            sendResponse({ status: "开始处理" });
        });
        return true; // 表示异步响应
    }
    if (message.type === "GENERATE_TEXT") {
        handleGenerateText(message, sender, sendResponse);
        return true; // 表示会异步发送响应
    }
});