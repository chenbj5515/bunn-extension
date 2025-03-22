import { fetchApi } from "@/utils/api";
const API_BASE_URL = process.env.API_BASE_URL;

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
                    chrome.tabs.sendMessage(tabId, {
                        type: 'stream-end',
                    });
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
            // 尝试获取错误信息
            try {
                // 检查sender.tab是否存在
                if (!sender.tab || !sender.tab.id) {
                    console.error('发送错误消息失败: sender.tab 未定义');
                    eventSource.close();
                    return;
                }
                
                // 根据错误类型发送不同的消息
                if (error && typeof error === 'object' && 'data' in error) {
                    try {
                        const errorData = JSON.parse(String(error.data));
                        if (errorData.success === false) {
                            // 发送格式化的错误消息
                            chrome.tabs.sendMessage(sender.tab.id, {
                                type: 'stream-error',
                                error: errorData.error,
                                errorCode: errorData.errorCode,
                                success: false
                            });
                        }
                    } catch (parseError) {
                        // JSON解析失败，发送一般错误
                        chrome.tabs.sendMessage(sender.tab.id, {
                            type: 'stream-error',
                            error: '流式请求失败'
                        });
                    }
                } else {
                    // 一般错误情况
                    chrome.tabs.sendMessage(sender.tab.id, {
                        type: 'stream-error',
                        error: '流式请求失败'
                    });
                }
            } catch (sendError) {
                console.error('发送错误消息失败:', sendError);
            }
            
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
                // 检查是否为APIError类型
                if (error && typeof error === 'object' && 'success' in error && 'errorCode' in error && 'message' in error) {
                    // 保留APIError的结构直接传递
                    sendResponse({ 
                        error: String(error.message), 
                        errorCode: error.errorCode,
                        success: false
                    });
                } else {
                    // 普通错误
                    sendResponse({ error: error instanceof Error ? error.message : String(error) });
                }
            }
        })();

        return true; // 表示会异步发送响应
    }
});