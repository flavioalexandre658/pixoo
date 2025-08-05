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

const ASPECT_RATIOS = [
  {
    value: "2:3",
    label: "2:3",
    presets: [
      { label: "Small", width: 768, height: 1152 },
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
      { label: "Large", width: 1152, height: 1152 },
    ],
  },
  {
    value: "16:9",
    label: "16:9",
    presets: [
      { label: "Small", width: 1344, height: 768 },
      { label: "Medium", width: 1536, height: 864 },
      { label: "Large", width: 1920, height: 1088 },
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
  { label: "Facebook (16:9)", aspectRatio: "16:9", width: 1920, height: 1088 },
  { label: "Instagram (4:5)", aspectRatio: "4:5", width: 1088, height: 1344 },
  { label: "Twitter / X (4:3)", aspectRatio: "4:3", width: 1600, height: 1216 },
  { label: "TikTok (9:16)", aspectRatio: "9:16", width: 800, height: 1408 },
];
const DEVICE_PRESETS = [
  { label: "Desktop (16:9)", aspectRatio: "16:9", width: 1920, height: 1088 },
  { label: "Mobile (9:16)", aspectRatio: "9:16", width: 736, height: 1280 },
  { label: "TV (2:1)", aspectRatio: "2:1", width: 2560, height: 1280 },
  { label: "Square (1:1)", aspectRatio: "1:1", width: 1024, height: 1024 },
];
const FILM_PRESETS = [
  {
    label: "Cinema (1.85:1)",
    aspectRatio: "1.85:1",
    width: 1856,
    height: 1024,
  },
  { label: "Wide (2.4:1)", aspectRatio: "2.4:1", width: 2400, height: 1024 },
];

const roundToNearest32 = (value: number) => Math.round(value / 32) * 32;

export function DimensionSelector({ value, onChange }: DimensionSelectorProps) {
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
      onChange({
        aspectRatio: ratio,
        width: preset.width,
        height: preset.height,
      });
    }
  };

  const handlePresetSelect = (presetLabel: string) => {
    setSelectedPreset(presetLabel);
    const ratioObj = ASPECT_RATIOS.find((r) => r.value === selectedRatio);
    const preset = ratioObj?.presets.find((p) => p.label === presetLabel);
    if (preset) {
      onChange({
        aspectRatio: selectedRatio,
        width: preset.width,
        height: preset.height,
      });
    }
  };

  const handleCustom = () => {
    setCustomOpen(true);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={selectedRatio === "2:3" ? "default" : "outline"}
          onClick={() => handleRatioSelect("2:3")}
        >
          {" "}
          <RectangleVertical className="w-5 h-5 mr-1" />
          2:3{" "}
        </Button>
        <Button
          type="button"
          variant={selectedRatio === "1:1" ? "default" : "outline"}
          onClick={() => handleRatioSelect("1:1")}
        >
          {" "}
          <Square className="w-5 h-5 mr-1" />
          1:1{" "}
        </Button>
        <Button
          type="button"
          variant={selectedRatio === "16:9" ? "default" : "outline"}
          onClick={() => handleRatioSelect("16:9")}
        >
          {" "}
          <RectangleHorizontal className="w-5 h-5 mr-1" />
          16:9{" "}
        </Button>
        <Button
          type="button"
          variant={selectedRatio === "custom" ? "default" : "outline"}
          onClick={handleCustom}
        >
          {" "}
          <MoreHorizontal className="w-5 h-5 mr-1" />
          Custom{" "}
        </Button>
      </div>
      {selectedRatio !== "custom" && (
        <div className="flex gap-2 mb-2">
          {ASPECT_RATIOS.find((r) => r.value === selectedRatio)?.presets.map(
            (preset) => (
              <Button
                key={preset.label}
                type="button"
                variant={
                  selectedPreset === preset.label ? "default" : "outline"
                }
                onClick={() => handlePresetSelect(preset.label)}
              >
                {preset.label}
                <span className="ml-1 text-xs text-muted-foreground">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Image Dimensions</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Square className="w-5 h-5" />
              <span className="font-medium">Aspect Ratio</span>
            </div>
            <div className="flex gap-2 mb-2">
              <Button
                size="sm"
                variant={selectedRatio === "1:1" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("1:1");
                  setCustomWidth(1024);
                  setCustomHeight(1024);
                }}
              >
                1:1
              </Button>
              <Button
                size="sm"
                variant={selectedRatio === "16:9" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("16:9");
                  setCustomWidth(1920);
                  setCustomHeight(1080);
                }}
              >
                16:9
              </Button>
              <Button
                size="sm"
                variant={selectedRatio === "9:16" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("9:16");
                  setCustomWidth(1080);
                  setCustomHeight(1920);
                }}
              >
                9:16
              </Button>
              <Button
                size="sm"
                variant={selectedRatio === "4:3" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("4:3");
                  setCustomWidth(1600);
                  setCustomHeight(1200);
                }}
              >
                4:3
              </Button>
              <Button
                size="sm"
                variant={selectedRatio === "3:4" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRatio("3:4");
                  setCustomWidth(1200);
                  setCustomHeight(1600);
                }}
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
              <div className="flex gap-2 items-center mb-2">
                <Label htmlFor="custom-width">W</Label>
                <Input
                  id="custom-width"
                  type="number"
                  min={64}
                  max={4096}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                />
                <Label htmlFor="custom-height">H</Label>
                <Input
                  id="custom-height"
                  type="number"
                  min={64}
                  max={4096}
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          <div className="mb-4">
            <div className="font-medium mb-1">Socials</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {SOCIAL_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRatio(preset.aspectRatio);
                    setCustomWidth(preset.width);
                    setCustomHeight(preset.height);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="font-medium mb-1">Devices</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {DEVICE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRatio(preset.aspectRatio);
                    setCustomWidth(preset.width);
                    setCustomHeight(preset.height);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="font-medium mb-1">Film</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {FILM_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRatio(preset.aspectRatio);
                    setCustomWidth(preset.width);
                    setCustomHeight(preset.height);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                const finalWidth = roundToNearest32(customWidth);
                let finalHeight = roundToNearest32(customHeight);

                if (finalHeight > 1440) {
                  finalHeight = 1440;
                }

                setCustomOpen(false);
                onChange({
                  aspectRatio: selectedRatio,
                  width: finalWidth,
                  height: finalHeight,
                });
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
