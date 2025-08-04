"use client";

import { useTranslations } from "next-intl";
import { TextToImage } from "./_components/text-to-image";
import {
  PageContainer,
  PageContainerContent,
  PageContainerHeader,
  PageContainerLeft,
  PageContainerRight,
} from "@/components/ui/page-container/page-container";

export default function Home() {
  const t = useTranslations("textToImage");

  return (
    <PageContainer>
      <PageContainerHeader>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          Generate stunning images with AI using advanced Flux models
        </p>
      </PageContainerHeader>
      <PageContainerContent>
        {/* Left side - Form */}
        <PageContainerLeft>
          <TextToImage />
        </PageContainerLeft>

        {/* Right side - Preview */}
        <PageContainerRight>
          <div className="text-center text-muted-foreground">
            <p className="text-lg">{t("noImageGenerated")}</p>
          </div>
        </PageContainerRight>
      </PageContainerContent>
    </PageContainer>
  );
}
