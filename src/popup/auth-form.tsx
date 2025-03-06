"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { fetchApi } from "@/utils/api"
import { useTranslation } from "react-i18next"
import "../i18n" // 导入i18n配置

export default function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation();

  async function onGitHubSignIn() {
    try {
      setIsLoading(true)

      // 获取 CSRF token
      const { csrf_token } = await fetchApi("/auth/csrf-token", {
        credentials: "include"
      })

      // 请求 GitHub 登录链接
      const data = await fetchApi("/auth/github/login", {
        credentials: "include",
        headers: {
          'X-CSRF-Token': csrf_token
        }
      })

      window.open(data.authUrl, "_blank")
    } catch (error) {
      console.error("GitHub 登录错误：", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function onGoogleSignIn() {
    try {
      setIsLoading(true)
      // 获取 CSRF token
      const { csrf_token } = await fetchApi("/auth/csrf-token", {
        credentials: "include"
      })

      // 请求 Google 登录链接
      const data = await fetchApi("/auth/google/login", {
        credentials: "include",
        headers: {
          'X-CSRF-Token': csrf_token
        }
      })
      window.open(data.authUrl, "_blank")
    } catch (error) {
      console.error("Google 登录错误：", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Button variant="outline" type="button" disabled={isLoading} className="w-full" onClick={onGitHubSignIn}>
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.github className="mr-2 h-4 w-4" />
        )}
        {t('auth.signInWithGithub')}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('auth.or')}</span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={isLoading} className="w-full" onClick={onGoogleSignIn}>
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        {t('auth.signInWithGoogle')}
      </Button>
    </div>
  )
}