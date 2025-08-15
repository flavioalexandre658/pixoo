import { Menu, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

import Logo from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { NavMenu } from "./nav-menu";

export const NavigationSheet = ({ locale }: { locale: string }) => {
  const t = useTranslations("landingPage.navbar");
  const router = useRouter();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-2 border-pixoo-magenta/30 bg-gradient-to-r from-background/90 to-background/70 hover:from-pixoo-magenta/10 hover:to-pixoo-pink/10 hover:border-pixoo-magenta/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Menu className="h-5 w-5 text-pixoo-magenta" />
        </Button>
      </SheetTrigger>

      <SheetContent className="bg-gradient-to-br from-background via-background/95 to-pixoo-purple/5 backdrop-blur-xl border-l-2 border-pixoo-magenta/20">
        <SheetHeader className="border-b border-pixoo-magenta/20 p-4">
          <SheetTitle className="font-medium flex items-center gap-3">
            <Logo width={42} height={42} customLogo="/images/icon.svg" />
          </SheetTitle>
        </SheetHeader>

        <NavMenu orientation="vertical" className="mt-8 px-4" />

        <div className="mt-12 space-y-4 px-4">
          <Button
            variant="outline"
            onClick={() => router.push("/sign-in")}
            className="w-full border-2 border-pixoo-magenta/30 bg-gradient-to-r from-background to-background/50 text-foreground hover:from-pixoo-magenta/10 hover:to-pixoo-pink/10 hover:border-pixoo-magenta/50 transition-all duration-300 hover:scale-105 sm:hidden rounded-xl py-6"
          >
            {t("signIn")}
          </Button>

          <Button
            onClick={() => router.push("/sign-up")}
            className="group w-full bg-gradient-to-r from-pixoo-dark to-pixoo-purple hover:from-pixoo-purple hover:to-pixoo-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 xs:hidden rounded-xl py-6"
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            {t("start")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
