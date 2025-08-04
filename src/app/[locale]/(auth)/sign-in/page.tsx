import { SignInForm } from "./_components/sign-in-form";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function SignInPage() {
  const t = useTranslations("auth");

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("welcomeBack")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t("signIn")}</p>
      </div>

      <SignInForm />

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("dontHaveAccount")}{" "}
          <Link
            href="/sign-up"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {t("signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
