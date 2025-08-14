"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CTABanner() {
  const t = useTranslations("landingPage.ctaBanner");
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/sign-up");
  };

  const handleExplore = () => {
    router.push("/explore");
  };

  return (
    <section className="relative py-12 sm:py-20 lg:py-28 px-4 sm:px-6 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/10 via-pixoo-pink/5 to-pixoo-magenta/10" />
      <div className="absolute top-5 sm:top-10 left-1/4 w-48 h-48 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-5 sm:bottom-10 right-1/4 w-40 h-40 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-pink/15 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-background/60 to-background/80 border-2 border-pixoo-magenta/20 shadow-2xl shadow-pixoo-purple/10 backdrop-blur-sm hover:shadow-3xl hover:shadow-pixoo-magenta/20 transition-all duration-500 py-0">
          <CardContent className="relative p-6 sm:p-10 lg:p-16 text-center">
            {/* Card background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5" />
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-br from-pixoo-pink to-pixoo-magenta rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-500">
                <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white animate-pulse" />
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-br from-foreground via-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent leading-tight px-2">
                {t("title")}
              </h2>

              <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
                {t("description")}
              </p>

              <div className="flex flex-col gap-4 sm:gap-6 justify-center max-w-md sm:max-w-none mx-auto">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="group text-base sm:text-lg px-6 sm:px-8 lg:px-10 py-6 sm:py-7 lg:py-8 bg-gradient-to-r from-pixoo-dark to-pixoo-purple hover:from-pixoo-purple hover:to-pixoo-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl w-full sm:w-auto"
                >
                  {t("getStarted")}
                  <ArrowUpRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleExplore}
                  className="group text-base sm:text-lg px-6 sm:px-8 lg:px-10 py-6 sm:py-7 lg:py-8 border-2 border-pixoo-magenta/30 bg-gradient-to-r from-pixoo-magenta/10 to-pixoo-pink/10 hover:from-pixoo-magenta/20 hover:to-pixoo-pink/20 text-foreground hover:text-pixoo-magenta transition-all duration-300 hover:scale-105 hover:border-pixoo-magenta/50 rounded-xl w-full sm:w-auto"
                >
                  {t("exploreGallery")}
                  <Sparkles className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform duration-300" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
