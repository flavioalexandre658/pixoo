"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { FormTextToImage } from "@/components/ui/forms-generate/form-text-to-image";
import { ImageHistory } from "@/components/ui/image-history/image-history";
import {
  PageContainer,
  PageContainerContent,
  PageContainerHeader,
  PageContainerLeft,
  PageContainerRight,
} from "@/components/ui/page-container/page-container";
import { ImagePreview } from "@/components/ui/image-preview/image-preview";
import toast from "react-hot-toast";

export default function TextToImage() {
  const t = useTranslations("textToImage");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleImageGenerated = (imageUrl: string) => {
    console.log("🖼️ handleImageGenerated called with imageUrl:", imageUrl);
    setGeneratedImage(imageUrl);
    console.log("🖼️ generatedImage state updated to:", imageUrl);
  };
  const [isGenerating, setIsGenerating] = useState(false);
  const generationStartTimeRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Contador de tempo em tempo real
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating && generationStartTimeRef.current) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - (generationStartTimeRef.current as number));
      }, 100); // Atualiza a cada 100ms para suavidade
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, generationStartTimeRef]);

  // Cleanup das conexões quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleGenerationStart = (startTime?: number) => {
    setIsGenerating(true);
    generationStartTimeRef.current = startTime ?? Date.now();
    setCurrentTime(0);
  };

  const handleGenerationComplete = (timeMs: number) => {
    setIsGenerating(false);
    generationStartTimeRef.current = null;
    setCurrentTime(timeMs);
    // Atualizar histórico quando uma nova imagem for gerada
    setHistoryRefreshTrigger((prev) => prev + 1);
  };

  const downloadImage = async () => {
    if (!generatedImage) {
      toast.error("No image to download");
      return;
    }

    try {
      toast.loading("Preparing download...", { id: "download" });
      
      // Tentar fetch direto primeiro
      let response;
      try {
        response = await fetch(generatedImage, {
          mode: 'cors',
          credentials: 'omit'
        });
      } catch (corsError) {
        // Se falhar por CORS, tentar através de proxy
        response = await fetch(`/api/proxy-image?url=${encodeURIComponent(generatedImage)}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success("Image downloaded successfully!", { id: "download" });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image. Please try again.", { id: "download" });
    }
  };

  // Função para fazer polling do status da tarefa
  const startPolling = (taskId: string, startTime?: number) => {
    console.log("Starting polling for task:", taskId);
    setCurrentTaskId(taskId);

    // Limpar polling anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Função para verificar o status
    const checkStatus = async () => {
      try {
        console.log(`Polling status for task: ${taskId}`);
        const response = await fetch(`/api/images/${taskId}`);

        if (response.ok) {
          const data = await response.json();
          console.log("Polling response:", {
            taskId,
            status: data.status,
            hasImageUrl: !!data.imageUrl,
          });

          if (data.status === "ready" && data.imageUrl) {
            console.log("✅ Task completed successfully via polling!");

            // Parar polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Atualizar UI
            handleImageGenerated(data.imageUrl);
            toast.success("Image generated successfully!");

            console.log(generationStartTimeRef.current);
            // Calcular tempo de geração
            if (generationStartTimeRef.current) {
              const generationTimeMs = Date.now() - (generationStartTimeRef.current as number);
              console.log(`Generation completed in ${generationTimeMs}ms`);
              handleGenerationComplete?.(generationTimeMs);
            }

            setCurrentTaskId(null);
          } else if (data.status === "error") {
            console.log("❌ Task failed via polling:", data.error);

            // Parar polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            toast.error(data.error || "Image generation failed");
            setCurrentTaskId(null);
          } else if (data.status === "processing") {
            console.log("🔄 Task still processing...");
          } else if (data.status === "pending") {
            console.log("⏳ Task pending...");
          }
        } else {
          console.log(`Polling failed with status: ${response.status}`);
          if (response.status === 404) {
            console.log(
              "Task not found in database yet, continuing polling..."
            );
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Verificar imediatamente
    checkStatus();

    // Configurar polling a cada 2 segundos
    pollingIntervalRef.current = setInterval(checkStatus, 6000);

    // Timeout de segurança (5 minutos)
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        if (currentTaskId === taskId) {
          toast.error("Generation timeout. Please try again.");
          setCurrentTaskId(null);
        }
      }
    }, 30000); // 5 minutos
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
          <FormTextToImage
            onImageGenerated={handleImageGenerated}
            onGenerationStart={() => {
              const now = Date.now();
              handleGenerationStart(now);
              return now;
            }}
            onStartPolling={(taskId: string) => {
              const now = Date.now();
              startPolling(taskId, now);
            }}
            isGenerating={isGenerating}
          />
        </PageContainerLeft>

        {/* Right side - Preview */}
        <PageContainerRight>
          <ImagePreview
            isGenerating={isGenerating}
            generatedImage={generatedImage}
            currentTime={currentTime}
            onDownload={downloadImage}
          />
        </PageContainerRight>
      </PageContainerContent>

      {/* Histórico de Imagens */}
      <div className="mt-8">
        <ImageHistory refreshTrigger={historyRefreshTrigger} />
      </div>
    </PageContainer>
  );
}
