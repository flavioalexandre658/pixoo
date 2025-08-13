import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { CreditsProvider } from "@/contexts/credits-context";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { getCreditsSSR } from "@/lib/credits-ssr";
import { headers } from "next/headers";
import { AppLayout } from "@/components/layout/app-layout";
import { subscriptionOperations } from "@/lib/db";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ApplicationLayout({ children }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Carregar créditos do usuário no SSR apenas se estiver logado
  const initialCredits = session?.user ? await getCreditsSSR() : null;

  // Carregar assinatura ativa do usuário no SSR apenas se estiver logado
  const initialSubscription = session?.user
    ? await subscriptionOperations.findActiveByUserId(session.user.id)
    : null;

  return (
    <SubscriptionProvider initialSubscription={initialSubscription}>
      <CreditsProvider initialCredits={initialCredits}>
        <AppLayout>{children}</AppLayout>
      </CreditsProvider>
    </SubscriptionProvider>
  );
}
