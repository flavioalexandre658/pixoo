import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { SupportedLocale } from "@/interfaces/shared.interface";
import { Navbar } from "@/app/[locale]/(lp)/_components/navbar";
import Footer from "@/app/[locale]/(lp)/_components/footer";
import Hero from "@/app/[locale]/(lp)/_components/hero";
import Features from "@/app/[locale]/(lp)/_components/features";
import FAQ from "@/app/[locale]/(lp)/_components/faq";
import CTABanner from "@/app/[locale]/(lp)/_components/cta-banner";
import FAQSchema from "@/components/seo/faq-schema";
import WebsiteSchema from "@/components/seo/website-schema";

type Props = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  // Redirect non-Spanish locales to their respective routes
  if (locale !== 'es') {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "metadata.aiImageGenerator" });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pixooai.com";
  const pageUrl = `${baseUrl}/${locale}/generador-imagenes-ia`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
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
      url: pageUrl,
      siteName: t("openGraph.siteName"),
      images: [
        {
          url: `${baseUrl}/images/ai-generator-og.jpg`,
          width: 1200,
          height: 630,
          alt: t("openGraph.imageAlt"),
        },
      ],
      locale: "es_ES",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitter.title"),
      description: t("twitter.description"),
      creator: t("twitter.creator"),
      images: [`${baseUrl}/images/ai-generator-twitter.jpg`],
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        "pt-BR": `${baseUrl}/pt/gerador-imagens-ia`,
        "en-US": `${baseUrl}/en/ai-image-generator`,
        "es-ES": `${baseUrl}/es/generador-imagenes-ia`,
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
  };
}

export default async function AiImageGeneratorPage({ params }: Props) {
  const { locale } = await params;

  // Redirect non-Spanish locales to their respective routes
  if (locale !== 'es') {
    notFound();
  }

  return (
    <>
      <Navbar locale={locale} />
      <main className="min-h-screen">
        <Hero pageType="aiImageGenerator" locale={locale} />
        <Features pageType="aiImageGenerator" locale={locale} />
        <FAQ pageType="aiImageGenerator" locale={locale} />
        <CTABanner pageType="aiImageGenerator" locale={locale} />
      </main>
      <Footer />
      <FAQSchema locale={locale} pageType="aiImageGenerator" />
      <WebsiteSchema locale={locale} pageType="aiImageGenerator" />
    </>
  );
}