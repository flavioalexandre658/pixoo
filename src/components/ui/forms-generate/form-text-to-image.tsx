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

const formTextToImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string(),
  imagePublic: z.boolean(),
  seed: z.number().optional(),
  steps: z.number().min(1).max(50).optional(),
  guidance: z.number().min(1).max(20).optional(),
  width: z.number(),
  height: z.number(),
});

type FormTextToImageForm = z.infer<typeof formTextToImageSchema>;

const models = [
  {
    id: "flux-schnell",
    name: "Flux Schnell",
    credits: 0,
    badge: "free",
  },
  { id: "flux-dev", name: "Flux Dev", credits: 2 },
  { id: "flux-pro", name: "Flux Pro", credits: 5 },
  { id: "flux-pro-1.1", name: "Flux Pro 1.1", credits: 4 },
  { id: "flux-pro-1.1-ultra", name: "Flux Pro 1.1 Ultra", credits: 6 },
  { id: "flux-realism", name: "Flux Realism", credits: 3 },
  { id: "flux-kontext-pro", name: "Flux Kontext Pro", credits: 4 },
];

interface FormTextToImageProps {
  onImageGenerated: (imageUrl: string) => void;
  onGenerationStart?: () => void;
  onStartPolling?: (taskId: string) => void;
  onGenerationComplete?: () => void;
  isGenerating?: boolean;
}

export function FormTextToImage({
  onImageGenerated,
  onGenerationStart,
  onStartPolling,
  onGenerationComplete,
  isGenerating,
}: FormTextToImageProps) {
  const t = useTranslations("formTextToImage");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [startedGeneration, setStartedGeneration] = useState(isGenerating);

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
      model: "flux-schnell",
      imagePublic: false,
      width: 1024,
      height: 1024,
    },
  });

  const onSubmit = async (data: FormTextToImageForm) => {
    if (startedGeneration || isGenerating) {
      return false;
    }
    
    // Desabilita o botão imediatamente para evitar spam de cliques
    setStartedGeneration(true);
    
    try {
      toast.success(t("startingGeneration"));
      const response = await fetch("/api/text-to-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: data.prompt,
          model: data.model,
          width: dimension.width,
          height: dimension.height,
          aspectRatio: dimension.aspectRatio,
          seed: data.seed,
          steps: data.steps,
          guidance: data.guidance,
          imagePublic: data.imagePublic,
        }),
      });

      if (!response.ok) {
        setStartedGeneration(false);
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504
        ) {
          toast.error(
            "Service temporarily unavailable. The system is automatically retrying..."
          );
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate image");
        }
        return;
      }

      const result = await response.json();

      if (result.taskId) {
        toast.info(t("checkingStatus"));

        setGenerationProgress(25);
        onGenerationStart?.();

        // Usar apenas polling - mais confiável que SSE
        onStartPolling?.(result.taskId);
      } else if (result.success && result.imageUrl) {
        setStartedGeneration(false);
        onImageGenerated(result.imageUrl);
        toast.success(t("imageGeneratedSuccess"));
      } else {
        setStartedGeneration(false);
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      setStartedGeneration(false);
      console.error("Generation error:", error);
      if (error.message.includes("credits")) {
        toast.error(t("insufficientCredits"));
      } else if (error.message.includes("rate limit")) {
        toast.error(t("rateLimitExceeded"));
      } else {
        toast.error(
          error.message || t("generationFailed")
        );
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
                defaultValue="20"
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
                defaultValue="7.5"
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
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{model.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            {model.badge && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {model.badge}
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
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          {model.badge && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {model.badge}
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
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isGenerating || startedGeneration}
          >
            {isGenerating || startedGeneration ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t("generating")}
              </>
            ) : (
              <>
                <WandSparkles className="mr-2" />
                {t("generateImage")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
