import { BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import "@/utils/i18n"; // 确保导入i18n配置

export default function UsageGuide() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            <CardTitle className="text-lg">{t('usageGuide.title')}</CardTitle>
          </div>
        </div>
        <CardDescription>
          {t('usageGuide.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-2 font-semibold text-[18px]">{t('usageGuide.shortcuts.option.title')}</h3>

          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <strong className="font-[600] text-[14px] text-black">
                {t('usageGuide.shortcuts.option.forText')}
              </strong>
            </div>
            <div className="text-[14px] text-muted-foreground">
              {t('usageGuide.shortcuts.option.textPrefix')}
              <a href="https://www.bunn.ink/" target="_blank" className="mx-1 hover:text-primary underline underline-offset-4">Bunn</a>
              {t('usageGuide.shortcuts.option.textSuffix')}
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <strong className="font-[600] text-[14px] text-black">
                {t('usageGuide.shortcuts.option.youtubeTitle')}
              </strong>
              <a href="https://www.youtube.com/" target="_blank" className="inline-flex">
                <img src={`${process.env.API_BASE_URL}/icon/youtube.svg`} alt="YouTube" width={70} />
              </a>
            </div>
            <p className="text-[14px] text-muted-foreground">
              {t('usageGuide.shortcuts.option.youtubeContent')}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <strong className="font-[600] text-[14px] text-black">
                {t('usageGuide.shortcuts.option.netflixTitle')}
              </strong>
              <a href="https://www.netflix.com/" target="_blank" className="inline-flex">
                <img src={`${process.env.API_BASE_URL}/icon/netflix.png`} alt="Netflix" width={50} />
              </a>
            </div>
            <p className="text-[14px] text-muted-foreground">
              {t('usageGuide.shortcuts.option.netflixContent')}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-[18px]">{t('usageGuide.shortcuts.t.title')}</h3>
          <p className="text-[14px] text-muted-foreground">
            {t('usageGuide.shortcuts.t.description')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}