"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { PlansList } from "@/components/plans/plans-list";
import { useRouter } from "next/navigation";

const Pricing = () => {
  const t = useTranslations("landingPage.pricing");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const handlePlanSelect = (plan: any) => {
    if (plan.code === "free") {
      router.push("/sign-up");
    } else {
      router.push(`/sign-up?plan=${plan.code}&period=${plan.interval}`);
    }
  };

  return (
    <div
      className="flex flex-col items-center gap-6 py-12 xs:py-16 px-6"
      id="pricing"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl xs:text-3xl md:text-4xl md:leading-[3.5rem] font-bold tracking-tight sm:max-w-xl sm:mx-auto">
          {t("title")}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {/* Plans List Component */}
      <div className="max-w-6xl w-full">
        <PlansList
          locale={locale}
          onPlanSelect={handlePlanSelect}
          showSelectButton={true}
          excludeFreePlan={true}
          buttonText={t("common.choosePlan")}
          className=""
        />
      </div>
    </div>
  );
};

export default Pricing;
