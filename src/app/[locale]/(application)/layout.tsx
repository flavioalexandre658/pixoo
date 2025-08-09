import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreditsProvider } from "@/contexts/credits-context";
import { getCreditsSSR } from "@/lib/credits-ssr";
import { headers } from "next/headers";
import { AppLayout } from "@/components/layout/app-layout";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ApplicationLayout({ children, params }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { locale } = await params;

  // Redirecionar se não há sessão
  if (!session?.user) {
    redirect(`/${locale}/sign-in`);
  }

  // Carregar créditos do usuário no SSR
  const initialCredits = await getCreditsSSR();

  return (
    <CreditsProvider initialCredits={initialCredits}>
      <AppLayout>{children}</AppLayout>
    </CreditsProvider>
  );
}
