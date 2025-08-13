"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, LogOut, CreditCard, Globe } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { CreditsDisplay } from "@/components/ui/credits-display";
import { usePageTitle } from "@/hooks/use-page-title";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const t = useTranslations("header");
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { pageTitle } = usePageTitle();

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}/sign-in`);
  };

  const handleSignIn = () => {
    router.push(`/${locale}/sign-in`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - could be used for breadcrumbs or page title */}
        <div className="flex items-center gap-4">
          <div className="md:hidden" /> {/* Space for mobile menu button */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Globe className="h-4 w-4" />
                <span className="sr-only">{t("changeLanguage")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="flex items-center gap-2">🇺🇸 English</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="flex items-center gap-2">🇧🇷 Português</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="flex items-center gap-2">🇪🇸 Español</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Credits Display */}
          {session?.user && <CreditsDisplay variant="compact" />}

          {/* Notifications 
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            <span className="sr-only">{t("notifications")}</span>
          </Button>*/}

          {/* User Menu */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session?.user?.image || "/avatars/01.png"}
                      alt={session?.user?.name}
                    />
                    <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name || "Usuário"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email || "email@exemplo.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>{t("billing")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
              onClick={handleSignIn}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>AN</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
