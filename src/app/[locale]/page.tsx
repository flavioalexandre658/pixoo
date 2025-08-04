"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("auth");

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        // Se o usuário está logado, redireciona para o dashboard
        router.push(`/${locale}/dashboard`);
      } else {
        // Se não está logado, redireciona para o sign-in
        router.push(`/${locale}/sign-in`);
      }
    }
  }, [session, isPending, router, locale]);

  // Mostrar loading enquanto verifica a sessão e faz o redirecionamento
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600 dark:text-gray-400">{t("loading") || "Carregando..."}</p>
      </div>
    </div>
  );
}