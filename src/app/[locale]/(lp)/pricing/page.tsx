import { getTranslations } from "next-intl/server";
import { Fragment } from "react";
import { Crown, Sparkles } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlansList } from "@/components/plans/plans-list";
import { Navbar } from "../_components/navbar";
import Footer from "../_components/footer";

interface PricingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PricingPageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "pricing",
  });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  const t = await getTranslations("pricing");

  return (
    <TooltipProvider>
      <Fragment>
        <Navbar locale={locale} />
        <main>
          {/* Hero Section */}
          <div className="pb-4 pt-28 xs:pt-40 sm:pt-48 relative flex flex-col items-center px-6 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-pixoo-pink/5 to-pixoo-magenta/10 -z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent -z-10" />

            {/* Floating elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute top-40 right-16 w-32 h-32 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-pink/15 rounded-full blur-2xl animate-pulse delay-1000" />

            <div className="flex items-center justify-center md:mt-6 relative z-10">
              <div className="max-w-4xl text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-r from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full backdrop-blur-sm border border-pixoo-magenta/30">
                    <Crown className="h-10 w-10 text-pixoo-magenta" />
                  </div>
                </div>

                <h1 className="mt-6 max-w-[20ch] text-3xl font-bold !leading-[1.1] tracking-tight xs:text-4xl sm:text-5xl md:text-6xl bg-gradient-to-br from-foreground via-foreground to-pixoo-purple bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  {t("title")}
                </h1>

                <p className="mt-4 max-w-[60ch] text-lg xs:text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                  {t("subtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="py-12 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6 mb-16">
                <div className="text-center p-8 bg-gradient-to-br from-background via-background to-pixoo-purple/5 rounded-2xl border border-pixoo-magenta/20 hover:border-pixoo-magenta/40 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                  <div className="p-3 bg-gradient-to-r from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full w-fit mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-pixoo-magenta" />
                  </div>
                  <h3 className="font-bold text-lg mb-3">
                    {t("features.fastGeneration.title")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("features.fastGeneration.description")}
                  </p>
                </div>

                <div className="text-center p-8 bg-gradient-to-br from-background via-background to-pixoo-purple/5 rounded-2xl border border-pixoo-magenta/20 hover:border-pixoo-magenta/40 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                  <div className="p-3 bg-gradient-to-r from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full w-fit mx-auto mb-4">
                    <Crown className="h-8 w-8 text-pixoo-magenta" />
                  </div>
                  <h3 className="font-bold text-lg mb-3">
                    {t("features.premiumQuality.title")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("features.premiumQuality.description")}
                  </p>
                </div>

                <div className="text-center p-8 bg-gradient-to-br from-background via-background to-pixoo-purple/5 rounded-2xl border border-pixoo-magenta/20 hover:border-pixoo-magenta/40 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                  <div className="p-3 bg-gradient-to-r from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full w-fit mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-pixoo-magenta" />
                  </div>
                  <h3 className="font-bold text-lg mb-3">
                    {t("features.commercialLicense.title")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("features.commercialLicense.description")}
                  </p>
                </div>
              </div>

              {/* Plans List */}
              <div className="max-w-6xl mx-auto">
                <PlansList
                  locale={locale}
                  showSelectButton={true}
                  buttonText="Começar Agora"
                />
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="py-16 px-6 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl xs:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-pixoo-purple bg-clip-text text-transparent">
                  {t("faq.title")}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-gradient-to-br from-background via-background to-pixoo-purple/5 rounded-2xl border border-pixoo-magenta/20 hover:border-pixoo-magenta/40 transition-all duration-300 backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-3 text-pixoo-magenta">
                    {t("faq.questions.cancel.question")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("faq.questions.cancel.answer")}
                  </p>
                </div>

                <div className="p-8 bg-gradient-to-br from-background via-background to-pixoo-purple/5 rounded-2xl border border-pixoo-magenta/20 hover:border-pixoo-magenta/40 transition-all duration-300 backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-3 text-pixoo-magenta">
                    {t("faq.questions.credits.question")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("faq.questions.credits.answer")}
                  </p>
                </div>

                <div className="p-8 bg-gradient-to-br from-background via-background to-pixoo-purple/5 rounded-2xl border border-pixoo-magenta/20 hover:border-pixoo-magenta/40 transition-all duration-300 backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-3 text-pixoo-magenta">
                    {t("faq.questions.commercial.question")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("faq.questions.commercial.answer")}
                  </p>
                </div>

                <div className="p-8 bg-gradient-to-br from-background via-background to-pixoo-purple/5 rounded-2xl border border-pixoo-magenta/20 hover:border-pixoo-magenta/40 transition-all duration-300 backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-3 text-pixoo-magenta">
                    {t("faq.questions.free.question")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("faq.questions.free.answer")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </Fragment>
    </TooltipProvider>
  );
}
