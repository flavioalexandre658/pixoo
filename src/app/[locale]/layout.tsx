import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { SupportedLocale } from "@/interfaces/shared.interface";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.seo" });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.pixoo.com.br";

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"), // Agora é uma string, não array
    authors: [{ name: t("authors.name") }],
    creator: t("creator"),
    publisher: t("publisher"),
    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: t("openGraph.title"),
      description: t("openGraph.description"),
      url: baseUrl,
      siteName: t("openGraph.siteName"),
      images: [
        {
          url: `${baseUrl}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: t("openGraph.imageAlt"),
        },
      ],
      locale: locale === "pt" ? "pt_BR" : locale === "en" ? "en_US" : "es_ES",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitter.title"),
      description: t("twitter.description"),
      creator: t("twitter.creator"),
      images: [`${baseUrl}/images/twitter-image.jpg`],
    },
    alternates: {
      canonical: baseUrl,
      languages: {
        "pt-BR": `${baseUrl}/pt`,
        "en-US": `${baseUrl}/en`,
        "es-ES": `${baseUrl}/es`,
      },
    },
    category: t("category"),
    classification: t("classification"),
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

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
  } catch {
    messages = (await import(`../../../messages/pt.json`)).default;
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
      <Toaster />
    </NextIntlClientProvider>
  );
}
