"use client";

import { useTranslations } from "next-intl";
import { ImageHistory } from "@/components/ui/image-history/image-history";
import {
  PageContainer,
  PageContainerHeader,
} from "@/components/ui/page-container/page-container";

export default function History() {
  const t = useTranslations("history");

  const handlePromptReuse = (prompt: string) => {
    // Aqui você pode implementar a lógica para reutilizar o prompt
    // Por exemplo, redirecionar para a página de text-to-image com o prompt preenchido
    console.log("Reusing prompt:", prompt);
  };

  return (
    <PageContainer>
      <PageContainerHeader>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("description")}</p>
      </PageContainerHeader>

      <div className="space-y-6">
        <ImageHistory onPromptReuse={handlePromptReuse} />
      </div>
    </PageContainer>
  );
}
