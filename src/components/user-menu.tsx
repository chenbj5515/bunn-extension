import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { fetchApi } from "@/utils/api";
import { User } from "@/popup/app";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const { i18n } = useTranslation();

  const formatExpiryDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleLogout = () => {
    fetchApi("/api/user/logout", {
      credentials: "include"
    }).then(() => {
      window.location.reload()
    })
  };

  const handleManageSubscription = () => {
    fetchApi("/api/stripe/portal", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        locale: i18n.language
      })
    })
      .then((data) => {
        if (data.url) {
          console.log(data.url)
          window.open(data.url, "_blank");
        }
      });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none flex items-center gap-3">
        <Avatar className="cursor-pointer h-10 w-10">
          <AvatarImage src={`https://bunn.ink${user.profile}`} />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <span className="text-sm">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[260px]">
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-default py-2">
          <span className="text-sm">{user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleManageSubscription} className="flex justify-between items-center py-2">
          <span className="text-sm">会员计划</span>
          <span className="text-sm">
            {user.has_subscription ? 'Premium' : 'Free'}
          </span>
        </DropdownMenuItem>
        
        {user.has_subscription && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-default py-2">
            <span className="text-sm flex justify-between w-full">
              <span>有效期限</span>
              <span>{formatExpiryDate(user.exp)}</span>
            </span>
          </DropdownMenuItem>
        )}

        {!user.has_subscription && (
          <>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-default py-2">
              <span className="text-sm flex justify-between w-full">
                <span>剩余字幕提取次数：</span>
                <span>{10 - (user.today_ocr_count || 0)}</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-default py-2">
              <span className="text-sm flex justify-between w-full">
                <span>剩余文本翻译次数：</span>
                <span>{20 - (user.today_translation_count || 0)}</span>
              </span>
            </DropdownMenuItem>
          </>
        )}

        {user.has_subscription && (
          <>
            <DropdownMenuItem onClick={handleManageSubscription} className="py-2">
              <span className="text-sm">订阅管理</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="py-2">
          <span className="text-sm">退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 