import { SignUpForm } from "./_components/sign-up-form";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function SignUpPage() {
  const t = useTranslations("auth");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pixoo-purple via-pixoo-magenta to-pixoo-pink bg-clip-text text-transparent mb-2">
          {t("createAccount")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t("signUp")}
        </p>
      </div>

      <SignUpForm />

      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-dashed border-pixoo-purple/20" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-500 dark:text-gray-400">
              {t("alreadyHaveAccount")}
            </span>
          </div>
        </div>
        <Link
          href="/sign-in"
          className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-pixoo-purple hover:text-white bg-transparent hover:bg-gradient-to-r hover:from-pixoo-purple hover:to-pixoo-magenta border border-pixoo-purple/30 hover:border-transparent rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
        >
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}
