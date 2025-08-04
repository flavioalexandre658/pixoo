import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

import { SupportedLocale } from "@/interfaces/shared.interface";
type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: SupportedLocale }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as SupportedLocale)) {
    notFound();
  }

  // Load messages dynamically to avoid circular dependency
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    messages = (await import(`../../../messages/pt.json`)).default;
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
      <Toaster />
    </NextIntlClientProvider>
  );
}
