"use client";

import { useState } from "react";
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
];

const aspectRatios = [
  { value: "1:1", label: "1:1 (Square)" },
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "21:9", label: "21:9 (Ultra Wide)" },
];

export function TextToImage() {
  const t = useTranslations("textToImage");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsGenerating(true);
    try {
      // TODO: Implement image generation logic
      console.log("Generating image with data:", data);
      toast.success("Image generation started!");

      // Simulate generation time
      await new Promise((resolve) => setTimeout(resolve, 3000));

      toast.success("Image generated successfully!");
    } catch (error) {
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
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
                Make this image visible to other users
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
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t("generateImage")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
