"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { fetchApi } from "@/utils/api"
import { useTranslation } from "react-i18next"
import "../i18n" // 导入i18n配置

export default function AuthForm() {
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { t } = useTranslation();

  async function onGitHubSignIn() {
    try {
      setIsGithubLoading(true)

      // 请求 GitHub 登录链接
      const data = await fetchApi("/api/auth/sign-in/social", {
        credentials: "include",
        method: "POST",
        body: JSON.stringify({
          provider: "github",
          callbackURL: "/",
        })
      })
      window.open(data.url, "_blank")
    } catch (error) {
      console.error("GitHub 登录错误：", error)
    } finally {
      setIsGithubLoading(false)
    }
  }

  async function onGoogleSignIn() {
    try {
      setIsGoogleLoading(true)

      // 请求 Google 登录链接
      const data = await fetchApi("/api/auth/sign-in/social", {
        credentials: "include",
        method: "POST",
        body: JSON.stringify({
          provider: "google",
          callbackURL: "/",
        }),
      })
      window.open(data.url, "_blank")
    } catch (error) {
      console.error("Google 登录错误：", error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="gap-4 grid">
      <Button variant="outline" type="button" disabled={isGithubLoading} className="w-full" onClick={onGitHubSignIn}>
        {isGithubLoading ? (
          <Icons.spinner className="mr-2 w-4 h-4 animate-spin" />
        ) : (
          <Icons.github className="mr-2 w-4 h-4" />
        )}
        {t('auth.signInWithGithub')}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="border-t w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('auth.or')}</span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={isGoogleLoading} className="w-full" onClick={onGoogleSignIn}>
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 w-4 h-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 w-4 h-4" />
        )}
        {t('auth.signInWithGoogle')}
      </Button>
    </div>
  )
}