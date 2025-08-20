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
  Coins
} from "lucide-react";
import { OptimizePromptButton } from "@/components/ui/optimize-prompt-button";
import { toast } from "sonner";
import { DimensionSelector, Dimension } from "./dimension-selector";
import { useCredits } from "@/hooks/use-credits";
import { ModelCost } from "@/db/schema";
import { useAction } from "next-safe-action/hooks";
import { generateImage } from "@/actions/images/generate/generate-image.action";
import { optimizePrompt } from "@/actions/prompt/optimize-prompt.action";
import { useSession } from "@/lib/auth-client";
import { AuthRequiredModal } from "@/components/modals/auth-required-modal";
import { SubscriptionRequiredModal } from "@/components/modals/subscription-required-modal";
import { useParams } from "next/navigation";
import { AdvancedSettingsDialog } from "./advanced-settings-dialog";

const formTextToImageSchema = z.object({
  prompt: z.string().min(1, "promptRequired"),
  model: z.string(),
  imagePublic: z.boolean(),
  promptUpsampling: z.boolean(),
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
  onGenerationComplete?: (timeMs: number) => void;
  onGenerationButtonClick?: () => void;
  isGenerating?: boolean;
  promptValue?: string;
  imagePreviewRef?: React.RefObject<HTMLDivElement | null>;
}

export function FormTextToImage({
  models,
  onImageGenerated,
  onGenerationStart,
  onStartPolling,
  onGenerationComplete,
  onGenerationButtonClick,
  isGenerating,
  promptValue,
  imagePreviewRef,
}: FormTextToImageProps) {
  const t = useTranslations("textToImageForm");
  const { hasEnoughCredits, reserveCredits, fetchCredits, cancelReservation } =
    useCredits();
  const [currentReservation, setCurrentReservation] = useState<{
    reservationId: string;
    cost: number;
  } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [startedGeneration, setStartedGeneration] = useState(isGenerating);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const { data: session } = useSession();
  //const { subscription } = useSubscription(); TODO: pode ser útil para verificar assinatura ativa
  const params = useParams();
  const locale = params.locale as string;
  const { executeAsync: executeGenerateImage } = useAction(generateImage);
  const { executeAsync: executeOptimizePrompt } = useAction(optimizePrompt);

  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );

  // Reset startedGeneration when generation is complete
  useEffect(() => {
    if (!isGenerating && startedGeneration) {
      const timeMs = generationStartTime ? Date.now() - generationStartTime : 0;
      onGenerationComplete?.(timeMs);
      setGenerationStartTime(null);
      triggerCreditsUpdate();
      setStartedGeneration(false);
    }
  }, [
    isGenerating,
    startedGeneration,
    onGenerationComplete,
    generationStartTime,
  ]);

  // Função para disparar evento de atualização de créditos
  const triggerCreditsUpdate = () => {
    // Disparar evento customizado para atualizar todos os componentes de créditos
    window.dispatchEvent(new CustomEvent("creditsUpdated"));
  };

  const [dimension, setDimension] = useState<Dimension>({
    aspectRatio: "1:1",
    width: 1024,
    height: 1024,
  });

  const form = useForm<FormTextToImageForm>({
    resolver: zodResolver(formTextToImageSchema),
    defaultValues: {
      prompt: "",
      model: "flux-dev",
      imagePublic: true,
      promptUpsampling: false,
      width: 1024,
      height: 1024,
    },
  });

  // Update prompt when promptValue prop changes
  useEffect(() => {
    if (promptValue !== undefined) {
      form.setValue("prompt", promptValue);
    }
  }, [promptValue, form]);

  // Handle prompt optimization
  const handleOptimizePrompt = async () => {
    // Verificar se o usuário está logado
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    //TODO: adicionar alguma trava nessa consulta (ex: cobrar 1 credito por uso)

    const currentPrompt = form.getValues("prompt");
    const currentModel = form.getValues("model");

    if (!currentPrompt.trim()) {
      toast.error(t("enterPromptFirst"));
      return;
    }

    setIsOptimizingPrompt(true);
    toast.info(t("optimizingPrompt"));

    try {
      const result = await executeOptimizePrompt({
        prompt: currentPrompt,
        model: currentModel,
      });

      if (result?.data?.success && result.data.optimizedPrompt) {
        form.setValue("prompt", result.data.optimizedPrompt);
        toast.success(t("promptOptimizedSuccessfully"));
      } else {
        toast.error(result?.data?.error || t("errorOptimizingPrompt"));
      }
    } catch (error) {
      console.error("Error optimizing prompt:", error);
      toast.error(t("errorOptimizingPrompt"));
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  // Função para fazer scroll para o preview da imagem em mobile
  const scrollToImagePreview = () => {
    if (imagePreviewRef?.current && window.innerWidth <= 768) {
      setTimeout(() => {
        imagePreviewRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  };

  const onSubmit = async (data: FormTextToImageForm) => {
    if (startedGeneration || isGenerating) {
      return false;
    }

    // Verificar se o usuário está logado
    if (!session) {
      setShowAuthModal(true);
      return false;
    }

    // Verificar se o modelo selecionado requer créditos
    const selectedModel = models.find((m) => m.modelId === data.model);
    if (!selectedModel) {
      toast.error(t("modelNotFound"));
      return false;
    }


    // Se tem assinatura, verificar créditos normais para modelos que custam créditos
    if (selectedModel.credits > 0) {
      if (!hasEnoughCredits(selectedModel.credits)) {
        setShowPlansModal(true);
        return false;
      }
    }


    // Desabilita o botão IMEDIATAMENTE para evitar spam de cliques
    setStartedGeneration(true);
    setGenerationStartTime(Date.now());
    onGenerationButtonClick?.();

    // Fazer scroll para o preview em mobile
    scrollToImagePreview();

    // Reservar créditos antes da geração (se necessário)
    let reservation = null;
    if (selectedModel.credits > 0) {
      // Para outros modelos, usar sistema de reserva normal
      reservation = await reserveCredits(selectedModel.modelId);
      if (!reservation) {
        toast.error(
          t("insufficientCreditsModel", { credits: selectedModel.credits })
        );
        onGenerationComplete?.(0);

        setShowSubscriptionModal(true);
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
        isPublic: data.imagePublic ?? false,
        promptUpsampling: data.promptUpsampling ?? false,
      });

      // Verificar se houve erro no servidor ou se a resposta não foi bem-sucedida
      if (response.serverError || (response.data && !response.data.success)) {
        setStartedGeneration(false);

        // Cancelar reserva em caso de erro na API (usuário não foi cobrado ainda)
        if (reservation) {
          await cancelReservation(
            reservation.reservationId,
            t("apiGenerationFailure")
          );
          setCurrentReservation(null);
        }

        const statusCode = Number(response.data?.status);
        if (statusCode === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (
          statusCode === 502 ||
          statusCode === 503 ||
          statusCode === 504
        ) {
          toast.error(
            "Service temporarily unavailable. The system is automatically retrying..."
          );
        } else if (statusCode === 400) {
          toast.error("Bad request. Please check your input.");
        } else {
          const errorData = response.data?.error;
          const timeMs = generationStartTime
            ? Date.now() - generationStartTime
            : 0;
          onGenerationComplete?.(timeMs); // Resetar estado isGenerating no componente pai
          setGenerationStartTime(null); // Reset do tempo de início
          throw new Error(errorData || t("failedToGenerateImage"));
        }
        return;
      }

      const result = response.data;

      // Verificar primeiro se a imagem foi gerada com sucesso (Together.ai)
      if (result?.success && result?.imageUrl) {
        setStartedGeneration(false);

        // Nota: Para flux-schnell, os créditos gratuitos são gastos automaticamente no backend
        // Para outros modelos, a confirmação de créditos será feita automaticamente via webhook
        // quando a imagem for processada com sucesso. Isso evita race conditions.
        if (reservation) {
          console.log(
            `✅ ${t("generationCompletedSuccessfully")} ${reservation.reservationId
            }`
          );
          setCurrentReservation(null);
        }

        onImageGenerated(result.imageUrl);
        const timeMs = generationStartTime
          ? Date.now() - generationStartTime
          : 0;
        onGenerationComplete?.(timeMs); // Resetar estado isGenerating no componente pai
        fetchCredits();
        triggerCreditsUpdate();
        toast.success(t("imageGeneratedSuccess"));
        setGenerationStartTime(null); // Reset do tempo de início
      } else if (result?.taskId) {
        // Fallback para modelos que usam BFL API (não Together.ai)
        toast.info(t("checkingStatus"));
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
      } else {
        setStartedGeneration(false);

        // Cancelar reserva em caso de resposta inválida (usuário não foi cobrado ainda)
        if (reservation) {
          await cancelReservation(
            reservation.reservationId,
            t("invalidServerResponse")
          );
          setCurrentReservation(null);
        }

        const timeMs = generationStartTime
          ? Date.now() - generationStartTime
          : 0;
        onGenerationComplete?.(timeMs); // Resetar estado isGenerating no componente pai
        triggerCreditsUpdate();
        setGenerationStartTime(null);
        throw new Error(t("invalidServerResponse"));
      }
    } catch (error: any) {
      setStartedGeneration(false);

      // Cancelar reserva em caso de erro (usuário não foi cobrado ainda)
      if (currentReservation) {
        await cancelReservation(
          currentReservation.reservationId,
          t("generationError", { error: error.message })
        );
        setCurrentReservation(null);
      }

      const timeMs = generationStartTime ? Date.now() - generationStartTime : 0;
      onGenerationComplete?.(timeMs); // Resetar estado isGenerating no componente pai
      triggerCreditsUpdate();
      setGenerationStartTime(null);
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
    <div className="space-y-6">
      {/* Advanced Options */}
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full p-3 h-auto font-medium border-dashed border-pixoo-purple/30 hover:border-solid hover:border-pixoo-magenta/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 hover:shadow-lg hover:shadow-pixoo-purple/20"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
              <Settings className="h-4 w-4 text-pixoo-purple" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
              {t("advancedOptions")}
            </span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 text-pixoo-magenta" />
          ) : (
            <ChevronDown className="h-4 w-4 text-pixoo-magenta" />
          )}
        </Button>

        {showAdvanced && (
          <div className="space-y-4 p-4 border border-pixoo-purple/20 rounded-xl bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5 backdrop-blur-sm shadow-lg">
            {/* Dimension Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                {t("aspectRatio")}
              </Label>
              <DimensionSelector
                value={dimension}
                onChange={(newDimension) => {
                  setDimension(newDimension);
                  form.setValue("width", newDimension.width);
                  form.setValue("height", newDimension.height);
                }}
              />
            </div>
            {/* Seed */}
            <div className="space-y-2">
              <Label
                htmlFor="seed"
                className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent"
              >
                {t("seed")}
              </Label>
              <Input
                id="seed"
                type="number"
                placeholder={t("seedPlaceholder")}
                defaultValue={"-1"}
                className="border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-pixoo-purple/20 transition-all duration-300"
                {...form.register("seed", { valueAsNumber: true })}
              />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <Label
                htmlFor="steps"
                className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent"
              >
                {t("steps")}
              </Label>
              <Input
                id="steps"
                type="number"
                min="1"
                max="50"
                defaultValue="25"
                className="border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-pixoo-purple/20 transition-all duration-300"
                {...form.register("steps", { valueAsNumber: true })}
              />
            </div>

            {/* Guidance */}
            <div className="space-y-2">
              <Label
                htmlFor="guidance"
                className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent"
              >
                {t("guidance")}
              </Label>
              <Input
                id="guidance"
                type="number"
                min="1"
                max="20"
                step="0.1"
                defaultValue="3.5"
                className="border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-pixoo-purple/20 transition-all duration-300"
                {...form.register("guidance", { valueAsNumber: true })}
              />
            </div>

            {/* Prompt Upsampling */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-pixoo-purple/10 to-pixoo-pink/10 border border-pixoo-purple/20">
              <div className="space-y-0.5">
                <Label
                  htmlFor="promptUpsampling"
                  className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent"
                >
                  {t("promptUpsampling")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("promptUpsamplingDescription")}
                </p>
              </div>
              <Switch
                id="promptUpsampling"
                {...form.register("promptUpsampling")}
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Public Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-pixoo-purple/10 to-pixoo-pink/10 border border-pixoo-purple/20">
        <div className="space-y-0.5">
          <Label
            htmlFor="imagePublic"
            className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent"
          >
            {t("imagePublic")}
          </Label>
          <p className="text-xs text-muted-foreground">
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
    <>
      <div className="relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-pixoo-pink/5 to-pixoo-magenta/10 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent -z-10" />

        {/* Floating decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-20 right-16 w-32 h-32 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-pink/15 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-gradient-to-br from-pixoo-magenta/10 to-pixoo-purple/10 rounded-full blur-lg animate-pulse delay-500" />

        <Card className="relative border-2 border-pixoo-purple/20 bg-background/95 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-pixoo-purple/10 transition-all duration-500 hover:border-pixoo-magenta/30">
          {/* Card background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-lg" />

          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pixoo-pink to-pixoo-magenta shadow-lg">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              </div>
              <span className="bg-gradient-to-r from-foreground via-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent">
                {t("title")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                <div className="flex items-center gap-2">
                  <AdvancedSettingsDialog
                    isOpen={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                  >
                    {settingsContent}
                  </AdvancedSettingsDialog>
                  <div className="flex-grow">
                    <Select
                      value={form.watch("model")}
                      onValueChange={(value) => form.setValue("model", value)}
                    >
                      <SelectTrigger className="border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-pixoo-purple/20 transition-all duration-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-pixoo-purple/20 bg-background/95 backdrop-blur-sm">
                        {models.map((model) => (
                          <SelectItem
                            key={model.modelId}
                            value={model.modelId}
                            className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{model.modelName}</span>
                              <div className="flex items-center gap-2 ml-2">
                                {model.credits > 0 ? (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Coins className="h-3 w-3 text-pixoo-purple" />
                                    {model.credits} {t("credits")}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Coins className="h-3 w-3 text-pixoo-purple" />
                                    Free
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
                  <Label
                    htmlFor="model"
                    className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent"
                  >
                    {t("modelSelection")}
                  </Label>
                  <Select
                    value={form.watch("model")}
                    onValueChange={(value) => form.setValue("model", value)}
                  >
                    <SelectTrigger className="border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-pixoo-purple/20 transition-all duration-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-pixoo-purple/20 bg-background/95 backdrop-blur-sm">
                      {models.map((model) => (
                        <SelectItem
                          key={model.modelId}
                          value={model.modelId}
                          className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{model.modelName}</span>
                            <div className="flex items-center gap-2 ml-2">
                              {model.credits > 0 ? (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Coins className="h-3 w-3 text-pixoo-purple" />
                                  {model.credits} {t("credits")}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Coins className="h-3 w-3 text-pixoo-purple" />
                                  Free
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedModel && selectedModel.credits > 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3 text-pixoo-purple" />
                      {t("costCredits", { credits: selectedModel.credits })}
                    </p>
                  )}

                  {selectedModel && selectedModel.credits <= 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3 text-pixoo-purple" />
                      Free
                    </p>
                  )}
                </div>
              </div>

              {/* Prompt (Common for both views) */}
              <div className="space-y-2">
                <Label
                  htmlFor="prompt"
                  className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent"
                >
                  {t("prompt")}
                </Label>
                <div className="relative">
                  <Textarea
                    id="prompt"
                    placeholder={t("promptPlaceholder")}
                    className="min-h-[100px] resize-none pr-12 border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-pixoo-purple/20 transition-all duration-300"
                    {...form.register("prompt")}
                  />
                  {form.watch("prompt")?.trim() && (
                    <OptimizePromptButton
                      onClick={handleOptimizePrompt}
                      isOptimizing={isOptimizingPrompt}
                      className="absolute top-2 right-2"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-pixoo-purple" />
                  {t("englishPromptsWork")}
                </p>
                {form.formState.errors.prompt && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.prompt.message}
                  </p>
                )}
              </div>

              {/* Desktop Settings - Moved to end */}
              <div className="hidden md:block">{settingsContent}</div>

              {/* Generate Button (Common for both views) */}
              <div className="space-y-3">
                {selectedModel && selectedModel.credits > 0 && (
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-gradient-to-r from-pixoo-purple/10 to-pixoo-pink/10 border border-pixoo-purple/20">
                    <span className="text-muted-foreground">{t("cost")}</span>
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                        <Coins className="h-3 w-3 text-pixoo-purple" />
                      </div>
                      <span
                        className={
                          hasEnoughCredits(selectedModel.credits)
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {selectedModel.credits} {t("credits")}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 font-semibold text-base bg-gradient-to-r from-pixoo-dark to-pixoo-purple hover:from-pixoo-purple hover:to-pixoo-dark text-white shadow-lg hover:shadow-xl hover:shadow-pixoo-purple/20 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  size="lg"
                  disabled={
                    isGenerating ||
                    startedGeneration ||
                    // creditsLoading ||
                    (selectedModel &&
                      selectedModel.credits > 0 &&
                      !hasEnoughCredits(selectedModel.credits))
                  }
                >
                  {isGenerating || startedGeneration ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3" />
                      {t("generating")}
                    </>
                  ) : selectedModel &&
                    selectedModel.credits > 0 &&
                    !hasEnoughCredits(selectedModel.credits) ? (
                    <>
                      <div className="p-1 rounded-md bg-white/20 mr-3">
                        <Coins className="h-4 w-4" />
                      </div>
                      {t("insufficientCreditsButton")}
                    </>
                  ) : (
                    <>
                      <div className="p-1 rounded-md bg-white/20 mr-3">
                        <WandSparkles className="h-4 w-4" />
                      </div>
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
      </div>

      {/* Modals */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        locale={locale}
      />
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        locale={locale}
      />
      <SubscriptionRequiredModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        locale={locale}
      />
    </>
  );
}
