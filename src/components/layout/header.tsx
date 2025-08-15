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
import { useParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { CreditsDisplay } from "@/components/ui/credits-display";
import { usePageTitle } from "@/hooks/use-page-title";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const t = useTranslations("header");
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
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

  const handleLanguageChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-pixoo-purple/20 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 relative overflow-hidden",
        className
      )}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-pixoo-purple/5 via-pixoo-pink/5 to-pixoo-magenta/10 -z-10" />

      {/* Floating decorative elements */}
      <div className="absolute top-2 left-20 w-8 h-8 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-lg animate-pulse" />
      <div className="absolute top-1 right-32 w-6 h-6 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-pink/15 rounded-full blur-md animate-pulse delay-500" />

      <div className="flex h-14 items-center justify-between px-4 relative">
        {/* Left side - could be used for breadcrumbs or page title */}
        <div className="flex items-center gap-4">
          <div className="md:hidden" /> {/* Space for mobile menu button */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-foreground via-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-magenta/10 transition-all duration-300"
              >
                <Globe className="h-4 w-4 text-pixoo-purple" />
                <span className="sr-only">{t("changeLanguage")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="backdrop-blur-sm bg-card/95 border-pixoo-purple/20"
            >
              <DropdownMenuLabel className="bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                {t("language")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-pixoo-purple/20" />
              <DropdownMenuItem
                onClick={() => handleLanguageChange("en")}
                className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-magenta/10 transition-all duration-300"
              >
                <span className="flex items-center gap-2">🇺🇸 English</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLanguageChange("pt")}
                className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-magenta/10 transition-all duration-300"
              >
                <span className="flex items-center gap-2">🇧🇷 Português</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLanguageChange("es")}
                className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-magenta/10 transition-all duration-300"
              >
                <span className="flex items-center gap-2">🇪🇸 Español</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Credits Display */}
          {session?.user && <CreditsDisplay variant="compact" />}

          {/* User Menu */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-pixoo-purple/20 transition-all duration-300"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-pixoo-purple/20">
                    <AvatarImage
                      src={session?.user?.image || "/avatars/01.png"}
                      alt={session?.user?.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-pixoo-purple to-pixoo-magenta text-white">
                      {session?.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 backdrop-blur-sm bg-card/95 border-pixoo-purple/20"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                      {session?.user?.name || "Usuário"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email || "email@exemplo.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-pixoo-purple/20" />
                <DropdownMenuItem className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-magenta/10 transition-all duration-300">
                  <User className="mr-2 h-4 w-4 text-pixoo-purple" />
                  <span>{t("profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-magenta/10 transition-all duration-300">
                  <CreditCard className="mr-2 h-4 w-4 text-pixoo-magenta" />
                  <span>{t("billing")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-magenta/10 transition-all duration-300">
                  <Settings className="mr-2 h-4 w-4 text-pixoo-pink" />
                  <span>{t("settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-pixoo-purple/20" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 transition-all duration-300"
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-500" />
                  <span>{t("logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-pixoo-purple/20 transition-all duration-300"
              onClick={handleSignIn}
            >
              <Avatar className="h-8 w-8 ring-2 ring-pixoo-purple/20">
                <AvatarFallback className="bg-gradient-to-br from-pixoo-purple to-pixoo-magenta text-white">
                  AN
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
