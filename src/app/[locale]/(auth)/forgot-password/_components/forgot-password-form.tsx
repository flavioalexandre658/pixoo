"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/form-schemas/auth.schema";
import { forgetPassword } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { Mail, Send, RotateCcw } from "lucide-react";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const t = useTranslations("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const result = await forgetPassword({
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        toast.error(t("resetPasswordError"));
        return;
      }

      setEmailSent(true);
      toast.success(t("resetLinkSent"));
    } catch {
      toast.error(t("resetPasswordError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-sm mx-auto">
        {/* Simplified success state for mobile */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 -z-10" />

        {/* Reduced decorative elements */}
        <div className="hidden sm:block absolute top-10 left-10 w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-xl animate-pulse" />

        <div className="relative p-4 sm:p-6 border border-green-500/30 bg-background/95 backdrop-blur-sm shadow-lg rounded-lg">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-500/30">
              <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-green-600">
                E-mail enviado!
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                Enviamos um link de redefinição para{" "}
                <span className="font-medium text-green-600 break-all">
                  {getValues("email")}
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setEmailSent(false)}
              className="w-full h-10 sm:h-12 border border-green-500/30 hover:border-emerald-500/50 hover:bg-green-500/5 transition-all duration-300 font-medium"
            >
              <RotateCcw className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-green-600 font-medium">
                Enviar novamente
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Simplified background for mobile */}
      <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 to-pixoo-magenta/10 -z-10" />

      {/* Reduced decorative elements for mobile */}
      <div className="hidden sm:block absolute top-10 left-10 w-16 h-16 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-xl animate-pulse" />
      <div className="hidden sm:block absolute bottom-10 right-10 w-12 h-12 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-pink/15 rounded-full blur-lg animate-pulse delay-500" />

      <div className="relative p-4 sm:p-6 border border-pixoo-purple/30 bg-background/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-6"
        >
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <div className="p-1 rounded bg-pixoo-purple/20">
                <Mail className="h-3 w-3 text-pixoo-purple" />
              </div>
              {t("email")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("enterEmail")}
              {...register("email")}
              className={`h-11 sm:h-12 border border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-1 focus:ring-pixoo-purple/20 transition-colors ${
                errors.email ? "border-red-500 focus:border-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 font-medium bg-gradient-to-r from-pixoo-dark to-pixoo-purple hover:from-pixoo-purple hover:to-pixoo-dark text-white shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                {t("sendResetLink")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t("sendResetLink")}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
