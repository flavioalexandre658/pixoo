import { ForgotPasswordForm } from "./_components/forgot-password-form";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("resetYourPassword")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t("enterEmailToReset")}
        </p>
      </div>

      <ForgotPasswordForm />

      <div className="mt-6 text-center">
        <Link
          href="/sign-in"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToSignIn")}
        </Link>
      </div>
    </div>
  );
}