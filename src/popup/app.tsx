import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { LanguageSelector } from "@/components/language-selector"
import Loading from "@/components/loading"
import { UserMenu } from "./user-menu"
import MissingKey from "./missing-key"
import SignIn from "./sign-in"
import "@/utils/i18n"
import UsageGuide from "./usage-guide"
import ManageApiKey from "./manage-api-key"

// 根据新接口返回格式定义接口
export interface SessionResponse {
  success: boolean;
  data?: {
    session: {
      user: {
        id: string;
        name: string;
        email: string;
        image?: string;
      }
    };
    subscription: {
      active: boolean;
      expireAt: string | null;
    }
  };
  message?: string;
}

// 定义用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  subscriptionActive: boolean;
  expireTime: string | null;
}

// 获取baseUrl的函数
function getBaseUrl(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'http://localhost:3000' : 'https://www.bunn.ink';
}

export default function SettingsPage() {
  // 保存用户信息，若无法获取则为 null
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // const [hasStoredApiKey, setHasStoredApiKey] = useState(false)
  const [storedApiKey, setStoredApiKey] = useState("")  // 新增状态来存储 API key
  const [showSignIn, setShowSignIn] = useState(false)  // 新增状态控制是否显示登录页面
  const { t } = useTranslation();

  // 使用client调用新的/users/session接口
  const apiBaseUrl = getBaseUrl();

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/user/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(async (response) => {
        const responseData = await response.json();
        if (responseData.success) {
          const {user, subscription} = responseData;

          const userData: User = {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image || undefined,
            subscriptionActive: subscription.active,
            expireTime: subscription.expireTime
          };

          console.log(userData, "user data from session API");
          setUser(userData);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        setLoading(false);
      });
  }, []);

  // 修改检查 chrome storage 的 useEffect
  useEffect(() => {
    chrome.storage.local.get(['openai_api_key'], (result) => {
      setStoredApiKey(result.openai_api_key || "") // 保存 API key 的值
    })
  }, [])

  function handleSignIn() {
    setShowSignIn(true);  // 点击登录按钮时，切换到登录页面
  }

  function handleBack() {
    setShowSignIn(false);  // 返回主设置页面
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="mx-auto px-4 py-4 w-[360px] max-w-4xl font-mono container">
      {/* 顶部导航栏：语言选择器在左，用户菜单在右，两者垂直居中 */}
      <div className="flex justify-between items-center mb-4">
        {showSignIn ? (
          <button
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 hover:border-black rounded-[8px] font-medium text-[#1a1a1a] text-[14px] hover:text-[#595a5d] transition cursor-pointer"
          >
            {t('common.back')}
          </button>
        ) : user ? (
          <UserMenu user={user} />
        ) : (
          <button
            onClick={handleSignIn}
            className="px-4 py-2 border border-gray-300 hover:border-black rounded-[8px] w-[100px] font-medium text-[#1a1a1a] text-[14px] hover:text-[#595a5d] transition cursor-pointer"
          >
            {t('common.login')}
          </button>
        )}
        <LanguageSelector />
      </div>
      
      {showSignIn ? (
        <SignIn />
      ) : user ? (
        <UsageGuide />
      ) : storedApiKey ? (
        <>
          <UsageGuide />
          <ManageApiKey storedApiKey={storedApiKey} highlightOnHover={false} />
        </>
      ) : (
        <MissingKey />
      )}
    </div>
  )
}