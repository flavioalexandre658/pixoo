"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { ReactNode, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  children: ReactNode;
};

export default function ApplicationLayout({ children }: Props) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("auth");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push(`/${locale}/sign-in`);
    }
  }, [session, isPending, router, locale]);

  // Mostrar loading enquanto verifica a sessão
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">
            {t("loading") || "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  // Se não há sessão, não renderizar nada (redirecionamento já foi feito)
  if (!session?.user) {
    return null;
  }

  // Se há sessão válida, renderizar o layout da aplicação
  return <AppLayout>{children}</AppLayout>;
}
