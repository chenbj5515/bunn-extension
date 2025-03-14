import { BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import "../i18n" // 导入i18n配置

export default function UsageGuide() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <CardTitle className="text-lg">{t('usageGuide.title')}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-[18px] font-semibold mb-2">{t('usageGuide.shortcuts.cmdShiftC.title')}</h3>
          <p className="text-[14px] text-muted-foreground">
            {t('usageGuide.shortcuts.cmdShiftC.netflix')}
          </p>
          <p className="text-[14px] text-muted-foreground">
            {t('usageGuide.shortcuts.cmdShiftC.youtube')}
          </p>
        </div>
        <div>
          <h3 className="text-[18px] font-semibold mb-2">{t('usageGuide.shortcuts.cmdShiftR.title')}</h3>
          <p className="text-[14px] text-muted-foreground">{t('usageGuide.shortcuts.cmdShiftR.description')}</p>
        </div>
        <div>
          <h3 className="text-[18px] font-semibold mb-2">{t('usageGuide.shortcuts.t.title')}</h3>
          <p className="text-[14px] text-muted-foreground">
            {t('usageGuide.shortcuts.t.description')}
          </p>
        </div>
        <div>
          <h3 className="text-[18px] font-semibold mb-2">{t('usageGuide.shortcuts.cc.title')}</h3>
          <p className="text-[14px] text-muted-foreground">
            {t('usageGuide.shortcuts.cc.description')}
          </p>
        </div>
        <CardDescription>
          {t('usageGuide.forBestResults')} <a href="https://bunn.ink/" target="_blank" className="underline underline-offset-4 hover:text-primary">Bunn</a>
          <div className="mt-2">{t('usageGuide.BunnIsBest')}</div>
        </CardDescription>
      </CardContent>
    </Card>
  )
}