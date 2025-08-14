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
import { useCredits } from "@/hooks/use-credits";
import toast from "react-hot-toast";
import { useAction } from "next-safe-action/hooks";
import { getImageByTaskId } from "@/actions/images/get-by-task-id/get-image-by-task-id.action";
import { ModelCost } from "@/db/schema";
interface TextToImage {
  models: ModelCost[];
}
export default function TextToImage({ models }: TextToImage) {
  const t = useTranslations("textToImage");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState<string | undefined>(undefined);

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImage(imageUrl);
    // Calcular tempo de geração e atualizar histórico
    const timeMs = generationStartTimeRef.current
      ? Date.now() - generationStartTimeRef.current
      : 0;
    handleGenerationComplete(timeMs);
  };
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWaitingWebhook, setIsWaitingWebhook] = useState(false);
  const generationStartTimeRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentReservation, setCurrentReservation] = useState<{
    reservationId: string;
    modelId: string;
  } | null>(null);
  const { refundCredits, cancelReservation, fetchCredits } = useCredits();

  const { executeAsync: executeGetImageByTaskId } = useAction(getImageByTaskId);

  // Contador de tempo em tempo real
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating && generationStartTimeRef.current) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - (generationStartTimeRef.current as number));
      }, 100); // Atualiza a cada 100ms para suavidade
    } else {
      setCurrentTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

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
    setIsWaitingWebhook(false);
    generationStartTimeRef.current = null;
    setCurrentTime(timeMs);
    // Atualizar histórico quando uma nova imagem for gerada
    setHistoryRefreshTrigger((prev) => prev + 1);
    // Atualizar créditos após a geração
    fetchCredits();
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
          mode: "cors",
          credentials: "omit",
        });
      } catch (corsError) {
        console.log(corsError);
        // Se falhar por CORS, tentar através de proxy
        response = await fetch(
          `/api/proxy-image?url=${encodeURIComponent(generatedImage)}`
        );
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
      toast.error("Failed to download image. Please try again.", {
        id: "download",
      });
    }
  };

  // Função para fazer polling do status da tarefa
  const startPolling = (
    taskId: string,
    reservationData?: { reservationId: string; modelId: string }
  ) => {
    console.log("Starting polling for task:", taskId);
    setCurrentTaskId(taskId);
    setIsWaitingWebhook(true);
    if (reservationData) {
      setCurrentReservation(reservationData);
    }

    // Limpar polling anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Função para verificar o status
    const checkStatus = async () => {
      try {
        console.log(`Polling status for task: ${taskId}`);
        const response = await executeGetImageByTaskId({ taskId });

        if (!response.serverError && response.data?.success) {
          const data = response.data?.data;
          console.log("Polling response:", {
            taskId,
            status: data?.status,
            hasImageUrl: !!data?.imageUrl,
          });

          if (data?.status === "ready" && data?.imageUrl) {
            console.log("✅ Task completed successfully via polling!");

            // Nota: A confirmação de créditos será feita automaticamente via webhook
            // quando a imagem for processada. Apenas atualizamos a UI aqui.
            if (currentReservation) {
              console.log(
                `✅ Imagem concluída via polling. Créditos serão confirmados via webhook para reserva: ${currentReservation.reservationId}`
              );
              // Atualizar saldo na UI (pode ter sido atualizado pelo webhook)
              await fetchCredits();
              console.log("✅ Credits balance updated in UI!");
              setCurrentReservation(null);
            }

            // Parar polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Parar de aguardar webhook
            setIsWaitingWebhook(false);

            // Atualizar UI
            handleImageGenerated(data.imageUrl);
            toast.success("Image generated successfully!");

            console.log(generationStartTimeRef.current);
            // Calcular tempo de geração
            if (generationStartTimeRef.current) {
              const generationTimeMs =
                Date.now() - (generationStartTimeRef.current as number);
              console.log(`Generation completed in ${generationTimeMs}ms`);
              handleGenerationComplete?.(generationTimeMs);
            }

            setCurrentTaskId(null);
          } else if (data?.status === "error") {
            console.log(
              "❌ Task failed via polling:",
              response.data?.errors?._form[0]
            );

            // Cancelar reserva se houver uma ativa (usuário não foi cobrado ainda)
            if (currentReservation?.reservationId) {
              try {
                await cancelReservation(
                  currentReservation.reservationId,
                  `Falha na geração - ${currentReservation.modelId}`
                );
                console.log("✅ Reservation cancelled successfully!");
                // Atualizar saldo na UI
                await fetchCredits();
                console.log(
                  "✅ Credits balance updated in UI after cancellation!"
                );
              } catch (error) {
                console.error("❌ Error cancelling reservation:", error);
              }
              setCurrentReservation(null);
            }

            // Parar polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Parar de aguardar webhook
            setIsWaitingWebhook(false);

            toast.error(
              response.data?.errors?._form[0] || "Image generation failed"
            );
            setIsGenerating(false);
            setCurrentTaskId(null);
          } else if (data?.status === "processing") {
            console.log("🔄 Task still processing...");
          } else if (data?.status === "pending") {
            console.log("⏳ Task pending...");
          }
        } else {
          console.log(
            `Polling failed with status: ${response.data?.errors?._form}`
          );
          if (response.serverError) {
            console.log(
              "Task not found in database yet, continuing polling..."
            );
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        // Em caso de erro de rede ou outro erro crítico, parar polling e resetar estado
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;

          // Cancelar reserva se houver uma ativa (usuário não foi cobrado ainda)
          if (currentReservation?.reservationId) {
            try {
              await cancelReservation(
                currentReservation.reservationId,
                `Erro de rede na geração - ${currentReservation.modelId}`
              );
              console.log("✅ Reservation cancelled due to network error!");
              // Atualizar saldo na UI
              await fetchCredits();
              console.log(
                "✅ Credits balance updated in UI after network error refund!"
              );
            } catch (error) {
              console.error("❌ Error refunding credits:", error);
            }
            setCurrentReservation(null);
          }

          toast.error("Network error during generation. Please try again.");
          setIsGenerating(false);
          setIsWaitingWebhook(false);
          setCurrentTaskId(null);
        }
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
          // Reembolsar créditos em caso de timeout
          if (currentReservation) {
            const modelCosts = {
              "flux-schnell": 1,
              "flux-dev": 10,
              "flux-pro": 25,
              "flux-pro-1.1": 40,
            };
            const cost =
              modelCosts[
                currentReservation.modelId as keyof typeof modelCosts
              ] || 10;
            refundCredits(
              cost,
              `Timeout na geração - ${currentReservation.modelId}`,
              taskId
            )
              .then(async () => {
                console.log("✅ Credits refunded due to timeout!");
                await fetchCredits();
                console.log(
                  "✅ Credits balance updated in UI after timeout refund!"
                );
              })
              .catch((error) =>
                console.error("❌ Error refunding credits:", error)
              );
            setCurrentReservation(null);
          }

          toast.error("Generation timeout. Please try again.");
          setIsGenerating(false);
          setIsWaitingWebhook(false);
          setCurrentTaskId(null);
        }
      }
    }, 30000); // 5 minutos
  };

  return (
    <PageContainer>
      <PageContainerHeader>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </PageContainerHeader>
      <PageContainerContent>
        {/* Left side - Form */}
        <PageContainerLeft>
          <FormTextToImage
            models={models}
            onImageGenerated={handleImageGenerated}
            onGenerationStart={() => {
              const now = Date.now();
              handleGenerationStart(now);
              return now;
            }}
            onStartPolling={(
              taskId: string,
              reservationData?: { reservationId: string; modelId: string }
            ) => {
              startPolling(taskId, reservationData);
            }}
            onGenerationComplete={(timeMs: number) => {
              handleGenerationComplete(timeMs);
            }}
            onGenerationButtonClick={() => {
              const now = Date.now();
              setIsGenerating(true);
              handleGenerationStart(now);
            }}
            isGenerating={isGenerating}
            promptValue={promptValue}
          />
        </PageContainerLeft>

        {/* Right side - Preview */}
        <PageContainerRight>
          <ImagePreview
            isGenerating={isGenerating}
            isWaitingWebhook={isWaitingWebhook}
            generatedImage={generatedImage}
            currentTime={currentTime}
            onDownload={downloadImage}
          />
        </PageContainerRight>
      </PageContainerContent>

      {/* Histórico de Imagens */}
      <div className="mt-8">
        <ImageHistory
          refreshTrigger={historyRefreshTrigger}
          onPromptReuse={(prompt: string) => {
            setPromptValue(prompt);
            // Reset promptValue after a short delay to allow for future reuses
            setTimeout(() => setPromptValue(undefined), 100);
          }}
        />
      </div>
    </PageContainer>
  );
}
