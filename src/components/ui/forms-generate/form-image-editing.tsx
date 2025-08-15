"use client";

import { useState, useEffect, useRef } from "react";
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
  Upload,
  X,
  Image as ImageIcon,
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
import { useCredits } from "@/hooks/use-credits";
import { ModelCost } from "@/db/schema";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { generateImage } from "@/actions/images/generate/generate-image.action";
import { optimizePrompt } from "@/actions/prompt/optimize-prompt.action";
import { useSession } from "@/lib/auth-client";
import { useSubscription } from "@/contexts/subscription-context";
import { AuthRequiredModal } from "@/components/modals/auth-required-modal";
import { SubscriptionRequiredModal } from "@/components/modals/subscription-required-modal";
import { useParams } from "next/navigation";

const formImageEditingSchema = z.object({
  prompt: z.string().min(1, "editInstructionRequired"),
  model: z.string(),
  imagePublic: z.boolean(),
  promptUpsampling: z.boolean(),
  seed: z.number().optional(),
  aspectRatio: z.string().optional(),
  inputImage: z.string().min(1, "inputImageRequired"),
});

type FormImageEditingForm = z.infer<typeof formImageEditingSchema>;

interface FormImageEditingProps {
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

export function FormImageEditing({
  models,
  onGenerationStart,
  onStartPolling,
  onGenerationComplete,
  onGenerationButtonClick,
  isGenerating,
}: FormImageEditingProps) {
  const t = useTranslations("imageEditingForm");
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<string | null>(
    null
  );
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const { subscription } = useSubscription();
  const params = useParams();
  const locale = params.locale as string;
  const { executeAsync: executeGenerateImage } = useAction(generateImage);
  const { executeAsync: executeOptimizePrompt } = useAction(optimizePrompt);

  // Reset startedGeneration when generation is complete
  useEffect(() => {
    if (!isGenerating && startedGeneration) {
      setStartedGeneration(false);
      onGenerationComplete?.();
    }
  }, [isGenerating, startedGeneration, onGenerationComplete]);

  const form = useForm<FormImageEditingForm>({
    resolver: zodResolver(formImageEditingSchema),
    defaultValues: {
      prompt: "",
      model: "flux-kontext-pro",
      imagePublic: false,
      promptUpsampling: false,
      aspectRatio: "auto",
      inputImage: "",
    },
  });

  // Convert file to base64 directly
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Calculate aspect ratio from image dimensions
  const calculateAspectRatio = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const aspectWidth = width / divisor;
    const aspectHeight = height / divisor;

    // Map to common aspect ratios
    const ratio = aspectWidth / aspectHeight;
    if (Math.abs(ratio - 1) < 0.1) return "1:1";
    if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9";
    if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16";
    if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3";
    if (Math.abs(ratio - 3 / 4) < 0.1) return "3:4";
    if (Math.abs(ratio - 21 / 9) < 0.1) return "21:9";

    // Return custom ratio if no match
    return `${aspectWidth}:${aspectHeight}`;
  };

  // Get image dimensions from file
  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("pleaseUploadValidImage"));
      return;
    }

    // Validate file size (20MB limit as per BFL docs)
    if (file.size > 20 * 1024 * 1024) {
      toast.error(t("imageSizeMustBeLess"));
      return;
    }

    try {
      toast.info(t("processingImage"));

      // Get image dimensions and calculate aspect ratio
      const dimensions = await getImageDimensions(file);
      const aspectRatio = calculateAspectRatio(
        dimensions.width,
        dimensions.height
      );
      setDetectedAspectRatio(aspectRatio);

      // If current aspect ratio is "auto", keep it as auto
      // The actual aspect ratio will be used when submitting

      const base64Data = await fileToBase64(file);
      const imageUrl = URL.createObjectURL(file);

      setUploadedImage(imageUrl);
      form.setValue("inputImage", base64Data);
      toast.success(`${t("imageProcessedSuccessfully")} (${aspectRatio})`);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error(t("failedToProcessImage"));
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Remove uploaded image
  const removeUploadedImage = () => {
    setUploadedImage(null);
    setDetectedAspectRatio(null);
    form.setValue("inputImage", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Image data is now handled as base64, no external cleanup needed
  };

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
    const currentInputImage = form.getValues("inputImage");

    if (!currentPrompt.trim()) {
      toast.error(t("enterPromptFirst"));
      return;
    }

    if (!currentInputImage) {
      toast.error(t("uploadImageFirst"));
      return;
    }

    setIsOptimizingPrompt(true);
    toast.info(t("optimizingPromptForImageEditing"));

    try {
      const result = await executeOptimizePrompt({
        prompt: currentPrompt,
        model: currentModel,
        inputImage: currentInputImage,
        isImageEditing: true,
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

  const onSubmit = async (data: FormImageEditingForm) => {
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

    // Verificar se precisa de assinatura baseado no modelo
    if (!subscription) {
      // Para flux-schnell, sempre exigir assinatura no image editing
      // (diferente do text-to-image que permite créditos gratuitos)
      setShowPlansModal(true);
      return false;
    }

    // Verificar se o modelo não é flux-schnell e se o usuário tem assinatura
    if (data.model !== "flux-schnell" && !subscription) {
      setShowSubscriptionModal(true);
      return false;
    }

    // Desabilita o botão IMEDIATAMENTE para evitar spam de cliques
    setStartedGeneration(true);
    onGenerationButtonClick?.();

    // Reservar créditos antes da geração (se necessário)
    let reservation = null;
    // Para flux-schnell com assinatura ativa, não reservar créditos (é ilimitado)
    if (
      selectedModel.credits > 0 &&
      !(data.model === "flux-schnell" && subscription)
    ) {
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
      // Validate that if "auto" is selected, we have a detected aspect ratio
      if (data.aspectRatio === "auto" && !detectedAspectRatio) {
        toast.error(t("pleaseUploadImageForAuto"));
        setStartedGeneration(false);
        return false;
      }

      toast.success(t("startingGeneration"));
      console.log(data);

      // Use detected aspect ratio if "auto" is selected
      const finalAspectRatio =
        data.aspectRatio === "auto" && detectedAspectRatio
          ? detectedAspectRatio
          : data.aspectRatio;

      const response = await executeGenerateImage({
        prompt: data.prompt,
        model: data.model,
        inputImage: data.inputImage,
        aspectRatio: finalAspectRatio,
        seed: data.seed ?? 1,
        imagePublic: data.imagePublic ?? false,
        isPublic: data.imagePublic ?? false,
        promptUpsampling: data.promptUpsampling,
      });

      if (response.serverError || response.data?.error) {
        setStartedGeneration(false);

        // Cancelar reserva em caso de erro na API (usuário não foi cobrado ainda)
        if (reservation) {
          await cancelReservation(
            reservation.reservationId,
            t("apiEditingFailure")
          );
          setCurrentReservation(null);
        }

        const errorData = response.data?.error || response.serverError;
        onGenerationComplete?.(); // Resetar estado isGenerating no componente pai
        throw new Error(errorData || t("failedToEditImage"));
      }

      const result = response.data;

      if (result?.taskId) {
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
      } else if (result?.success) {
        setStartedGeneration(false);

        // Nota: A confirmação de créditos será feita automaticamente via webhook
        // quando a imagem for processada com sucesso. Isso evita race conditions.
        if (reservation) {
          console.log(
            `✅ ${t("editingCompletedSuccessfully")} ${
              reservation.reservationId
            }`
          );
          setCurrentReservation(null);
        }

        fetchCredits();
        toast.success(t("imageEditedSuccess"));
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

        onGenerationComplete?.(); // Resetar estado isGenerating no componente pai
        throw new Error(t("invalidServerResponse"));
      }
    } catch (error: any) {
      setStartedGeneration(false);

      // Cancelar reserva em caso de erro (usuário não foi cobrado ainda)
      if (currentReservation) {
        await cancelReservation(
          currentReservation.reservationId,
          `${t("editingError")} ${error.message}`
        );
        setCurrentReservation(null);
      }

      onGenerationComplete?.(); // Resetar estado isGenerating no componente pai
      console.error("Editing error:", error);
      if (error.message.includes("credits")) {
        toast.error(t("insufficientCredits"));
      } else if (error.message.includes("rate limit")) {
        toast.error(t("rateLimitExceeded"));
      } else {
        toast.error(error.message || t("editingFailed"));
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
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                {t("aspectRatio")}
              </Label>
              <Select
                value={form.watch("aspectRatio")}
                onValueChange={(value) => form.setValue("aspectRatio", value)}
              >
                <SelectTrigger className="border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-pixoo-purple/20 transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-pixoo-purple/20 bg-background/95 backdrop-blur-sm">
                  <SelectItem
                    value="auto"
                    className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10"
                  >
                    Auto{" "}
                    {detectedAspectRatio
                      ? `(${detectedAspectRatio})`
                      : t("autoDetectFromImage")}
                  </SelectItem>
                  <SelectItem
                    value="1:1"
                    className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10"
                  >
                    1:1 ({t("square")})
                  </SelectItem>
                  <SelectItem
                    value="16:9"
                    className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10"
                  >
                    16:9 ({t("landscape")})
                  </SelectItem>
                  <SelectItem
                    value="9:16"
                    className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10"
                  >
                    9:16 ({t("portrait")})
                  </SelectItem>
                  <SelectItem
                    value="4:3"
                    className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10"
                  >
                    4:3 ({t("standard")})
                  </SelectItem>
                  <SelectItem
                    value="3:4"
                    className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10"
                  >
                    3:4 ({t("portrait")})
                  </SelectItem>
                  <SelectItem
                    value="21:9"
                    className="hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10"
                  >
                    21:9 ({t("ultrawide")})
                  </SelectItem>
                </SelectContent>
              </Select>
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
                  <Dialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
                      >
                        <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                          <Settings className="h-4 w-4 text-pixoo-purple" />
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-pixoo-purple/20 bg-background/95 backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle className="bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                          {t("advancedOptions")}
                        </DialogTitle>
                      </DialogHeader>
                      {settingsContent}
                    </DialogContent>
                  </Dialog>
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
                                {model.credits > 0 && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Coins className="h-3 w-3 text-pixoo-purple" />
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
                              {model.credits > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Coins className="h-3 w-3 text-pixoo-purple" />
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
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3 text-pixoo-purple" />
                      {t("costCredits", { credits: selectedModel.credits })}
                    </p>
                  )}
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                  {t("inputImage")}
                </Label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
                    isDragging
                      ? "border-pixoo-magenta/50 bg-gradient-to-br from-pixoo-purple/10 to-pixoo-pink/10"
                      : "border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-br hover:from-pixoo-purple/5 hover:to-pixoo-pink/5"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {uploadedImage ? (
                    <div className="relative">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-pixoo-purple/20">
                        <Image
                          src={uploadedImage}
                          alt="Uploaded image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm"
                        onClick={removeUploadedImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {detectedAspectRatio && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded backdrop-blur-sm">
                          {detectedAspectRatio}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto w-12 h-12 mb-4 p-3 rounded-xl bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                        <ImageIcon className="w-full h-full text-pixoo-purple" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("dragDropImage")}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300"
                      >
                        <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 mr-2">
                          <Upload className="h-4 w-4 text-pixoo-purple" />
                        </div>
                        {t("selectImage")}
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("supportedFormats")}
                </p>
                {form.formState.errors.inputImage && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.inputImage.message}
                  </p>
                )}
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-pixoo-purple/20 hover:to-pixoo-pink/20 transition-all duration-300"
                      onClick={handleOptimizePrompt}
                      disabled={isOptimizingPrompt}
                      title={t("optimizePromptWithAI")}
                    >
                      {isOptimizingPrompt ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-pixoo-purple/30 border-t-pixoo-magenta" />
                      ) : (
                        <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                          <Zap className="h-3 w-3 text-pixoo-purple" />
                        </div>
                      )}
                    </Button>
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
                    !form.watch("inputImage") ||
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
                      {t("editImage")}
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
