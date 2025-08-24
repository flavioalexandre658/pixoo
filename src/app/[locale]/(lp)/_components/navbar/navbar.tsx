"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import Logo from "@/components/branding/logo";
import { Button } from "@/components/ui/button";

import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";

const Navbar = ({ locale }: { locale: string }) => {
  const router = useRouter();
  const t = useTranslations("landingPage.navbar");

  return (
    <nav className="fixed inset-x-4 top-6 z-50 mx-auto h-16 max-w-screen-xl rounded-2xl border-2 border-pixoo-magenta/20 bg-gradient-to-r from-background/80 via-background/90 to-background/80 backdrop-blur-xl shadow-2xl shadow-pixoo-purple/10 hover:shadow-pixoo-magenta/20 transition-all duration-500">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-2xl" />

      <div className="relative z-10 mx-auto flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Logo width={42} height={42} customLogo="/images/icon.svg" />
        </div>

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="cursor-pointer hidden border-2 border-pixoo-magenta/30 bg-gradient-to-r from-background/90 to-background/70 text-foreground hover:from-pixoo-magenta/10 hover:to-pixoo-pink/10 hover:border-pixoo-magenta/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 sm:inline-flex rounded-xl"
            onClick={() => router.push("/sign-in")}
          >
            {t("signIn")}
          </Button>

          <Button
            className="group cursor-pointer hidden bg-gradient-to-r from-pixoo-dark to-pixoo-purple hover:from-pixoo-purple hover:to-pixoo-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 sm:inline-flex rounded-xl"

            onClick={() => router.push("/sign-up")}
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            {t("start")}
          </Button>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet locale={locale} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
