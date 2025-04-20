const API_BASE_URL = process.env.API_BASE_URL;

// 定义API响应类型
type ApiErrorResponse = { success: false; error: string; errorCode: number };
type ApiSuccessResponse = { success: true; subtitles: string; text?: { fullText: string } };
type ApiResponse = ApiErrorResponse | ApiSuccessResponse;

export async function handleExtractSubtitles(imageData: Uint8Array<ArrayBufferLike> | number[], sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    try {
        const uint8Array = new Uint8Array(imageData);
        const blob = new Blob([uint8Array], { type: 'image/png' });
        const formData = new FormData();
        formData.append('image', blob, 'image.png');

        const response = await fetch(`${API_BASE_URL}/api/ai/extract-subtitles`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json() as ApiResponse;

        if (data.success) {
            console.log("提取到的字幕:", data.subtitles);
            sendResponse({ result: data.subtitles });
        } else {
            console.error("接口调用失败:", data);
            
            // 检查是否是403错误（token限制）
            if (response.status === 403 || (data as ApiErrorResponse).errorCode === 403) {
                sendResponse({ error: 'TOKEN_LIMIT_REACHED' });
            } else {
                sendResponse({ error: data.error });
            }
        }
    } catch (error) {
        console.error("请求出现异常:", error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
    }
}