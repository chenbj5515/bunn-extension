import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Star } from "lucide-react"
import { useTranslation } from "react-i18next"
import "../i18n" // 导入i18n配置

export default function SubscriptionPrompt(props: { apiKeySetted?: boolean }) {
    const { apiKeySetted } = props;
    const { t } = useTranslation();

    return (
        <Card className={`${apiKeySetted ? "hover:border-primary" : ""} transition-colors`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-6 h-6" />
                    {t('subscription.title')}
                </CardTitle>
                <CardDescription>
                    {t('subscription.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                    <Button 
                        className="group flex justify-center items-center gap-2 transition-all duration-300 ease-in-out"
                        onClick={() => window.open('https://www.bunn.ink/pricing', '_blank')}
                    >
                        {t('subscription.subscribeNow')}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-300 ease-in-out" />
                    </Button>
                    <div className="flex items-center text-muted-foreground text-sm text-center">
                        {t('subscription.learnMore')}
                        <a
                            href="https://bunn.ink/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-[2px] text-primary hover:text-muted-foreground underline underline-offset-4"
                        >
                            {t('subscription.website')}
                        </a>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}