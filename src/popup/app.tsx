import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Key, UserCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchApi } from "@/utils/api"
import { LanguageSelector } from "@/components/language-selector"
import Loading from "@/components/loading"
import { UserMenu } from "@/components/user-menu"
import ApiKeyForm from "./api-key-form"
import AuthForm from "./auth-form"
import UsageGuide from "./usage-guide"
import SubscriptionPrompt from "./subscription-prompt"
import "../i18n" // 导入i18n配置

// 定义用户类型
export interface User {
  user_id: string
  id: string
  has_subscription: string | null
  image: string
  name: string
  email: string
  today_ocr_count: number
  today_translation_count: number
  exp: number
}

export default function SettingsPage() {
  // 保存用户信息，若无法获取则为 null
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false)
  const [storedApiKey, setStoredApiKey] = useState("")  // 新增状态来存储 API key
  const { t } = useTranslation();
  // 请求 /api/user/info 接口，获取用户信息
  useEffect(() => {
    fetchApi("/api/auth/get-session", {
      // 带上 cookie 信息
      credentials: "include"
    })
      .then((data) => {
        // 假设接口返回的数据包含 id 和 username 字段
        if (data?.user) {
          console.log(data.user, "data.user===========")
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("获取用户信息失败：", err)
        setLoading(false)
      })
  }, [])

  // 修改检查 chrome storage 的 useEffect
  useEffect(() => {
    chrome.storage.local.get(['openai_api_key'], (result) => {
      setHasStoredApiKey(!!result.openai_api_key)
      setStoredApiKey(result.openai_api_key || "") // 保存 API key 的值
    })
  }, [])

  // 点击"订阅引导"时，打开新的 tab 访问订阅引导页（替换下面的 URL）
  // const handleSubscribeGuide = () => {
  //   window.open("https://your-subscription-guide-url.com", "_blank")
  // }

  if (loading) {
    return <Loading />
  }

  console.log(user, "user===========")

  return (
    <div className="mx-auto px-4 py-4 max-w-4xl container">
      {/* 添加语言切换按钮 */}
      <div className="flex justify-end">
        <LanguageSelector />
      </div>

      {/* 使用新的UserMenu组件 */}
      {user && (
        <div className="flex justify-between items-center mb-4">
          <UserMenu user={user} />
        </div>
      )}

      {/* 没有获取到用户信息（未登录）时，展示原有的 Sign in 和 Use API Key 选项 */}
      {!user && !hasStoredApiKey && (
        <>
          <h1 className="mt-[4px] mb-6 font-bold text-2xl">{t('loginPage.missingApiKey')}</h1>
          <div className="mb-5 text-[16px] text-muted-foreground">
            {t('loginPage.chooseOption')}
          </div>

          <div className="relative gap-6 grid md:grid-cols-2 mb-8">
            <Card className="relative hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCircle className="w-6 h-6" />
                  <CardTitle className="text-xl">{t('loginPage.signIn.title')}</CardTitle>
                </div>
                <CardDescription>
                  {t('loginPage.signIn.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthForm />
              </CardContent>
            </Card>

            {/* 垂直 OR 分隔符 */}
            <div className="hidden md:block top-1/2 left-1/2 absolute -translate-x-1/2 -translate-y-1/2">
              <div className="bg-background px-4 py-2 border rounded-full text-sm">{t('loginPage.or')}</div>
            </div>

            {/* 移动端水平 OR 分隔符 */}
            <div className="md:hidden flex justify-center items-center">
              <div className="bg-background px-4 py-2 border rounded-full text-sm">{t('loginPage.or')}</div>
            </div>

            <Card className="relative hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="w-6 h-6" />
                  <CardTitle className="text-lg">{t('loginPage.apiKey.title')}</CardTitle>
                </div>
                <CardDescription>
                  {t('loginPage.apiKey.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeyForm initialApiKey={storedApiKey} onSaved={() => window.location.reload()} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 当能获取到用户信息时，根据 current_plan 字段展示对应的内容 */}
      {user ? (
        <>
          {user.has_subscription !== null ? <UsageGuide /> : (
            <>
              {hasStoredApiKey ? (
                // 已登录且设置了API KEY的情况
                <>
                  <UsageGuide />

                  <Card className="mt-8">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Key className="w-6 h-6" />
                        <CardTitle className="text-lg">{t('loginPage.apiKey.title')}</CardTitle>
                      </div>
                      <CardDescription>
                        {t('loginPage.apiKey.alreadySetup')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ApiKeyForm initialApiKey={storedApiKey} onSaved={() => window.location.reload()} />
                    </CardContent>
                  </Card>

                  <div className="mt-8">
                    <SubscriptionPrompt apiKeySetted />
                  </div>
                </>
              ) : (
                // 原有的免费用户视图（已登录但未设置API KEY）
                <div className="relative gap-6 grid md:grid-cols-2 mb-8">
                  <SubscriptionPrompt />

                  {/* 移动端水平 OR 分隔符 */}
                  <div className="md:hidden flex justify-center items-center">
                    <div className="bg-background px-4 py-2 border rounded-full text-sm">{t('loginPage.or')}</div>
                  </div>

                  <Card className="relative hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Key className="w-6 h-6" />
                        <CardTitle className="text-lg">{t('loginPage.apiKey.title')}</CardTitle>
                      </div>
                      <CardDescription>
                        {t('loginPage.apiKey.description')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ApiKeyForm initialApiKey={storedApiKey} onSaved={() => window.location.reload()} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </>
      ) : null}

      {/* 没有用户但有存储的 API key 时的视图 */}
      {!user && hasStoredApiKey ? (
        <div>
          <UsageGuide />

          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="w-6 h-6" />
                <CardTitle className="text-lg">{t('loginPage.apiKey.title')}</CardTitle>
              </div>
              <CardDescription>
                {t('loginPage.apiKey.alreadySetup')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeyForm initialApiKey={storedApiKey} onSaved={() => window.location.reload()} />
            </CardContent>
          </Card>

          <Card className="relative mt-[28px] transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCircle className="w-6 h-6" />
                <CardTitle className="text-xl">{t('loginPage.signIn.title')}</CardTitle>
              </div>
              <CardDescription>
                {t('loginPage.signIn.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}