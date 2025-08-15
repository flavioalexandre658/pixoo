"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signIn } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";
import { z } from "zod";

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Create schema with translations using useMemo to prevent recreation on every render
  const formSchema = useMemo(() => {
    return z.object({
      email: z.string().min(1, t("emailRequired")).email(t("invalidEmail")),
      password: z
        .string()
        .min(1, t("passwordRequired"))
        .min(8, t("passwordMinLength")),
    });
  }, [t]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
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
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(t("signInError"));
        return;
      }

      toast.success(t("signInSuccess"));
      router.push(`/${locale}/create-image`);
    } catch {
      toast.error(t("signInError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: `/${locale}/create-image`,
      });
    } catch {
      toast.error(t("signInError"));
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Sign In Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
        onClick={handleGoogleSignIn}
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
        {t("signInWithGoogle")}
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

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-pixoo-purple hover:text-pixoo-magenta transition-colors hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-pixoo-purple to-pixoo-magenta hover:from-pixoo-purple/90 hover:to-pixoo-magenta/90 text-white font-medium transition-all duration-200"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t("signIn")}
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              {t("signIn")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
