"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TextToImage } from "./_components/text-to-image";
import {
  PageContainer,
  PageContainerContent,
  PageContainerHeader,
  PageContainerLeft,
  PageContainerRight,
} from "@/components/ui/page-container/page-container";
// import Image from "next/image"; // Removido para não otimizar imagens
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";

export default function Home() {
  const t = useTranslations("textToImage");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

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
          <TextToImage onImageGenerated={setGeneratedImage} />
        </PageContainerLeft>

        {/* Right side - Preview */}
        <PageContainerRight>
          {generatedImage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generated Image</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(generatedImage, "_blank")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Size
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadImage}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="relative w-full">
                <img
                  src={generatedImage}
                  alt="Generated image"
                  className="w-full h-auto rounded-lg border shadow-lg"
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="text-lg">{t("noImageGenerated")}</p>
            </div>
          )}
        </PageContainerRight>
      </PageContainerContent>
    </PageContainer>
  );
}
