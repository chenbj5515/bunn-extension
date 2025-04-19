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

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  // const { i18n } = useTranslation();

  const formatExpiryDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
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
    // api.post("/api/stripe/portal", {
    //   locale: i18n.language
    // })
    //   .then((data) => {
    //     if (data.url) {
    //       console.log(data.url)
    //       window.open(data.url, "_blank");
    //     }
    //   });
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
          <span className="text-sm">会员计划</span>
          <span className="text-sm">
            {user.subscriptionActive ? 'Premium' : 'Free'}
          </span>
        </DropdownMenuItem>

        {user.subscriptionActive && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="py-2 cursor-default">
            <span className="flex justify-between w-full text-sm">
              <span>有效期限</span>
              {/* <span>{formatExpiryDate(user.expireAt)}</span> */}
            </span>
          </DropdownMenuItem>
        )}

        {user.subscriptionActive && (
          <>
            <DropdownMenuItem onClick={handleManageSubscription} className="py-2">
              <span className="flex justify-between items-center w-full text-sm">
                <span>订阅管理</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="py-2">
          <span className="text-sm">退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu >
  );
} 