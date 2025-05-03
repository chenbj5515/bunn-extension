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

        const response = await fetch(`${API_BASE_URL}/api/ai/extract-subtitles-google`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json() as ApiResponse;

        if (data.success) {
            console.log("提取到的字幕:", data.subtitles);
            sendResponse({ result: data.subtitles });
        } else {
            console.error("接口调用失败:", data);
            
            // 直接透传API返回的原始错误信息，包括errorCode
            sendResponse({ 
                error: true, 
                errorMessage: data.error,
                errorCode: (data as ApiErrorResponse).errorCode,
                statusCode: response.status
            });
        }
    } catch (error) {
        console.error("请求出现异常:", error);
        // 对于网络请求异常等情况，返回明确的错误信息
        sendResponse({ 
            error: true, 
            errorMessage: error instanceof Error ? error.message : String(error),
            errorCode: 0, // 0表示非API返回的错误
            statusCode: 0
        });
    }
}