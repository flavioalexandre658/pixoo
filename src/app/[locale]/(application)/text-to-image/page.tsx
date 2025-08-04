"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { TextToImage } from "./_components/text-to-image";
import { ImageHistory } from "./_components/image-history";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Contador de tempo em tempo real
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating && generationStartTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - generationStartTime);
      }, 100); // Atualiza a cada 100ms para suavidade
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, generationStartTime]);

  const handleGenerationStart = () => {
    setIsGenerating(true);
    setGenerationStartTime(Date.now());
    setCurrentTime(0);
  };

  const handleGenerationComplete = (timeMs: number) => {
    setIsGenerating(false);
    setGenerationStartTime(null);
    setCurrentTime(timeMs);
    // Atualizar histórico quando uma nova imagem for gerada
    setHistoryRefreshTrigger(prev => prev + 1);
  };

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
          <TextToImage 
            onImageGenerated={setGeneratedImage}
            onGenerationStart={handleGenerationStart}
            onGenerationComplete={handleGenerationComplete}
            isGenerating={isGenerating}
          />
        </PageContainerLeft>

        {/* Right side - Preview */}
        <PageContainerRight>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="text-center">
                <div className="text-6xl font-mono font-bold text-primary">
                  {(currentTime / 1000).toFixed(1)}
                </div>
                <div className="text-lg text-muted-foreground mt-2">
                  segundos
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Gerando sua imagem...
              </div>
            </div>
          ) : generatedImage ? (
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
                <Image
                  src={generatedImage}
                  alt="Generated image"
                  width={512}
                  height={512}
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
      
      {/* Histórico de Imagens */}
      <div className="mt-8">
        <ImageHistory refreshTrigger={historyRefreshTrigger} />
      </div>
    </PageContainer>
  );
}
