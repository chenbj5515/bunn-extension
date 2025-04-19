import { useTranslation } from "react-i18next"
import "@/utils/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Key } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { generateText } from "@/common/api"

export default function ManageApiKey({ 
    storedApiKey, 
    highlightOnHover = true 
}: { 
    storedApiKey: string
    highlightOnHover?: boolean
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [apiKey, setApiKey] = useState(storedApiKey)
    const [apiKeyError, setApiKeyError] = useState<string | null>(null)
    const { t } = useTranslation();

    async function onSubmit(event: React.FormEvent) {
        event.preventDefault()
        setIsLoading(true)
        setApiKeyError(null)

        try {
            // 验证API Key是否有效
            await chrome.storage.local.set({ openai_api_key: apiKey })
            
            try {
                // 尝试使用API key生成一段简单的文本来验证key是否有效
                await generateText("Hello", "gpt-3.5-turbo")
                
                // 如果成功，刷新页面
                window.location.reload()
            } catch (error) {
                // API key无效，设置错误信息
                console.error('API Key验证失败:', error)
                setApiKeyError(t('loginPage.apiKey.invalidKey') || '无效的API Key，请检查并重新输入')
                // 移除无效的API key
                await chrome.storage.local.remove('openai_api_key')
                setIsLoading(false)
            }
        } catch (error) {
            console.error('保存API Key失败:', error)
            setApiKeyError(t('loginPage.apiKey.saveFailed') || '保存API Key失败')
            setIsLoading(false)
        }
    }

    return (
        <Card className={`relative mt-4 ${highlightOnHover ? 'hover:border-primary' : ''} transition-colors`}>
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
                {/* <ApiKeyForm initialApiKey={storedApiKey} onSaved={() => window.location.reload()} /> */}
                <div className="space-y-4">
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                className="text-[14px]"
                                type="password"
                                placeholder={t('loginPage.apiKey.placeholder')}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                disabled={isLoading}
                            />
                            {apiKeyError && (
                                <p className="text-destructive text-sm">
                                    {apiKeyError}
                                </p>
                            )}
                            <p className="text-muted-foreground text-sm">
                                {t('loginPage.apiKey.visitPage')}{" "}
                                <a
                                    href="https://platform.openai.com/account/api-keys"
                                    target="_blank"
                                    className="text-primary hover:text-muted-foreground underline underline-offset-4"
                                >
                                    {t('loginPage.apiKey.officialPage')}
                                </a>{" "}
                                {t('loginPage.apiKey.toObtain')}
                            </p>
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading && <Icons.spinner className="mr-2 w-4 h-4 animate-spin" />}
                            {t('loginPage.apiKey.saveSettings')}
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    )
}
