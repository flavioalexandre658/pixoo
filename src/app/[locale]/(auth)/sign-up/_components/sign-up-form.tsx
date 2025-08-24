"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSignUpSchema } from "@/form-schemas/auth.schema";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { Loader2, User, Mail, Lock, UserPlus } from "lucide-react";
import { z } from "zod";
import { useDeviceFingerprint } from "@/utils/device-fingerprint.util";
import { useAction } from "next-safe-action/hooks";
import { checkFingerprint } from "@/actions/device-fingerprints/check-fingerprint/check-fingerprint.action";
import { checkRateLimit } from "@/actions/rate-limiting/check-rate-limit/check-rate-limit.action";

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { generateFingerprint, getFingerprintData } = useDeviceFingerprint();
  const { executeAsync: executeCheckFingerprint } = useAction(checkFingerprint);
  const { executeAsync: executeCheckRateLimit } = useAction(checkRateLimit);

  // Create schema with translations using useMemo to prevent recreation on every render
  const formSchema = createSignUpSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Gerar fingerprint do dispositivo
      const fingerprint = await generateFingerprint();
      const fingerprintData = getFingerprintData();
      
      if (!fingerprint || !fingerprintData) {
        toast.error("Erro ao verificar dispositivo. Tente novamente.");
        return;
      }

      // Verificar rate limiting primeiro
      const rateLimitResult = await executeCheckRateLimit({
        ipAddress: "unknown", // Será obtido no servidor
        userAgent: fingerprintData.userAgent,
        fingerprint,
        email: data.email,
      });

      if (!rateLimitResult?.data?.allowed) {
        toast.error(rateLimitResult?.data?.reason || 'Limite de criação de contas excedido.');
        return;
      }

      // Verificar se o dispositivo pode receber créditos
      const fingerprintResult = await executeCheckFingerprint({
        fingerprint,
        ipAddress: "unknown", // Será obtido no servidor
        userAgent: fingerprintData.userAgent,
        screenResolution: fingerprintData.screenResolution,
        timezone: fingerprintData.timezone,
        language: fingerprintData.language,
        platform: fingerprintData.platform,
      });

      if (fingerprintResult?.data?.fingerprintId) {
          setFingerprintId(fingerprintResult.data.fingerprintId);
        }

        // Criar conta com header do fingerprint
        const headers: Record<string, string> = {};
        if (fingerprintResult?.data?.fingerprintId) {
          headers['x-device-fingerprint-id'] = fingerprintResult.data.fingerprintId;
        }

      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      }, {
        headers,
      });

      if (result.error) {
        toast.error(t("signUpError"));
        return;
      }

      // Mostrar mensagem baseada se recebeu créditos ou não
      if (fingerprintResult?.data?.canReceiveCredits) {
        toast.success(t("signUpSuccess") + " Você recebeu 4 créditos gratuitos!");
      } else {
        toast.success(t("signUpSuccess"));
        toast("Este dispositivo já foi usado para receber créditos gratuitos.");
      }
      
      router.push(`/${locale}/create-image`);
    } catch (error) {
      console.error("Erro no sign up:", error);
      toast.error(t("signUpError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Gerar fingerprint do dispositivo antes do login social
      const fingerprint = await generateFingerprint();
      const fingerprintData = getFingerprintData();
      
      if (fingerprint && fingerprintData) {
        // Verificar rate limiting primeiro (sem email para login social)
        const rateLimitResult = await executeCheckRateLimit({
          ipAddress: "unknown", // Será obtido no servidor
          userAgent: fingerprintData.userAgent,
          fingerprint,
        });

        if (!rateLimitResult?.data?.allowed) {
          toast.error(rateLimitResult?.data?.reason || 'Limite de criação de contas excedido.');
          setIsGoogleLoading(false);
          return;
        }

        // Verificar se o dispositivo pode receber créditos
        const fingerprintResult = await executeCheckFingerprint({
          fingerprint,
          ipAddress: "unknown", // Será obtido no servidor
          userAgent: fingerprintData.userAgent,
          screenResolution: fingerprintData.screenResolution,
          timezone: fingerprintData.timezone,
          language: fingerprintData.language,
          platform: fingerprintData.platform,
        });

        if (fingerprintResult?.data?.fingerprintId) {
            setFingerprintId(fingerprintResult.data.fingerprintId);
            // Armazenar temporariamente no localStorage para usar após o redirect
            localStorage.setItem('temp-fingerprint-id', fingerprintResult.data.fingerprintId);
            if (fingerprintResult.data.canReceiveCredits !== undefined) {
              localStorage.setItem('temp-can-receive-credits', fingerprintResult.data.canReceiveCredits.toString());
            }
          }
      }

      await authClient.signIn.social({
        provider: "google",
        callbackURL: `/${locale}/create-image`,
      });
    } catch (error) {
      console.error("Erro no Google sign up:", error);
      toast.error(t("signUpError"));
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Sign Up Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
        onClick={handleGoogleSignUp}
        disabled={isGoogleLoading || isLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {t("signUpWithGoogle")}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-sm font-medium flex items-center gap-2"
          >
            <User className="h-3.5 w-3.5 text-pixoo-purple" />
            {t("fullName")}
          </Label>
          <Input
            id="name"
            type="text"
            placeholder={t("enterName")}
            {...register("name")}
            className={`h-11 transition-colors ${
              errors.name
                ? "border-destructive focus-visible:ring-destructive"
                : "focus-visible:ring-pixoo-purple"
            }`}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium flex items-center gap-2"
          >
            <Mail className="h-3.5 w-3.5 text-pixoo-purple" />
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("enterEmail")}
            {...register("email")}
            className={`h-11 transition-colors ${
              errors.email
                ? "border-destructive focus-visible:ring-destructive"
                : "focus-visible:ring-pixoo-purple"
            }`}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium flex items-center gap-2"
          >
            <Lock className="h-3.5 w-3.5 text-pixoo-purple" />
            {t("password")}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={t("enterPassword")}
            {...register("password")}
            className={`h-11 transition-colors ${
              errors.password
                ? "border-destructive focus-visible:ring-destructive"
                : "focus-visible:ring-pixoo-purple"
            }`}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium flex items-center gap-2"
          >
            <Lock className="h-3.5 w-3.5 text-pixoo-purple" />
            {t("confirmPassword")}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t("confirmPassword")}
            {...register("confirmPassword")}
            className={`h-11 transition-colors ${
              errors.confirmPassword
                ? "border-destructive focus-visible:ring-destructive"
                : "focus-visible:ring-pixoo-purple"
            }`}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-pixoo-purple to-pixoo-magenta hover:from-pixoo-purple/90 hover:to-pixoo-magenta/90 text-white font-medium transition-all duration-200"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t("signUp")}
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              {t("signUp")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
