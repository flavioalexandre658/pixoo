import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Square,
  RectangleHorizontal,
  RectangleVertical,
  MoreHorizontal,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";

// Função para arredondar para o múltiplo de 32 mais próximo
const roundToMultipleOf32 = (value: number): number => {
  return Math.round(value / 32) * 32;
};

// Função para validar dimensões conforme limites da API BFL
// Limites: 256-1440px, múltiplo de 32
const validateDimensions = (width: number, height: number) => {
  const validWidth = Math.max(256, Math.min(1440, roundToMultipleOf32(width)));
  const validHeight = Math.max(
    256,
    Math.min(1440, roundToMultipleOf32(height))
  );
  return { width: validWidth, height: validHeight };
};

const ASPECT_RATIOS = [
  {
    value: "2:3",
    label: "2:3",
    presets: [
      { label: "Small", width: 736, height: 1120 },
      { label: "Medium", width: 832, height: 1248 },
      { label: "Large", width: 896, height: 1344 },
    ],
  },
  {
    value: "1:1",
    label: "1:1",
    presets: [
      { label: "Small", width: 896, height: 896 },
      { label: "Medium", width: 1024, height: 1024 },
      { label: "Large", width: 1120, height: 1120 },
    ],
  },
  {
    value: "16:9",
    label: "16:9",
    presets: [
      { label: "Small", width: 1280, height: 736 },
      { label: "Medium", width: 1344, height: 768 },
      { label: "Large", width: 1440, height: 832 },
    ],
  },
];

export interface Dimension {
  aspectRatio: string;
  width: number;
  height: number;
}

interface DimensionSelectorProps {
  value: Dimension;
  onChange: (value: Dimension) => void;
}

const SOCIAL_PRESETS = [
  { label: "Facebook (16:9)", aspectRatio: "16:9", width: 1440, height: 832 },
  { label: "Instagram (4:5)", aspectRatio: "4:5", width: 1088, height: 1344 },
  { label: "Twitter / X (4:3)", aspectRatio: "4:3", width: 1344, height: 1024 },
  { label: "TikTok (9:16)", aspectRatio: "9:16", width: 800, height: 1440 },
];
const DEVICE_PRESETS = [
  { label: "Desktop (16:9)", aspectRatio: "16:9", width: 1440, height: 832 },
  { label: "Mobile (9:16)", aspectRatio: "9:16", width: 736, height: 1312 },
  { label: "TV (2:1)", aspectRatio: "2:1", width: 1440, height: 736 },
  { label: "Square (1:1)", aspectRatio: "1:1", width: 1024, height: 1024 },
];
const FILM_PRESETS = [
  {
    label: "Cinema (1.85:1)",
    aspectRatio: "1.85:1",
    width: 1440,
    height: 800,
  },
  { label: "Wide (2.4:1)", aspectRatio: "2.4:1", width: 1440, height: 608 },
];

export function DimensionSelector({ value, onChange }: DimensionSelectorProps) {
  const t = useTranslations("dimensionSelector");
  const [selectedRatio, setSelectedRatio] = useState(
    value.aspectRatio || "1:1"
  );
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState(value.width || 1024);
  const [customHeight, setCustomHeight] = useState(value.height || 1024);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleRatioSelect = (ratio: string) => {
    setSelectedRatio(ratio);
    const ratioObj = ASPECT_RATIOS.find((r) => r.value === ratio);
    if (ratioObj && ratioObj.presets.length > 0) {
      const preset = ratioObj.presets[0];
      setSelectedPreset(preset.label);
      const validated = validateDimensions(preset.width, preset.height);
      onChange({
        aspectRatio: ratio,
        width: validated.width,
        height: validated.height,
      });
    }
  };

  const handlePresetSelect = (presetLabel: string) => {
    setSelectedPreset(presetLabel);
    const ratioObj = ASPECT_RATIOS.find((r) => r.value === selectedRatio);
    const preset = ratioObj?.presets.find((p) => p.label === presetLabel);
    if (preset) {
      const validated = validateDimensions(preset.width, preset.height);
      onChange({
        aspectRatio: selectedRatio,
        width: validated.width,
        height: validated.height,
      });
    }
  };

  const handleCustom = () => {
    setCustomOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Título mais compacto */}
      <Label className="text-sm font-medium flex items-center gap-2">
        <Square className="h-3 w-3 text-pixoo-purple" />
        Proporção
      </Label>

      {/* Botões de proporção - layout mobile otimizado */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant={selectedRatio === "2:3" ? "default" : "outline"}
          onClick={() => handleRatioSelect("2:3")}
          className={`h-9 text-xs font-medium transition-colors ${
            selectedRatio === "2:3"
              ? "bg-gradient-to-r from-pixoo-purple to-pixoo-magenta text-white"
              : "border-border hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <RectangleVertical className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">2:3</span>
        </Button>
        <Button
          type="button"
          variant={selectedRatio === "1:1" ? "default" : "outline"}
          onClick={() => handleRatioSelect("1:1")}
          className={`h-9 text-xs font-medium transition-colors ${
            selectedRatio === "1:1"
              ? "bg-gradient-to-r from-pixoo-purple to-pixoo-magenta text-white"
              : "border-border hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <Square className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">1:1</span>
        </Button>
        <Button
          type="button"
          variant={selectedRatio === "16:9" ? "default" : "outline"}
          onClick={() => handleRatioSelect("16:9")}
          className={`h-9 text-xs font-medium transition-colors ${
            selectedRatio === "16:9"
              ? "bg-gradient-to-r from-pixoo-purple to-pixoo-magenta text-white"
              : "border-border hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <RectangleHorizontal className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">16:9</span>
        </Button>
        <Button
          type="button"
          variant={selectedRatio === "custom" ? "default" : "outline"}
          onClick={handleCustom}
          className={`h-9 text-xs font-medium transition-colors ${
            selectedRatio === "custom"
              ? "bg-gradient-to-r from-pixoo-purple to-pixoo-magenta text-white"
              : "border-border hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <MoreHorizontal className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">{t("custom")}</span>
        </Button>
      </div>

      {/* Switch para mostrar dimensões */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Square className="h-3 w-3 text-pixoo-purple" />
          Dimensões
        </Label>
        <Switch
          checked={showAdvanced}
          onCheckedChange={setShowAdvanced}
          className="scale-75"
        />
      </div>

      {/* Presets de tamanho - apenas quando expandido */}
      {showAdvanced && selectedRatio !== "custom" && (
        <div className="grid grid-cols-3 gap-1.5">
          {ASPECT_RATIOS.find((r) => r.value === selectedRatio)?.presets.map(
            (preset) => (
              <Button
                key={preset.label}
                type="button"
                variant={
                  selectedPreset === preset.label ? "default" : "outline"
                }
                onClick={() => handlePresetSelect(preset.label)}
                className={`h-8 text-xs transition-colors ${
                  selectedPreset === preset.label
                    ? "bg-gradient-to-r from-pixoo-purple to-pixoo-magenta text-white"
                    : "border-border hover:bg-accent hover:text-accent-foreground"
                }`}
                size="sm"
              >
                {preset.label}
              </Button>
            )
          )}
        </div>
      )}

      {/* Informações das dimensões - sempre visível mas compacta */}
      <div className="text-xs text-muted-foreground bg-muted px-2 py-1.5 rounded-md text-center">
        {ASPECT_RATIOS.find((r) => r.value === selectedRatio)?.presets.find(
          (p) => p.label === selectedPreset
        )?.width || value.width}
        ×
        {ASPECT_RATIOS.find((r) => r.value === selectedRatio)?.presets.find(
          (p) => p.label === selectedPreset
        )?.height || value.height}
        px
      </div>

      {/* Modal otimizado para mobile */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="w-[95vw] max-w-sm p-3 sm:p-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold text-center">
              Dimensões
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Proporções rápidas - grid compacto */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Proporção</Label>
              <div className="grid grid-cols-5 gap-1">
                {["1:1", "16:9", "9:16", "4:3", "3:4"].map((ratio) => (
                  <Button
                    key={ratio}
                    type="button"
                    size="sm"
                    variant={selectedRatio === ratio ? "default" : "outline"}
                    onClick={() => {
                      setSelectedRatio(ratio);
                      const presets = {
                        "1:1": { width: 1024, height: 1024 },
                        "16:9": { width: 1440, height: 832 },
                        "9:16": { width: 800, height: 1440 },
                        "4:3": { width: 1344, height: 1024 },
                        "3:4": { width: 1024, height: 1344 },
                      };
                      const preset = presets[ratio as keyof typeof presets];
                      const validated = validateDimensions(
                        preset.width,
                        preset.height
                      );
                      setCustomWidth(validated.width);
                      setCustomHeight(validated.height);
                    }}
                    className={`h-7 text-xs transition-colors ${
                      selectedRatio === ratio
                        ? "bg-gradient-to-r from-pixoo-purple to-pixoo-magenta text-white"
                        : "border-border hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {ratio}
                  </Button>
                ))}
              </div>
            </div>

            {/* Inputs customizados - layout compacto */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label
                  htmlFor="custom-width"
                  className="text-xs font-medium flex items-center gap-1"
                >
                  <RectangleHorizontal className="h-3 w-3 text-pixoo-purple" />
                  Largura
                </Label>
                <Input
                  id="custom-width"
                  type="number"
                  min={256}
                  max={1440}
                  step={32}
                  value={customWidth}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const validated = validateDimensions(value, customHeight);
                    setCustomWidth(validated.width);
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="custom-height"
                  className="text-xs font-medium flex items-center gap-1"
                >
                  <RectangleVertical className="h-3 w-3 text-pixoo-purple" />
                  Altura
                </Label>
                <Input
                  id="custom-height"
                  type="number"
                  min={256}
                  max={1440}
                  step={32}
                  value={customHeight}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const validated = validateDimensions(customWidth, value);
                    setCustomHeight(validated.height);
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Presets simplificados */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Presets</Label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: "Instagram", width: 1088, height: 1344 },
                  { label: "Facebook", width: 1440, height: 832 },
                  { label: "TikTok", width: 800, height: 1440 },
                  { label: "Desktop", width: 1440, height: 832 },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const validated = validateDimensions(
                        preset.width,
                        preset.height
                      );
                      setCustomWidth(validated.width);
                      setCustomHeight(validated.height);
                    }}
                    className="h-7 text-xs justify-start"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Botão de salvar */}
          <Button
            type="button"
            onClick={() => {
              setCustomOpen(false);
              const validated = validateDimensions(customWidth, customHeight);
              onChange({
                aspectRatio: selectedRatio,
                width: validated.width,
                height: validated.height,
              });
            }}
            className="w-full h-9 bg-gradient-to-r from-pixoo-purple to-pixoo-magenta text-white font-medium text-sm"
          >
            Salvar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
