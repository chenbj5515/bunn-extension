import OpenAI from 'openai';
import { APIError } from '../utils/api';

// 获取API Key的方法
export const getApiKey = async (): Promise<string | null> => {
  const result = await chrome.storage.local.get(['openai_api_key']);
  return result.openai_api_key || null;
};

// 非流式请求AI的方法
export const askAI = async (
  prompt: string,
  model: string = 'gpt-4o'
): Promise<string> => {
  try {
    // 尝试获取API Key
    const apiKey = await getApiKey();
    
    if (apiKey) {
      // 有API Key，直接使用OpenAI SDK
      const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      });

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.choices[0]?.message?.content || '';
    } else {

      // 没有API Key，通过background.js调用
      const response = await chrome.runtime.sendMessage({
        type: 'CALL_AI_API',
        payload: { prompt, model }
      });

      // 检查是否存在错误信息
      if (response.error) {
        // 如果是API返回的格式化错误
        if (response.errorCode) {
          throw new APIError(response.error, response.errorCode);
        } else {
          throw new Error(response.error);
        }
      }

      return response.result.data;
    }
  } catch (error) {
    // 原样抛出APIError，保留错误类型
    if (error instanceof APIError) {
      throw error;
    }
    
    // 其他错误直接抛出
    throw error;
  }
};

// 流式请求AI的方法
export const askAIStream = async (
  prompt: string,
  model: string = 'gpt-4o',
  onChunk: (chunk: string) => void = () => { },
  onComplete: (fullText: string) => void = () => { },
  onError: (error: Error) => void = () => { }
): Promise<void> => {
  try {
    // 尝试获取API Key
    const apiKey = await getApiKey();
    
    if (apiKey) {
      // 有API Key，直接使用OpenAI SDK
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

      const stream = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      let fullText = '';

      // 处理流式响应
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          onChunk(text);
          fullText += text;
        }
      }

      onComplete(fullText);
    } else {
      // 没有API Key，通过background.js调用
      chrome.runtime.sendMessage({
        type: 'START_AI_STREAM',
        payload: { prompt, model }
      });
      
      // 创建一个唯一的消息处理函数，以便后续可以移除
      const messageHandler = (message: any) => {
        if (message.type === 'stream-chunk') {
          // 处理接收到的数据片段
          onChunk(message.text);
        } else if (message.type === 'stream-end') {
          // 处理接收到的完整文本
          onComplete(message.text);
          // 流处理完成后，移除监听器
          chrome.runtime.onMessage.removeListener(messageHandler);
        } else if (message.type === 'stream-error') {
          // 处理流式请求中的错误
          if (message.errorCode) {
            onError(new APIError(message.error, message.errorCode));
          } else {
            onError(new Error(message.error));
          }
          // 错误发生后，移除监听器
          chrome.runtime.onMessage.removeListener(messageHandler);
        }
      };
      
      // 监听流式响应
      chrome.runtime.onMessage.addListener(messageHandler);
    }
  } catch (error) {
    console.error('流式调用AI API失败:', error);
    // 调用错误处理回调
    onError(error instanceof APIError ? error : new Error(String(error)));
    throw error;
  }
};
