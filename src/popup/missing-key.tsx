import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { UserCircle } from "lucide-react"
import SignIn from "./sign-in";
import "@/utils/i18n"; // 确保导入i18n配置
import ManageApiKey from "./manage-api-key";

export default function MissingKey() {
    const [storedApiKey, setStoredApiKey] = useState("")  // 新增状态来存储 API key
    const { t } = useTranslation();

    return (
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
                        <SignIn />
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
                <ManageApiKey storedApiKey={storedApiKey} highlightOnHover={true} />
            </div>
        </>
    )
}