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
  Image as ImageIcon
} from "lucide-react";

import { toast } from "sonner";
import { useCredits } from "@/hooks/use-credits";

import { ModelCost } from "@/db/schema";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { generateImage } from "@/actions/images/generate/generate-image.action";

import { proxyImage } from "@/actions/proxy-image/proxy-image.action";

import { useSession } from "@/lib/auth-client";
import { AuthRequiredModal } from "@/components/modals/auth-required-modal";
import { SubscriptionRequiredModal } from "@/components/modals/subscription-required-modal";
import { useParams, useRouter } from "next/navigation";
import { AdvancedSettingsDialog } from "./advanced-settings-dialog";

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
  imagePreviewRef?: React.RefObject<HTMLDivElement | null>;
  preloadedImageUrl?: string | null;
  preloadedPrompt?: string | null;
}

export function FormImageEditing({
  models,
  onGenerationStart,
  onStartPolling,
  onGenerationComplete,
  onGenerationButtonClick,
  isGenerating,
  imagePreviewRef,
  preloadedImageUrl,
  preloadedPrompt,
}: FormImageEditingProps) {
  const t = useTranslations("imageEditingForm");
  const { hasEnoughCredits, reserveCredits, fetchCredits, cancelReservation } =
    useCredits();
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

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  //const { subscription } = useSubscription(); TODO: pode ser util para verificar se o usuario tem assinatura ativa

  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  // Função para disparar evento de atualização de créditos
  const triggerCreditsUpdate = () => {
    // Disparar evento customizado para atualizar todos os componentes de créditos
    window.dispatchEvent(new CustomEvent("creditsUpdated"));
  };

  const { executeAsync: executeGenerateImage } = useAction(generateImage);

  const { executeAsync: executeProxyImage } = useAction(proxyImage);

  // Reset startedGeneration when generation is complete
  useEffect(() => {
    if (!isGenerating && startedGeneration) {
      setStartedGeneration(false);
      triggerCreditsUpdate();
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

  // Convert file to base64 with better error handling and compression
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Enhanced function to handle iPhone images and other problematic formats
  const processImageFile = async (
    file: File
  ): Promise<{
    base64: string;
    dimensions: { width: number; height: number };
  }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      img.onload = () => {
        try {
          // Get original dimensions
          const originalWidth = img.width;
          const originalHeight = img.height;

          // Calculate compression if image is too large
          const maxDimension = 2048; // Reasonable max for editing
          const maxFileSize = 5 * 1024 * 1024; // 5MB max

          let targetWidth = originalWidth;
          let targetHeight = originalHeight;
          let quality = 0.9;

          // Resize if dimensions are too large
          if (originalWidth > maxDimension || originalHeight > maxDimension) {
            const aspectRatio = originalWidth / originalHeight;
            if (originalWidth > originalHeight) {
              targetWidth = maxDimension;
              targetHeight = maxDimension / aspectRatio;
            } else {
              targetHeight = maxDimension;
              targetWidth = maxDimension * aspectRatio;
            }
          }

          // Reduce quality for very large files
          if (file.size > maxFileSize) {
            quality = 0.7;
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Draw image with potential resizing
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Convert to JPEG (universally supported)
          const base64 = canvas.toDataURL("image/jpeg", quality);

          resolve({
            base64,
            dimensions: { width: targetWidth, height: targetHeight },
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      // Create object URL for the file (works with HEIC on supported browsers)
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      // Cleanup object URL after loading
      const originalOnload = img.onload;
      img.onload = (event: Event) => {
        URL.revokeObjectURL(objectUrl);
        if (originalOnload && typeof originalOnload === "function") {
          originalOnload.call(img, event);
        }
      };
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

  // Get image dimensions from URL
  const getImageDimensionsFromUrl = (
    imageUrl: string
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
    });
  };

  // Compress image to reduce base64 size
  const compressImage = (
    imageUrl: string,
    maxWidth: number = 512,
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        // Calculate new dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let newWidth = img.width;
        let newHeight = img.height;

        if (img.width > maxWidth) {
          newWidth = maxWidth;
          newHeight = maxWidth / aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
    });
  };

  // Enhanced file upload handler
  const handleFileUpload = async (file: File) => {
    // Enhanced file type validation
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic", // iPhone format
      "image/heif", // iPhone format
    ];

    const isValidType = validTypes.some(
      (type) =>
        file.type === type ||
        file.name.toLowerCase().endsWith(type.split("/")[1])
    );

    if (!isValidType) {
      toast.error(t("pleaseUploadValidImage"));
      return;
    }

    // Increased size limit for iPhone photos but with compression
    if (file.size > 50 * 1024 * 1024) {
      // 50MB absolute limit
      toast.error(t("imageSizeMustBeLess"));
      return;
    }

    try {
      toast.info(t("processingImage"));

      // Use enhanced processing for better iPhone compatibility
      const { base64, dimensions } = await processImageFile(file);

      // Calculate aspect ratio from processed dimensions
      const aspectRatio = calculateAspectRatio(
        dimensions.width,
        dimensions.height
      );
      setDetectedAspectRatio(aspectRatio);

      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Set form data
      form.setValue("inputImage", base64);

      toast.success(`${t("imageProcessedSuccessfully")} (${aspectRatio})`);

      // Log success for debugging
      console.log("Image processed successfully:", {
        originalSize: file.size,
        processedSize: base64.length,
        dimensions,
        aspectRatio,
        fileType: file.type,
      });
    } catch (error) {
      console.error("Error processing image:", error);

      // Fallback: try basic processing
      try {
        toast.info("Tentando processamento alternativo...");

        const base64Data = await fileToBase64(file);
        const imageUrl = URL.createObjectURL(file);

        // Try to get dimensions with fallback
        try {
          const dimensions = await getImageDimensions(file);
          const aspectRatio = calculateAspectRatio(
            dimensions.width,
            dimensions.height
          );
          setDetectedAspectRatio(aspectRatio);
        } catch (dimensionsError) {

          console.warn("Could not detect dimensions, using default", dimensionsError);
          setDetectedAspectRatio("1:1"); // Safe fallback
        }

        setUploadedImage(imageUrl);
        form.setValue("inputImage", base64Data);

        toast.success(t("imageProcessedSuccessfully"));
      } catch (fallbackError) {
        console.error("Fallback processing also failed:", fallbackError);
        toast.error(
          "Não foi possível processar esta imagem. Tente converter para JPEG primeiro."
        );
      }
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

  // Função para remover query parameters da URL
  const removeImageQueryParam = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("imageUrl");
      url.searchParams.delete("prompt");

      // Usar replace para não adicionar uma nova entrada no histórico
      router.replace(url.pathname + url.search, { scroll: false });
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

    if (selectedModel.credits > 0) {
      if (!hasEnoughCredits(selectedModel.credits)) {
        setShowPlansModal(true);
        return false;
      }
    }

    // Desabilita o botão IMEDIATAMENTE para evitar spam de cliques
    setStartedGeneration(true);
    // Remover esta linha que causa erro:
    // setGenerationStartTime(Date.now());
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
        onGenerationComplete?.();

        setShowSubscriptionModal(true);
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
        triggerCreditsUpdate();
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
            `✅ ${t("editingCompletedSuccessfully")} ${reservation.reservationId
            }`
          );
          setCurrentReservation(null);
        }

        fetchCredits();
        triggerCreditsUpdate();
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
        triggerCreditsUpdate();
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
      triggerCreditsUpdate();
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

  // Carregar imagem e prompt pré-definidos
  useEffect(() => {
    if (preloadedImageUrl) {
      setUploadedImage(preloadedImageUrl);

      // Verificar se é uma URL válida antes de tentar fazer proxy
      try {
        const url = new URL(preloadedImageUrl);

        // Se for uma URL externa, usar a action proxy-image
        if (url.protocol === "http:" || url.protocol === "https:") {
          executeProxyImage({ url: preloadedImageUrl })
            .then(async (result) => {
              if (result?.data?.success && result.data.imageData) {
                form.setValue("inputImage", result.data.imageData);

                // Detectar proporção da imagem carregada
                try {
                  const dimensions = await getImageDimensionsFromUrl(
                    result.data.imageData
                  );
                  const aspectRatio = calculateAspectRatio(
                    dimensions.width,
                    dimensions.height
                  );
                  setDetectedAspectRatio(aspectRatio);
                  toast.success(
                    `Imagem carregada com sucesso! (${aspectRatio})`
                  );

                  // Remover query parameter após carregar com sucesso
                  removeImageQueryParam();
                } catch (dimensionError) {
                  console.error("Erro ao detectar dimensões:", dimensionError);
                  toast.success("Imagem carregada com sucesso!");

                  // Remover query parameter mesmo com erro de dimensão
                  removeImageQueryParam();
                }
              } else {
                // Em caso de erro, usar a URL diretamente como fallback
                form.setValue("inputImage", preloadedImageUrl);

                // Tentar detectar proporção mesmo com fallback
                try {
                  const dimensions = await getImageDimensionsFromUrl(
                    preloadedImageUrl
                  );
                  const aspectRatio = calculateAspectRatio(
                    dimensions.width,
                    dimensions.height
                  );
                  setDetectedAspectRatio(aspectRatio);
                } catch (dimensionError) {
                  console.error(
                    "Erro ao detectar dimensões do fallback:",
                    dimensionError
                  );
                }

                toast.warning(
                  result?.data?.error ||
                  "Erro ao carregar imagem, usando URL diretamente"
                );

                // Remover query parameter mesmo com fallback
                removeImageQueryParam();
              }
            })
            .catch(async (error) => {
              console.error("Erro ao fazer proxy da imagem:", error);
              // Em caso de erro, usar a URL diretamente como fallback
              form.setValue("inputImage", preloadedImageUrl);

              // Tentar detectar proporção mesmo com erro
              try {
                const dimensions = await getImageDimensionsFromUrl(
                  preloadedImageUrl
                );
                const aspectRatio = calculateAspectRatio(
                  dimensions.width,
                  dimensions.height
                );
                setDetectedAspectRatio(aspectRatio);
              } catch (dimensionError) {
                console.error("Erro ao detectar dimensões:", dimensionError);
              }

              toast.warning("Erro ao carregar imagem, usando URL diretamente");

              // Remover query parameter mesmo com erro
              removeImageQueryParam();
            });
        } else {
          // Para URLs locais ou data URLs, usar diretamente
          form.setValue("inputImage", preloadedImageUrl);

          // Detectar proporção para URLs locais/data URLs
          getImageDimensionsFromUrl(preloadedImageUrl)
            .then((dimensions) => {
              const aspectRatio = calculateAspectRatio(
                dimensions.width,
                dimensions.height
              );
              setDetectedAspectRatio(aspectRatio);

              // Remover query parameter após carregar com sucesso
              removeImageQueryParam();
            })
            .catch((error) => {
              console.error("Erro ao detectar dimensões:", error);

              // Remover query parameter mesmo com erro
              removeImageQueryParam();
            });
        }
      } catch (urlError) {
        console.error("URL inválida:", urlError);
        // Se a URL for inválida, tentar usar como está
        form.setValue("inputImage", preloadedImageUrl);
        toast.error("URL de imagem inválida");

        // Remover query parameter mesmo com URL inválida
        removeImageQueryParam();
      }
    }

    if (preloadedPrompt) {
      form.setValue("prompt", preloadedPrompt);
    }
  }, [preloadedImageUrl, preloadedPrompt, form, executeProxyImage, router]);

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
                  className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${isDragging
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
                          className="object-contain"
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
                    className="min-h-[100px] resize-none border-pixoo-purple/30 focus:border-pixoo-magenta/50 focus:ring-pixoo-purple/20 transition-all duration-300"
                    {...form.register("prompt")}
                  />
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
                      {t("editing")}
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
