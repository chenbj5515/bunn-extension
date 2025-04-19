const API_BASE_URL = process.env.API_BASE_URL;


export async function handleGenerateTextStream(message: { type: string, payload: { prompt: string, model: string } }, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
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
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/generate-text-stream`, {
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
}