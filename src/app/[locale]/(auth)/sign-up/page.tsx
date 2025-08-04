import { SignUpForm } from "./_components/sign-up-form";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function SignUpPage() {
  const t = useTranslations("auth");

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("createAccount")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t("signUp")}</p>
      </div>

      <SignUpForm />

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("alreadyHaveAccount")}{" "}
          <Link
            href="/sign-in"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
