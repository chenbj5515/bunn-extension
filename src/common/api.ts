import OpenAI from 'openai';

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
      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.choices[0]?.message?.content || '';
    } else {

      console.log("没有API Key，通过background.js调用")
      // 没有API Key，通过background.js调用
      const response = await chrome.runtime.sendMessage({
        type: 'CALL_AI_API',
        payload: { prompt, model }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.result.data;
    }
  } catch (error) {
    console.error('调用AI API失败:', error);
    throw error;
  }
};

// 流式请求AI的方法
export const askAIStream = async (
  prompt: string,
  model: string = 'gpt-4o',
  onChunk: (chunk: string) => void = () => { },
  onComplete: (fullText: string) => void = () => { }
): Promise<void> => {
  try {
    // 尝试获取API Key
    const apiKey = await getApiKey();
    
    if (apiKey) {
      // 有API Key，直接使用OpenAI SDK
      const openai = new OpenAI({ apiKey });

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
      
      // 监听流式响应
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'stream-chunk') {
          // 处理接收到的数据片段
          onChunk(message.text);
        } else if (message.type === 'stream-end') {
          // 处理接收到的完整文本
          onComplete(message.text);
        }
      });
    }
  } catch (error) {
    console.error('流式调用AI API失败:', error);
    throw error;
  }
};
