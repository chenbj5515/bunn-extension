import { fetchApi } from "@/utils/api";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("message:", message)
    if (message.type === "EXTRACT_SUBTITLES") {
        // 发起请求
        (async () => {
            try {
                console.log('message.data.imageData:', message.data.imageData);
                const uint8Array = new Uint8Array(message.data.imageData);
                const blob = new Blob([uint8Array], { type: 'image/png' });
                const formData = new FormData();
                formData.append('image', blob, 'image.png');

                const data = await fetchApi('/api/openai/extract-subtitles', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });

                console.log('data:', data);

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
        streamFromAPI(message.prompt, message.model, tabId);
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

// Background script 中的流式处理函数
async function streamFromAPI(prompt: string, model: string, tabId: number): Promise<void> {
    try {
        // 准备请求参数
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                model
            })
        };

        // 发起请求到自定义API
        const response = await fetchApi('/api/openai/stream', requestOptions);

        // 创建一个ReadableStream来处理响应
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder();
        let fullText = '';

        // 处理流式响应
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        const content = json.choices[0]?.delta?.content || '';
                        if (content) {
                            fullText += content;
                            // 向特定标签页发送数据片段
                            chrome.tabs.sendMessage(tabId, {
                                type: 'stream-chunk',
                                text: content
                            });
                        }
                    } catch (e) {
                        console.error('解析JSON失败:', e);
                    }
                }
            }
        }

        // 发送完成消息
        chrome.tabs.sendMessage(tabId, {
            type: 'stream-end',
            fullText
        });

        // 提前返回，不执行后面的OpenAI API调用
        return;
    } catch (error) {
        console.error("流式AI请求出现异常:", error);
        chrome.tabs.sendMessage(tabId, {
            type: 'stream-error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
}