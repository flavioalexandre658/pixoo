import { ResetPasswordForm } from "./_components/reset-password-form";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent mb-2">
          {t("resetPassword")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Digite sua nova senha
        </p>
      </div>

      <ResetPasswordForm />

      <div className="text-center">
        <Link
          href="/sign-in"
          className="inline-flex items-center text-sm text-pixoo-purple hover:text-pixoo-magenta transition-colors duration-300 font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
