"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Home, Search, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/branding/logo";
import { useParams } from "next/navigation";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-pixoo-purple/5 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-pixoo-pink/10 to-pixoo-magenta/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pixoo-purple/10 to-pixoo-pink/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-pixoo-magenta/5 to-pixoo-purple/5 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo
            width={64}
            height={64}
            customLogo="/images/icon.svg"
            showText={false}
          />
        </div>

        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-6 bg-gradient-to-br from-pixoo-pink/10 to-pixoo-magenta/10 rounded-2xl border border-pixoo-magenta/20 backdrop-blur-sm">
              <AlertTriangle className="h-16 w-16 text-pixoo-magenta" />
            </div>
          </div>
        </div>

        {/* 404 Number */}
        <div className="space-y-2">
          <h1 className="text-8xl sm:text-9xl font-bold bg-gradient-to-br from-pixoo-purple via-pixoo-magenta to-pixoo-pink bg-clip-text text-transparent leading-none">
            404
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-foreground via-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent">
            {t("title")}
          </h2>

          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t("subtitle")}
          </p>

          <p className="text-sm text-muted-foreground/80 max-w-lg mx-auto">
            {t("description")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href={`/${locale}`}>
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-pixoo-purple to-pixoo-magenta hover:from-pixoo-purple/90 hover:to-pixoo-magenta/90 text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-pixoo-purple/25 hover:shadow-xl hover:shadow-pixoo-purple/30"
            >
              <Home className="h-5 w-5 mr-2" />
              {t("goHome")}
            </Button>
          </Link>

          <Link href={`/${locale}/explore`}>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-pixoo-magenta/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:scale-105"
            >
              <Search className="h-5 w-5 mr-2" />
              {t("exploreGallery")}
            </Button>
          </Link>
        </div>

        {/* Additional help text */}
        <div className="pt-8 border-t border-pixoo-magenta/20">
          <p className="text-xs text-muted-foreground/60">
            {t("contactSupport")}
          </p>
        </div>
      </div>
    </div>
  );
}
