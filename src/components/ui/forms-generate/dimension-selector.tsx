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
  const validHeight = Math.max(256, Math.min(1440, roundToMultipleOf32(height)));
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
    <div>
      <div className="grid grid-cols-2 sm:flex gap-2 mb-4">
        <Button
          type="button"
          variant={selectedRatio === "2:3" ? "default" : "outline"}
          onClick={() => handleRatioSelect("2:3")}
          className="flex-1 sm:flex-none"
        >
          <RectangleVertical className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
          <span className="text-sm sm:text-base">2:3</span>
        </Button>
        <Button
          type="button"
          variant={selectedRatio === "1:1" ? "default" : "outline"}
          onClick={() => handleRatioSelect("1:1")}
          className="flex-1 sm:flex-none"
        >
          <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
          <span className="text-sm sm:text-base">1:1</span>
        </Button>
        <Button
          type="button"
          variant={selectedRatio === "16:9" ? "default" : "outline"}
          onClick={() => handleRatioSelect("16:9")}
          className="flex-1 sm:flex-none"
        >
          <RectangleHorizontal className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
          <span className="text-sm sm:text-base">16:9</span>
        </Button>
        <Button
          type="button"
          variant={selectedRatio === "custom" ? "default" : "outline"}
          onClick={handleCustom}
          className="flex-1 sm:flex-none"
        >
          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
          <span className="text-sm sm:text-base">{t("custom")}</span>
        </Button>
      </div>
      {selectedRatio !== "custom" && (
        <div className="flex flex-wrap gap-2 mb-2">
          {ASPECT_RATIOS.find((r) => r.value === selectedRatio)?.presets.map(
            (preset) => (
              <Button
                key={preset.label}
                type="button"
                variant={
                  selectedPreset === preset.label ? "default" : "outline"
                }
                onClick={() => handlePresetSelect(preset.label)}
                className="flex-1 sm:flex-none min-w-0"
                size="sm"
              >
                <span className="text-xs sm:text-sm">{preset.label}</span>
                <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">
                  {preset.width}×{preset.height}
                </span>
              </Button>
            )
          )}
        </div>
      )}
      {selectedRatio !== "custom" && (
        <div className="text-sm text-muted-foreground mb-2">
          Image Dimensions:{" "}
          {ASPECT_RATIOS.find((r) => r.value === selectedRatio)?.presets.find(
            (p) => p.label === selectedPreset
          )?.width || value.width}
          ×
          {ASPECT_RATIOS.find((r) => r.value === selectedRatio)?.presets.find(
            (p) => p.label === selectedPreset
          )?.height || value.height}
          px
        </div>
      )}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg mx-2 sm:mx-4 md:mx-auto max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">{t("imageDimensions")}</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Square className="w-5 h-5" />
              <span className="font-medium">{t("aspectRatio")}</span>
            </div>
            <div className="grid grid-cols-3 sm:flex gap-2 mb-2">
              <Button
                type="button"
                size="sm"
                variant={selectedRatio === "1:1" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("1:1");
                  const validated = validateDimensions(1024, 1024);
                  setCustomWidth(validated.width);
                  setCustomHeight(validated.height);
                }}
                className="text-xs sm:text-sm"
              >
                1:1
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedRatio === "16:9" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("16:9");
                  const validated = validateDimensions(1440, 832);
                  setCustomWidth(validated.width);
                  setCustomHeight(validated.height);
                }}
                className="text-xs sm:text-sm"
              >
                16:9
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedRatio === "9:16" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("9:16");
                  const validated = validateDimensions(800, 1440);
                  setCustomWidth(validated.width);
                  setCustomHeight(validated.height);
                }}
                className="text-xs sm:text-sm"
              >
                9:16
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedRatio === "4:3" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("4:3");
                  const validated = validateDimensions(1344, 1024);
                  setCustomWidth(validated.width);
                  setCustomHeight(validated.height);
                }}
                className="text-xs sm:text-sm"
              >
                4:3
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedRatio === "3:4" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("3:4");
                  const validated = validateDimensions(1024, 1344);
                  setCustomWidth(validated.width);
                  setCustomHeight(validated.height);
                }}
                className="text-xs sm:text-sm"
              >
                3:4
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Image Dimensions: {customWidth}×{customHeight} px
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Switch
                checked={selectedRatio === "custom"}
                onCheckedChange={() => setSelectedRatio("custom")}
              />
              <span>Custom Resolution</span>
            </div>
            {selectedRatio === "custom" && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="custom-width" className="text-xs sm:text-sm">{t("width")}</Label>
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
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="custom-height" className="text-xs sm:text-sm">{t("height")}</Label>
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
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="mb-4 space-y-3">
            <div>
              <div className="font-medium mb-2 text-sm sm:text-base">{t("socials")}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SOCIAL_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRatio(preset.aspectRatio);
                      const validated = validateDimensions(preset.width, preset.height);
                      setCustomWidth(validated.width);
                      setCustomHeight(validated.height);
                    }}
                    className="text-xs sm:text-sm justify-start"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2 text-sm sm:text-base">{t("devices")}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEVICE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRatio(preset.aspectRatio);
                      const validated = validateDimensions(preset.width, preset.height);
                      setCustomWidth(validated.width);
                      setCustomHeight(validated.height);
                    }}
                    className="text-xs sm:text-sm justify-start"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2 text-sm sm:text-base">{t("film")}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FILM_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRatio(preset.aspectRatio);
                      const validated = validateDimensions(preset.width, preset.height);
                      setCustomWidth(validated.width);
                      setCustomHeight(validated.height);
                    }}
                    className="text-xs sm:text-sm justify-start"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
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
              className="w-full sm:w-auto"
            >
              {t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
