/**
 * 处理与 Web 端的通信
 */

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  subscriptionActive: boolean;
  expireTime: string | null;
}

interface SessionResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  subscription?: {
    active: boolean;
    expireTime: string | null;
  };
}

// 获取扩展是否被固定在工具栏的状态
export async function handleGetPinState(
  msg: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    const { isOnToolbar } = await chrome.action.getUserSettings();
    sendResponse({ ok: true, isOnToolbar });
  } catch (err) {
    sendResponse({ ok: false, error: String(err) });
  }
}

// 获取用户登录状态
export async function handleGetLoginState(
  msg: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://www.bunn.ink';

    const response = await fetch(`${baseUrl}/api/user/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data: SessionResponse = await response.json();

    console.log(data, "data from session API");
    if (data.success && data.user && data.subscription) {
      // 根据实际API返回格式，user和subscription直接在data上
      const { user, subscription } = data;
      const userData: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        subscriptionActive: subscription.active,
        expireTime: subscription.expireTime
      };

      sendResponse({
        ok: true,
        isLoggedIn: true,
        user: userData
      });
    } else {
      sendResponse({
        ok: true,
        isLoggedIn: false
      });
    }
  } catch (err) {
    sendResponse({ 
      ok: false, 
      isLoggedIn: false,
      error: String(err) 
    });
  }
}

// 处理 PING 消息
export function handlePing(
  msg: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  sendResponse({ ok: true, message: 'PONG' });
}

// 处理所有来自 Web 端的消息
export function handleWebMessage(
  msg: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean {
  if (!msg?.type) return false;

  switch (msg.type) {
    case 'GET_PIN_STATE':
      handleGetPinState(msg, sender, sendResponse);
      return true;
    case 'GET_LOGIN_STATE':
      handleGetLoginState(msg, sender, sendResponse);
      return true;
    case 'PING':
      handlePing(msg, sender, sendResponse);
      return true;
    default:
      return false;
  }
}
