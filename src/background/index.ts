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

        // 创建 AbortController 实例用于取消请求
        const controller = new AbortController();
        let fullText = '';

        // 使用原生fetch处理流式响应
        (async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/openai/stream`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: message.payload.prompt,
                        model: message.payload.model
                    }),
                    signal: controller.signal
                });

                // 处理非200状态码的错误
                if (!response.ok) {
                    const errorData = await response.json();
                    console.log('错误数据:', errorData);
                    chrome.tabs.sendMessage(tabId, {
                        type: 'stream-error',
                        error: errorData.error || '请求失败',
                        errorCode: errorData.errorCode,
                        success: false
                    });
                    return;
                }

                // 确保响应是可读流
                if (!response.body) {
                    throw new Error('响应体不可读');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                // 读取流数据
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        chrome.tabs.sendMessage(tabId, {
                            type: 'stream-end',
                        });
                        break;
                    }

                    // 解码接收到的数据
                    const chunk = decoder.decode(value, { stream: true });
                    
                    // 处理数据块
                    const lines = chunk.split('\n\n').filter(line => line.trim().startsWith('data: '));
                    
                    for (const line of lines) {
                        const data = line.replace('data: ', '');
                        
                        if (data === '[DONE]') {
                            chrome.tabs.sendMessage(tabId, {
                                type: 'stream-end',
                            });
                            controller.abort();
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.delta) {
                                fullText += parsed.delta;
                                chrome.tabs.sendMessage(tabId, {
                                    type: 'stream-chunk',
                                    text: parsed.delta
                                });
                            }
                        } catch (error) {
                            console.error('解析消息失败:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('流请求错误:', error);
                chrome.tabs.sendMessage(tabId, {
                    type: 'stream-error',
                    error: error instanceof Error ? error.message : '流式请求失败'
                });
            }
        })();

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