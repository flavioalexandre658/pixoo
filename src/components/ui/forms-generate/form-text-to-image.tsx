"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings,
  WandSparkles,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DimensionSelector, Dimension } from "./dimension-selector";
import { useCredits } from "@/hooks/use-credits";
import { ModelCost } from "@/db/schema";
import { useAction } from "next-safe-action/hooks";
import { generateImage } from "@/actions/images/generate/generate-image.action";

const formTextToImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string(),
  imagePublic: z.boolean(),
  seed: z.number().optional(),
  steps: z.number().min(1).max(50).optional(),
  guidance: z.number().min(1).max(20).optional(),
  width: z.number().min(256).max(1440),
  height: z.number().min(256).max(1440),
});

type FormTextToImageForm = z.infer<typeof formTextToImageSchema>;

interface FormTextToImageProps {
  models: ModelCost[];
  onImageGenerated: (imageUrl: string) => void;
  onGenerationStart?: () => void;
  onStartPolling?: (
    taskId: string,
    reservationData?: { reservationId: string; modelId: string }
  ) => void;
  onGenerationComplete?: () => void;
  onGenerationButtonClick?: () => void;
  isGenerating?: boolean;
}

export function FormTextToImage({
  models,
  onImageGenerated,
  onGenerationStart,
  onStartPolling,
  onGenerationComplete,
  onGenerationButtonClick,
  isGenerating,
}: FormTextToImageProps) {
  const t = useTranslations("formTextToImage");
  const {
    credits,
    hasEnoughCredits,
    reserveCredits,
    fetchCredits,
    cancelReservation,
    isLoading: creditsLoading,
  } = useCredits();
  const [currentReservation, setCurrentReservation] = useState<{
    reservationId: string;
    cost: number;
  } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [startedGeneration, setStartedGeneration] = useState(isGenerating);
  const { executeAsync: executeGenerateImage } = useAction(generateImage);

  // Reset startedGeneration when generation is complete
  useEffect(() => {
    if (!isGenerating && startedGeneration) {
      setStartedGeneration(false);
      onGenerationComplete?.();
    }
  }, [isGenerating, startedGeneration, onGenerationComplete]);

  const [dimension, setDimension] = useState<Dimension>({
    aspectRatio: "1:1",
    width: 1024,
    height: 1024,
  });

  const form = useForm<FormTextToImageForm>({
    resolver: zodResolver(formTextToImageSchema),
    defaultValues: {
      prompt: "",
      model: "flux-pro",
      imagePublic: false,
      width: 1024,
      height: 1024,
    },
  });

  const onSubmit = async (data: FormTextToImageForm) => {
    if (startedGeneration || isGenerating) {
      return false;
    }

    // Desabilita o botão IMEDIATAMENTE para evitar spam de cliques
    setStartedGeneration(true);
    onGenerationButtonClick?.();

    // Verificar se o modelo selecionado requer créditos
    const selectedModel = models.find((m) => m.modelId === data.model);
    if (!selectedModel) {
      toast.error("Modelo não encontrado");
      setStartedGeneration(false);
      return false;
    }

    // Reservar créditos antes da geração (se necessário)
    let reservation = null;
    if (selectedModel.credits > 0) {
      reservation = await reserveCredits(selectedModel.modelId);
      if (!reservation) {
        toast.error(
          `Créditos insuficientes. Você precisa de ${selectedModel.credits} créditos para usar este modelo.`
        );
        setStartedGeneration(false);
        return false;
      }
      setCurrentReservation(reservation);
    }

    try {
      toast.success(t("startingGeneration"));
      console.log(data);
      const response = await executeGenerateImage({
        prompt: data.prompt,
        model: data.model,
        width: dimension.width,
        height: dimension.height,
        aspectRatio: dimension.aspectRatio,
        seed: data.seed ?? 1,
        steps: data.steps ?? 25,
        guidance: data.guidance ?? 3,
        imagePublic: data.imagePublic ?? false,
      });

      if (!response.serverError && response.data?.success) {
        setStartedGeneration(false);

        // Cancelar reserva em caso de erro na API (usuário não foi cobrado ainda)
        if (reservation) {
          await cancelReservation(
            reservation.reservationId,
            `Falha na API de geração - Status ${response.data?.status}`
          );
          setCurrentReservation(null);
        }

        if (response.data?.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (
          response.data?.status === 502 ||
          response.data?.status === 503 ||
          response.data?.status === 504
        ) {
          toast.error(
            "Service temporarily unavailable. The system is automatically retrying..."
          );
        } else if (response.data?.status === 400) {
          toast.error("Bad request. Please check your input.");
        } else {
          const errorData = response.data?.error;
          onGenerationComplete?.(); // Resetar estado isGenerating no componente pai
          throw new Error(errorData || "Failed to generate image");
        }
        return;
      }

      const result = response.data;

      if (result?.taskId) {
        toast.info(t("checkingStatus"));
        setGenerationProgress(25);
        onGenerationStart?.();

        // Usar apenas polling - mais confiável que SSE
        onStartPolling?.(
          result.taskId,
          reservation
            ? {
                reservationId: reservation.reservationId,
                modelId: selectedModel.modelId,
              }
            : undefined
        );
      } else if (result?.success && result?.imageUrl) {
        setStartedGeneration(false);

        // Nota: A confirmação de créditos será feita automaticamente via webhook
        // quando a imagem for processada com sucesso. Isso evita race conditions.
        if (reservation) {
          console.log(
            `✅ Imagem iniciada com sucesso. Créditos serão confirmados via webhook para reserva: ${reservation.reservationId}`
          );
          setCurrentReservation(null);
        }

        onImageGenerated(result.imageUrl);
        fetchCredits();
        toast.success(t("imageGeneratedSuccess"));
      } else {
        setStartedGeneration(false);

        // Cancelar reserva em caso de resposta inválida (usuário não foi cobrado ainda)
        if (reservation) {
          await cancelReservation(
            reservation.reservationId,
            "Resposta inválida do servidor"
          );
          setCurrentReservation(null);
        }

        onGenerationComplete?.(); // Resetar estado isGenerating no componente pai
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      setStartedGeneration(false);

      // Cancelar reserva em caso de erro (usuário não foi cobrado ainda)
      if (currentReservation) {
        await cancelReservation(
          currentReservation.reservationId,
          `Erro na geração: ${error.message}`
        );
        setCurrentReservation(null);
      }

      onGenerationComplete?.(); // Resetar estado isGenerating no componente pai
      console.error("Generation error:", error);
      if (error.message.includes("credits")) {
        toast.error(t("insufficientCredits"));
      } else if (error.message.includes("rate limit")) {
        toast.error(t("rateLimitExceeded"));
      } else {
        toast.error(error.message || t("generationFailed"));
      }
    }
  };

  const selectedModel = models.find((m) => m.id === form.watch("model"));

  const settingsContent = (
    <div className="space-y-6 pt-4">
      {/* Dimension Selector */}
      <div className="space-y-2">
        <Label>{t("aspectRatio")}</Label>
        <DimensionSelector
          value={dimension}
          onChange={(newDimension) => {
            setDimension(newDimension);
            form.setValue("width", newDimension.width);
            form.setValue("height", newDimension.height);
          }}
        />
      </div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 p-0 h-auto font-normal"
        >
          {t("advancedOptions")}
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {showAdvanced && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            {/* Seed */}
            <div className="space-y-2">
              <Label htmlFor="seed">{t("seed")}</Label>
              <Input
                id="seed"
                type="number"
                placeholder={t("seedPlaceholder")}
                defaultValue={"-1"}
                {...form.register("seed", { valueAsNumber: true })}
              />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <Label htmlFor="steps">{t("steps")}</Label>
              <Input
                id="steps"
                type="number"
                min="1"
                max="50"
                defaultValue="25"
                {...form.register("steps", { valueAsNumber: true })}
              />
            </div>

            {/* Guidance */}
            <div className="space-y-2">
              <Label htmlFor="guidance">{t("guidance")}</Label>
              <Input
                id="guidance"
                type="number"
                min="1"
                max="20"
                step="0.1"
                defaultValue="3"
                {...form.register("guidance", { valueAsNumber: true })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Public Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="imagePublic">{t("imagePublic")}</Label>
          <p className="text-sm text-muted-foreground">
            {t("imagePublicDescription")}
          </p>
        </div>
        <Switch
          id="imagePublic"
          checked={form.watch("imagePublic")}
          onCheckedChange={(checked) => form.setValue("imagePublic", checked)}
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            <div className="flex items-center gap-2">
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("advancedOptions")}</DialogTitle>
                  </DialogHeader>
                  {settingsContent}
                </DialogContent>
              </Dialog>
              <div className="flex-grow">
                <Select
                  value={form.watch("model")}
                  onValueChange={(value) => form.setValue("model", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.modelId} value={model.modelId}>
                        <div className="flex items-center justify-between w-full">
                          <span>{model.modelName}</span>
                          <div className="flex items-center gap-2 ml-2">
                            {!model.credits && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Free
                              </span>
                            )}
                            {model.credits > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {model.credits} credits
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block space-y-6">
            <div className="space-y-2">
              <Label htmlFor="model">{t("modelSelection")}</Label>
              <Select
                value={form.watch("model")}
                onValueChange={(value) => form.setValue("model", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.modelId} value={model.modelId}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.modelName}</span>
                        <div className="flex items-center gap-2 ml-2">
                          {!model.credits && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Free
                            </span>
                          )}
                          {model.credits > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {model.credits} credits
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModel && selectedModel.credits > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("costCredits", { credits: selectedModel.credits })}
                </p>
              )}
            </div>
            {settingsContent}
          </div>

          {/* Prompt (Common for both views) */}
          <div className="space-y-2">
            <Label htmlFor="prompt">{t("prompt")}</Label>
            <Textarea
              id="prompt"
              placeholder={t("promptPlaceholder")}
              className="min-h-[100px] resize-none"
              {...form.register("prompt")}
            />
            {form.formState.errors.prompt && (
              <p className="text-sm text-destructive">
                {form.formState.errors.prompt.message}
              </p>
            )}
          </div>

          {/* Generate Button (Common for both views) */}
          <div className="space-y-2">
            {selectedModel && selectedModel.credits > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Custo:</span>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  <span
                    className={
                      hasEnoughCredits(selectedModel.credits)
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {selectedModel.credits} créditos
                  </span>
                </div>
              </div>
            )}
            {credits && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saldo:</span>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  <span>{credits.balance} créditos</span>
                </div>
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={
                isGenerating ||
                startedGeneration ||
                creditsLoading ||
                (selectedModel &&
                  selectedModel.credits > 0 &&
                  !hasEnoughCredits(selectedModel.credits))
              }
            >
              {isGenerating || startedGeneration ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t("generating")}
                </>
              ) : selectedModel &&
                selectedModel.credits > 0 &&
                !hasEnoughCredits(selectedModel.credits) ? (
                <>
                  <Coins className="mr-2" />
                  Créditos insuficientes
                </>
              ) : (
                <>
                  <WandSparkles className="mr-2" />
                  {t("generateImage")}
                  {selectedModel && selectedModel.credits > 0 && (
                    <span className="ml-2 opacity-75">
                      (-{selectedModel.credits})
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
