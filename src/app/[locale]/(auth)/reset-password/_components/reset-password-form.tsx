"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { resetPassword } from "../../../../../lib/auth-client";
import { resetPasswordSchema } from "../../../../../form-schemas/auth.schema";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Eye, EyeOff, Lock, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import type { z } from "zod";

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Token de redefinição inválido");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({
        newPassword: data.password,
        token,
      });

      toast.success(t("passwordResetSuccess"));
      router.push(`/${locale}/sign-in`);
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(t("passwordResetError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="p-4 sm:p-6 border border-red-500/30 bg-background/95 backdrop-blur-sm shadow-lg rounded-lg">
          <div className="text-center text-red-600 dark:text-red-400 flex flex-col sm:flex-row items-center justify-center gap-2">
            <div className="p-2 rounded-full bg-red-500/10">
              <RotateCcw className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-sm sm:text-base">
              Token de redefinição inválido ou expirado.
            </span>
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
              htmlFor="password"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <div className="p-1 rounded bg-pixoo-purple/20">
                <Lock className="h-3 w-3 text-pixoo-purple" />
              </div>
              {t("password")}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={`h-11 sm:h-12 border border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-1 focus:ring-pixoo-purple/20 transition-colors pr-10 ${
                  errors.password ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-pixoo-purple hover:text-pixoo-magenta transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 text-pixoo-purple hover:text-pixoo-magenta transition-colors" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <div className="p-1 rounded bg-pixoo-purple/20">
                <Lock className="h-3 w-3 text-pixoo-purple" />
              </div>
              {t("confirmPassword")}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className={`h-11 sm:h-12 border border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-1 focus:ring-pixoo-purple/20 transition-colors pr-10 ${
                  errors.confirmPassword
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-pixoo-purple hover:text-pixoo-magenta transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 text-pixoo-purple hover:text-pixoo-magenta transition-colors" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.confirmPassword.message}
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
                {t("resetting")}
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("resetPassword")}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
