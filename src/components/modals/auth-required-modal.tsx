"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  locale,
}: AuthRequiredModalProps) {
  const t = useTranslations("authRequired");
  const router = useRouter();

  const handleSignIn = () => {
    router.push(`/${locale}/sign-in`);
    onClose();
  };

  const handleSignUp = () => {
    router.push(`/${locale}/sign-up`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-md lg:max-w-lg xl:max-w-xl p-0 overflow-hidden border-pixoo-purple/20 shadow-2xl shadow-pixoo-purple/20">
        {/* Elementos decorativos flutuantes - responsivos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pixoo-purple/30 to-pixoo-magenta/30 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pixoo-pink/30 to-pixoo-purple/30 rounded-full blur-xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/4 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-pixoo-magenta/20 to-pixoo-pink/20 rounded-full blur-lg animate-bounce delay-500" />
        </div>

        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5" />

        <div className="relative p-4 sm:p-6 lg:p-8 xl:p-10 space-y-4 sm:space-y-6 lg:space-y-8">
          <DialogHeader className="space-y-3 sm:space-y-4 lg:space-y-6 text-center">
            <div className="mx-auto p-2 sm:p-3 lg:p-4 rounded-xl bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 w-fit">
              <LogIn className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-pixoo-purple" />
            </div>
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent px-2 text-center">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed px-2 max-w-sm lg:max-w-md xl:max-w-lg mx-auto text-center">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-col lg:flex-col space-y-3 sm:space-y-4 lg:space-y-4 sm:space-x-0 pt-2 sm:pt-4 lg:pt-6 items-stretch">
            <Button
              onClick={handleSignUp}
              className="w-full h-10 sm:h-11 lg:h-12 xl:h-14 bg-gradient-to-r from-pixoo-purple to-pixoo-magenta hover:from-pixoo-purple/90 hover:to-pixoo-magenta/90 text-white font-medium transition-all duration-300 shadow-lg shadow-pixoo-purple/25 hover:shadow-xl hover:shadow-pixoo-purple/30 text-sm sm:text-base lg:text-lg"
            >
              <div className="p-1 rounded-md bg-white/20 mr-2">
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </div>
              {t("signUp")}
            </Button>
            <Button
              variant="outline"
              onClick={handleSignIn}
              className="w-full h-10 sm:h-11 lg:h-12 xl:h-14 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20 text-sm sm:text-base lg:text-lg"
            >
              <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 mr-2">
                <LogIn className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-pixoo-purple" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                {t("signIn")}
              </span>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
