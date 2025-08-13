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

const formImageEditingSchema = z.object({
  prompt: z.string().min(1, "Edit instruction is required"),
  model: z.string(),
  imagePublic: z.boolean(),
  promptUpsampling: z.boolean(),
  seed: z.number().optional(),
  aspectRatio: z.string().optional(),
  inputImage: z.string().min(1, "Input image is required"),
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
  const t = useTranslations("formImageEditing");
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      toast.error("Please upload a valid image file");
      return;
    }

    // Validate file size (20MB limit as per BFL docs)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image size must be less than 20MB");
      return;
    }

    try {
      toast.info("Processing image...");

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
      toast.success(`Image processed successfully (${aspectRatio})`);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
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
    const currentPrompt = form.getValues("prompt");
    const currentModel = form.getValues("model");
    const currentInputImage = form.getValues("inputImage");

    if (!currentPrompt.trim()) {
      toast.error("Digite um prompt primeiro");
      return;
    }

    if (!currentInputImage) {
      toast.error("Faça upload de uma imagem primeiro");
      return;
    }

    setIsOptimizingPrompt(true);
    toast.info("Otimizando prompt para edição de imagem...");

    try {
      const result = await executeOptimizePrompt({
        prompt: currentPrompt,
        model: currentModel,
        inputImage: currentInputImage,
        isImageEditing: true,
      });

      if (result?.data?.success && result.data.optimizedPrompt) {
        form.setValue("prompt", result.data.optimizedPrompt);
        toast.success("Prompt otimizado com sucesso para edição de imagem!");
      } else {
        toast.error(result?.data?.error || "Erro ao otimizar prompt");
      }
    } catch (error) {
      console.error("Error optimizing prompt:", error);
      toast.error("Erro ao otimizar prompt");
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  const onSubmit = async (data: FormImageEditingForm) => {
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
      // Validate that if "auto" is selected, we have a detected aspect ratio
      if (data.aspectRatio === "auto" && !detectedAspectRatio) {
        toast.error(
          "Please upload an image to use auto aspect ratio detection"
        );
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
            "Falha na API de edição"
          );
          setCurrentReservation(null);
        }

        const errorData = response.data?.error || response.serverError;
        onGenerationComplete?.(); // Resetar estado isGenerating no componente pai
        throw new Error(errorData || "Failed to edit image");
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
            `✅ Edição concluída com sucesso. Créditos serão confirmados via webhook para reserva: ${reservation.reservationId}`
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
          `Erro na edição: ${error.message}`
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
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label>{t("aspectRatio")}</Label>
              <Select
                value={form.watch("aspectRatio")}
                onValueChange={(value) => form.setValue("aspectRatio", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Auto{" "}
                    {detectedAspectRatio
                      ? `(${detectedAspectRatio})`
                      : "(detect from image)"}
                  </SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                  <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Prompt Upsampling */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promptUpsampling">Prompt Upsampling</Label>
                <p className="text-sm text-muted-foreground">
                  Modifica automaticamente o prompt para geração mais criativa
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
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>{t("inputImage")}</Label>
            {!uploadedImage ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t("dragDropImage")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("supportedFormats")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {t("selectImage")}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            ) : (
              <div className="relative border rounded-lg overflow-hidden">
                <div className="aspect-video relative">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded image"
                    fill
                    className="object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeUploadedImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {form.formState.errors.inputImage && (
              <p className="text-sm text-destructive">
                {form.formState.errors.inputImage.message}
              </p>
            )}
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
                  title="Otimizar prompt com IA"
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
              {t("promptDescription")} • Prompts em inglês geram melhores
              resultados.
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
          <div>
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
                !form.watch("inputImage") ||
                (selectedModel &&
                  selectedModel.credits > 0 &&
                  !hasEnoughCredits(selectedModel.credits))
              }
            >
              {isGenerating || startedGeneration ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t("editing")}
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
  );
}
