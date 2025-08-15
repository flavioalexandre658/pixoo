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
import { Loader2, Mail } from "lucide-react";

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
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pixoo-purple/20 to-pixoo-magenta/20 rounded-full flex items-center justify-center border border-pixoo-purple/30">
          <Mail className="w-8 h-8 text-pixoo-purple" />
        </div>
        <div>
          <h3 className="text-lg font-medium bg-gradient-to-r from-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent">
            E-mail enviado!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Enviamos um link de redefinição para{" "}
            <span className="font-medium text-pixoo-purple">
              {getValues("email")}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setEmailSent(false)}
          className="w-full border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300"
        >
          <span className="bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent font-medium">
            Enviar novamente
          </span>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent"
        >
          {t("email")}
        </Label>
        <Input
          id="email"
          type="email"
          placeholder={t("enterEmail")}
          {...register("email")}
          className={
            errors.email
              ? "border-red-500"
              : "border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-pixoo-purple/20 transition-all duration-300"
          }
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-pixoo-purple to-pixoo-magenta hover:from-pixoo-magenta hover:to-pixoo-pink text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/30"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("sendResetLink")}
      </Button>
    </form>
  );
}
