"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SupportedLocale } from "@/interfaces/shared.interface";

interface HeroProps {
  pageType?: string;
  locale?: SupportedLocale;
}

const Hero = ({ pageType = "landingPage", locale }: HeroProps) => {
  const namespace = pageType === "aiImageGenerator" ? "aiImageGenerator.hero" : "landingPage.hero";
  const t = useTranslations(namespace);
  const router = useRouter();

  return (
    <div className=" pb-4 pt-28 xs:pt-40 sm:pt-48 relative flex flex-col items-center px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-pixoo-pink/5 to-pixoo-magenta/10 -z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent -z-10" />

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-40 right-16 w-32 h-32 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-pink/15 rounded-full blur-2xl animate-pulse delay-1000" />

      <div className="flex items-center justify-center md:mt-6 relative z-10">
        <div className="max-w-2xl text-center">
          <Badge className="text-md cursor-pointer relative rounded-xl border-none bg-gradient-to-r from-pixoo-pink to-pixoo-magenta py-2 px-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <Sparkles className="w-8 h-8 mr-2 animate-pulse" />
            {t("badge")}
          </Badge>

          <h1 className="mt-6 max-w-[20ch] text-3xl font-bold !leading-[1.1] tracking-tight xs:text-4xl sm:text-5xl md:text-6xl bg-gradient-to-br from-foreground via-foreground to-pixoo-purple bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {t("title")}
          </h1>

          <p className="mx-auto mt-2 max-w-[60ch] text-md xs:text-md text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            {t("subtitle")}
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
            <Button
              size="lg"
              className="group cursor-pointer w-full rounded-xl text-base sm:w-auto bg-gradient-to-r from-pixoo-dark to-pixoo-purple hover:from-pixoo-purple hover:to-pixoo-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 py-6"
              onClick={() => router.push("/create-image")}
            >
              {t("ctaPrimary")}
              <ArrowUpRight className="!h-5 !w-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="group w-full cursor-pointer rounded-xl text-base sm:w-auto border-2 border-pixoo-magenta/30 bg-gradient-to-r from-pixoo-magenta/10 to-pixoo-pink/10 hover:from-pixoo-magenta/20 hover:to-pixoo-pink/20 text-foreground hover:text-pixoo-magenta transition-all duration-300 hover:scale-105 hover:border-pixoo-magenta/50 px-8 py-6"
              onClick={() => router.push("/edit-image")}
            >
              {t("ctaSecondary")}
              <Sparkles className="!h-5 !w-5 ml-2 group-hover:rotate-12 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
