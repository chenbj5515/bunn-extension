export async function handleGenerateText(message: { type: string, payload: { prompt: string, model: string } }, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    try {
        // 使用Hono客户端发起请求到自定义API
        // 直接传递json参数，而不是requestOptions对象
        const response = await fetch(`${process.env.API_BASE_URL}/api/ai/generate-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: message.payload.prompt,
                model: message.payload.model
            })
        });

        // 从ClientResponse对象中提取JSON数据
        const result = await response.json();
        
        if (result.success) {
            sendResponse({ text: result.data });
        } else {
            sendResponse({ error: result.error, errorCode: result.errorCode });
        }

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
}