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
  Zap,
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
import { optimizePrompt } from "@/actions/prompt/optimize-prompt.action";
import { getUserFreeCredits } from "@/actions/credits/get/get-user-free-credits.action";
import { useSession } from "@/lib/auth-client";
import { useSubscription } from "@/contexts/subscription-context";
import { AuthRequiredModal } from "@/components/modals/auth-required-modal";
import { SubscriptionRequiredModal } from "@/components/modals/subscription-required-modal";
import { useParams } from "next/navigation";

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
}: FormTextToImageProps) {
  const t = useTranslations("textToImageForm");
  const {
    credits,
    hasEnoughCredits,
    reserveCredits,
    fetchCredits,
    cancelReservation,
  } = useCredits();
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
  const { subscription } = useSubscription();
  const params = useParams();
  const locale = params.locale as string;
  const { executeAsync: executeGenerateImage } = useAction(generateImage);
  const { executeAsync: executeOptimizePrompt } = useAction(optimizePrompt);
  const { executeAsync: executeGetUserFreeCredits } = useAction(getUserFreeCredits);

  // Estado para créditos gratuitos
  const [freeCredits, setFreeCredits] = useState<{
    freeCreditsBalance: number;
    hasActiveSubscription: boolean;
    canUseFreeCredits: boolean;
  } | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);

  // Reset startedGeneration when generation is complete
  useEffect(() => {
    if (!isGenerating && startedGeneration) {
      const timeMs = generationStartTime ? Date.now() - generationStartTime : 0;
      onGenerationComplete?.(timeMs);
      setGenerationStartTime(null);
      triggerCreditsUpdate();
      setStartedGeneration(false);
    }
  }, [isGenerating, startedGeneration, onGenerationComplete, generationStartTime]);

  // Função para buscar créditos gratuitos
  const fetchFreeCredits = async () => {
    if (!session?.user?.id) return;

    try {
      const result = await executeGetUserFreeCredits({});
      if (result?.data?.success) {
        setFreeCredits(result.data.data || null);
      }
    } catch (error) {
      console.error('Erro ao buscar créditos gratuitos:', error);
    }
  };

  // Função para disparar evento de atualização de créditos
  const triggerCreditsUpdate = () => {
    // Disparar evento customizado para atualizar todos os componentes de créditos
    window.dispatchEvent(new CustomEvent('creditsUpdated'));
  };

  // Buscar créditos gratuitos quando a sessão estiver disponível
  useEffect(() => {
    fetchFreeCredits();
  }, [session?.user?.id]);

  const [dimension, setDimension] = useState<Dimension>({
    aspectRatio: "1:1",
    width: 1024,
    height: 1024,
  });

  const form = useForm<FormTextToImageForm>({
    resolver: zodResolver(formTextToImageSchema),
    defaultValues: {
      prompt: "",
      model: "flux-schnell",
      imagePublic: false,
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

    // Verificar se o usuário tem assinatura ativa
    if (!subscription) {
      setShowSubscriptionModal(true);
      return;
    }

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

    // Verificar se o usuário tem assinatura ativa ou créditos gratuitos para flux-schnell
    if (!subscription) {
      // Se for flux-schnell, verificar se tem créditos gratuitos
      if (data.model === "flux-schnell") {
        if (!freeCredits || freeCredits.freeCreditsBalance <= 0) {
          setShowPlansModal(true);
          return false;
        }
      } else {
        // Para outros modelos, sempre exigir assinatura
        setShowSubscriptionModal(true);
        return false;
      }
    }

    // Para outros modelos que não são flux-schnell, sempre exigir assinatura
    if (data.model !== "flux-schnell" && !subscription) {
      setShowSubscriptionModal(true);
      return false;
    }

    // Desabilita o botão IMEDIATAMENTE para evitar spam de cliques
    setStartedGeneration(true);
    setGenerationStartTime(Date.now());
    onGenerationButtonClick?.();

    // Reservar créditos antes da geração (se necessário)
    let reservation = null;

    // Se for flux-schnell, verificar se precisa de créditos gratuitos
    if (data.model === "flux-schnell") {
      // Se não tem assinatura ativa, verificar créditos gratuitos
      if (!subscription) {
        if (!freeCredits || freeCredits.freeCreditsBalance <= 0) {
          toast.error(t("insufficientFreeCredits"));
          setStartedGeneration(false);
          return false;
        }
      }
      // Para flux-schnell, não fazemos reserva, gastamos diretamente após sucesso (ou é ilimitado com assinatura)
    } else if (selectedModel.credits > 0) {
      // Para outros modelos, usar sistema de reserva normal
      reservation = await reserveCredits(selectedModel.modelId);
      if (!reservation) {
        toast.error(
          t("insufficientCreditsModel", { credits: selectedModel.credits })
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
          const timeMs = generationStartTime ? Date.now() - generationStartTime : 0;
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
            `✅ ${t("generationCompletedSuccessfully")} ${reservation.reservationId}`
          );
          setCurrentReservation(null);
        }

        onImageGenerated(result.imageUrl);
        const timeMs = generationStartTime ? Date.now() - generationStartTime : 0;
        onGenerationComplete?.(timeMs); // Resetar estado isGenerating no componente pai
        fetchCredits();
        fetchFreeCredits(); // Atualizar créditos gratuitos também
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

        const timeMs = generationStartTime ? Date.now() - generationStartTime : 0;
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
          className="flex items-center justify-between w-full p-3 h-auto font-medium border-dashed hover:border-solid transition-all duration-200 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>{t("advancedOptions")}</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {showAdvanced && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
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
                defaultValue="3.5"
                {...form.register("guidance", { valueAsNumber: true })}
              />
            </div>

            {/* Prompt Upsampling */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promptUpsampling">{t("promptUpsampling")}</Label>
                <p className="text-sm text-muted-foreground">
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
    <>
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
                              {model.credits > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {model.credits} {t("credits")}
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
                            {model.credits > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {model.credits} {t("credits")}
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
            </div>

            {/* Prompt (Common for both views) */}
            <div className="space-y-2">
              <Label htmlFor="prompt">{t("prompt")}</Label>
              <div className="relative">
                <Textarea
                  id="prompt"
                  placeholder={t("promptPlaceholder")}
                  className="min-h-[100px] resize-none pr-12"
                  {...form.register("prompt")}
                />
                {form.watch("prompt")?.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={handleOptimizePrompt}
                    disabled={isOptimizingPrompt}
                    title={t("optimizePromptWithAI")}
                  >
                    {isOptimizingPrompt ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                💡 {t("englishPromptsWork")}
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
            <div className="space-y-2">
              {selectedModel && selectedModel.credits > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("cost")}</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    <span
                      className={
                        hasEnoughCredits(selectedModel.credits)
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {selectedModel.credits} {t("credits")}
                    </span>
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
                  // creditsLoading ||
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
                    {t("insufficientCreditsButton")}
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
