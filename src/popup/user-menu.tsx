import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/popup/app";
import { ChevronRight } from "lucide-react";
// import { client } from '@server/lib/api-client';
import api from '@/utils/api';
import i18n from '@/utils/i18n';
import { useTranslation } from 'react-i18next';

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const { t } = useTranslation();

  const formatExpiryDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 处理ISO格式日期字符串
  const formatISODate = (isoDateString: string) => {
    const date = new Date(isoDateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleLogout = async () => {
    await api.post("/api/auth/sign-out")
    window.location.reload()
  };

  const handleManageSubscription = () => {
    if (!user.subscriptionActive) {
      window.open(`${process.env.API_BASE_URL}/pricing`, "_blank");
      return;
    }
    api.post("/api/stripe/portal", {
      locale: i18n.language
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
        < DropdownMenuTrigger className="flex items-center gap-3 focus:outline-none" >
          <Avatar className="w-10 h-10 cursor-pointer">
            <AvatarImage src={`${process.env.API_BASE_URL}${user.image}`} />
            <AvatarFallback>Name</AvatarFallback>
          </Avatar>
          <span className="text-sm">{user.name}</span>
        </DropdownMenuTrigger >
      <DropdownMenuContent className="w-[260px]">
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="py-2 cursor-default">
          <span className="text-sm">{user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleManageSubscription} className="flex justify-between items-center py-2">
          <span className="text-sm">{t('userMenu.membership')}</span>
          <span className="text-sm">
            {user.subscriptionActive ? t('userMenu.premium') : t('userMenu.free')}
          </span>
        </DropdownMenuItem>

        {user.subscriptionActive && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="py-2 cursor-default">
            <span className="flex justify-between w-full text-sm">
              <span>{t('userMenu.expiryDate')}</span>
              <span>{user.expireTime ? formatISODate(user.expireTime) : ''}</span>
            </span>
          </DropdownMenuItem>
        )}

        {user.subscriptionActive && (
          <>
            <DropdownMenuItem onClick={handleManageSubscription} className="py-2">
              <span className="flex justify-between items-center w-full text-sm">
                <span>{t('userMenu.manageSubscription')}</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="py-2">
          <span className="text-sm">{t('userMenu.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu >
  );
} 