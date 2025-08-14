import { getTranslations } from "next-intl/server";
import { Fragment } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SupportedLocale } from "@/interfaces/shared.interface";

import CtaBanner from "./_components/cta-banner";
import Faq from "./_components/faq";
import Features from "./_components/features";
import Footer from "./_components/footer";
import Hero from "./_components/hero";
import { Navbar } from "./_components/navbar";
import Pricing from "./_components/pricing";
import PublicImages from "./_components/public-images";

type Props = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata.lp",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  return (
    <TooltipProvider>
      <Fragment>
        <Navbar locale={locale} />
        <main>
          <Hero />
          <Features />
          <PublicImages />
          <Pricing />
          <Faq />
          <CtaBanner />
        </main>
        <Footer />
      </Fragment>
    </TooltipProvider>
  );
}
