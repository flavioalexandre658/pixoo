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
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const textToImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string(),
  aspectRatio: z.string(),
  imagePublic: z.boolean(),
  seed: z.number().optional(),
  steps: z.number().min(1).max(50).optional(),
  guidance: z.number().min(1).max(20).optional(),
});

type TextToImageForm = z.infer<typeof textToImageSchema>;

const models = [
  {
    id: "flux-schnell",
    name: "Flux Schnell",
    credits: 0,
    badge: "free unlimited",
  },
  { id: "flux-dev", name: "Flux Dev", credits: 2 },
  { id: "flux-pro", name: "Flux Pro", credits: 5 },
  { id: "flux-pro-1.1", name: "Flux Pro 1.1", credits: 4 },
  { id: "flux-pro-1.1-ultra", name: "Flux Pro 1.1 Ultra", credits: 6 },
  { id: "flux-realism", name: "Flux Realism", credits: 3 },
  { id: "flux-kontext-pro", name: "Flux Kontext Pro", credits: 4 },
];

const aspectRatios = [
  { value: "1:1", label: "1:1 (Square)" },
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "21:9", label: "21:9 (Ultra Wide)" },
];

interface TextToImageProps {
  onImageGenerated: (imageUrl: string) => void;
  onGenerationStart?: () => void;
  onGenerationComplete?: (generationTime: number) => void;
  isGenerating?: boolean;
}

export function TextToImage({
  onImageGenerated,
  onGenerationStart,
  onGenerationComplete,
}: TextToImageProps) {
  const t = useTranslations("textToImage");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const form = useForm<TextToImageForm>({
    resolver: zodResolver(textToImageSchema),
    defaultValues: {
      prompt: "",
      model: "flux-schnell",
      aspectRatio: "1:1",
      imagePublic: false,
    },
  });

  const onSubmit = async (data: TextToImageForm) => {
    const startTime = Date.now();
    setStartTime(startTime);
    setIsGenerating(true);
    setGenerationProgress(0);
    onImageGenerated("");
    onGenerationStart?.();

    try {
      toast.success("Starting image generation...");

      const response = await fetch("/api/text-to-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: data.prompt,
          model: data.model,
          aspectRatio: data.aspectRatio,
          seed: data.seed,
          steps: data.steps,
          guidance: data.guidance,
          imagePublic: data.imagePublic,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 502 || response.status === 503 || response.status === 504) {
           toast.error("Service temporarily unavailable. The system is automatically retrying...");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate image");
        }
        return;
      }

      const result = await response.json();

      if (result.taskId) {
        toast.info("Generation started. Waiting for webhook result...");
        // Conectar ao SSE para receber atualizações em tempo real
        connectToSSE(result.taskId);
      } else if (result.success && result.imageUrl) {
        onImageGenerated(result.imageUrl);
        toast.success("Image generated successfully!");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Generation error:", error);

      if (error.message.includes("credits")) {
        toast.error(
          "Insufficient credits. Please add more credits to continue."
        );
      } else if (error.message.includes("rate limit")) {
        toast.error("Rate limit exceeded. Please try again in a few minutes.");
      } else {
        toast.error(
          error.message || "Failed to generate image. Please try again."
        );
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Cleanup da conexão SSE quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Conectar ao Server-Sent Events para receber atualizações em tempo real
  const connectToSSE = (taskId: string) => {
    // Fechar conexão anterior se existir
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const eventSource = new EventSource(`/api/text-to-image/status?taskId=${taskId}`);
    eventSourceRef.current = eventSource;
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE update:', data);
        
        // Atualizar progresso baseado no status
        switch (data.status) {
          case 'connected':
            console.log('Connected to SSE for task:', data.taskId);
            break;
          case 'Pending':
            setGenerationProgress(25);
            break;
          case 'Request Moderated':
            setGenerationProgress(50);
            toast.info('Request is being moderated...');
            break;
          case 'Content Moderated':
            toast.error('Content was moderated and rejected');
            setIsGenerating(false);
            eventSource.close();
            eventSourceRef.current = null;
            break;
          case 'Ready':
            setGenerationProgress(100);
            if (data.imageUrl) {
              onImageGenerated(data.imageUrl);
              toast.success('Image generated successfully!');
            }
            // Calcular tempo de geração
            if (startTime) {
              const generationTimeMs = Date.now() - startTime;
              onGenerationComplete?.(generationTimeMs);
            }
            setIsGenerating(false);
            eventSource.close();
            eventSourceRef.current = null;
            break;
          case 'Error':
            toast.error(data.error || 'Image generation failed');
            setIsGenerating(false);
            eventSource.close();
            eventSourceRef.current = null;
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      toast.error('Connection error. Please try again.');
      setIsGenerating(false);
      eventSource.close();
      eventSourceRef.current = null;
    };
  };

  const selectedModel = models.find((m) => m.id === form.watch("model"));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Model Selection */}
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
                This will cost {selectedModel.credits} credits
              </p>
            )}
          </div>

          {/* Prompt */}
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

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label htmlFor="aspectRatio">{t("aspectRatio")}</Label>
            <Select
              value={form.watch("aspectRatio")}
              onValueChange={(value) => form.setValue("aspectRatio", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <Label htmlFor="seed">Seed (Optional)</Label>
                  <Input
                    id="seed"
                    type="number"
                    placeholder="Random seed for reproducible results"
                    {...form.register("seed", { valueAsNumber: true })}
                  />
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  <Label htmlFor="steps">Steps (1-50)</Label>
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
                  <Label htmlFor="guidance">Guidance Scale (1-20)</Label>
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
              onCheckedChange={(checked) =>
                form.setValue("imagePublic", checked)
              }
            />
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating...{" "}
                {generationProgress > 0 && `${generationProgress}%`}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t("generateImage")}
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isGenerating && generationProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          )}
        </form>


      </CardContent>
    </Card>
  );
}
