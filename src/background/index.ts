import { fetchApi } from "@/utils/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "EXTRACT_SUBTITLES") {
        // 发起请求
        (async () => {
            try {
                const uint8Array = new Uint8Array(message.data.imageData);
                const blob = new Blob([uint8Array], { type: 'image/png' });
                const formData = new FormData();
                formData.append('image', blob, 'image.png');

                const data = await fetchApi('/api/openai/extract-subtitles', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });

                if (data.success) {
                    console.log("提取到的字幕:", data.subtitles);
                    sendResponse({ result: data.subtitles });
                } else {
                    console.error("接口调用失败:", data.error);
                    sendResponse({ error: data.error });
                }
            } catch (error) {
                console.error("请求出现异常:", error);
                sendResponse({ error: error instanceof Error ? error.message : String(error) });
            }
        })();

        return true; // 表示会异步发送响应
    }
    if (message.type === "START_AI_STREAM") {
        // 发起API请求并处理流式响应
        const tabId = sender.tab?.id ?? -1;
        if (tabId === -1) {
            sendResponse({ error: "无法确定发送请求的标签页" });
            return true;
        }
        const params = new URLSearchParams({
            prompt: message.payload.prompt,
            model: message.payload.model
        });

        const eventSource = new EventSource(`${API_BASE_URL}/api/openai/stream?${params}`);

        let fullText = '';

        eventSource.onmessage = (event) => {
            try {
                if (event.data === '[DONE]') {
                    eventSource.close();
                    return;
                }

                const data = JSON.parse(event.data);
                if (data.delta) {
                    fullText += data.delta;
                    chrome.tabs.sendMessage(tabId, {
                        type: 'stream-chunk',
                        text: data.delta
                    });
                }
            } catch (error) {
                console.error('解析消息失败:', error);
            }
        };

        // 处理错误
        eventSource.onerror = (error) => {
            eventSource.close();
        };

        // 可以用sendResponse告知已开始处理
        sendResponse({ status: "开始处理" });
        return true; // 表示异步响应
    }
    if (message.type === "CALL_AI_API") {
        // 发起API请求并处理响应
        (async () => {
            try {
                // 准备请求参数
                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: message.payload.prompt,
                        model: message.payload.model
                    })
                };

                // 发起请求到自定义API
                const data = await fetchApi('/api/openai/completion', requestOptions);

                sendResponse({ result: data });

            } catch (error) {
                console.error("调用AI API失败:", error);
                sendResponse({ error: error instanceof Error ? error.message : String(error) });
            }
        })();

        return true; // 表示会异步发送响应
    }
});