import { handleExtractSubtitles } from "./handle-extract-subtitles";
import { handleGenerateText } from "./handle-generate-text";
import { handleGenerateTextStream } from "./handle-generate-text-stream";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "EXTRACT_SUBTITLES") {
        handleExtractSubtitles(message.data.imageData, sender, sendResponse);
        return true; // 添加返回 true，表示会异步发送响应
    }
    if (message.type === "START_AI_STREAM") {
        handleGenerateTextStream(message, sender, sendResponse)
        sendResponse({ status: "开始处理" });
        return true; // 表示异步响应
    }
    if (message.type === "GENERATE_TEXT") {
        handleGenerateText(message, sender, sendResponse)
        return true; // 表示会异步发送响应
    }
});