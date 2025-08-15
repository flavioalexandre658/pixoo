import { SignUpForm } from "./_components/sign-up-form";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function SignUpPage() {
  const t = useTranslations("auth");

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-lg p-8 border border-pixoo-purple/20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent">
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
            className="font-medium text-pixoo-purple hover:text-pixoo-magenta transition-colors duration-300"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
