"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { useTranslations } from "next-intl";

interface ImagePreviewProps {
  isGenerating: boolean;
  generatedImage: string | null;
  currentTime: number;
  onDownload?: () => void;
  className?: string;
}

export const ImagePreview = memo(ImagePreviewComponent);

import { memo } from "react";

function ImagePreviewComponent({
  isGenerating,
  generatedImage,
  currentTime,
  onDownload,
  className = "",
}: ImagePreviewProps) {
  const t = useTranslations("imagePreview");

  const handleDownload = async () => {
    if (!generatedImage || !onDownload) return;
    onDownload();
  };

  const handleViewFullSize = () => {
    if (generatedImage) {
      window.open(generatedImage, "_blank");
    }
  };

  return (
    <div className={className}>
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="text-center">
            <div className="text-6xl font-mono font-bold text-primary">
              {(currentTime / 1000).toFixed(1)}
            </div>
            <div className="text-lg text-muted-foreground mt-2">segundos</div>
          </div>
          <div className="text-sm text-muted-foreground">
            Gerando sua imagem...
          </div>
        </div>
      ) : generatedImage ? (
        <div className="space-y-4 py-4 px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-lg font-semibold">Generated Image</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewFullSize}
                className="w-full sm:w-auto"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="text-sm">View Full Size</span>
              </Button>
              {onDownload && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-sm">Download</span>
                </Button>
              )}
            </div>
          </div>
          <div className="relative w-full">
            <Image
              src={generatedImage}
              alt="Generated image"
              width={512}
              height={512}
              className="w-full h-auto rounded-lg border shadow-lg"
              style={{ objectFit: "contain" }}
              onLoad={() =>
                console.log("✅ Image loaded successfully:", generatedImage)
              }
              onError={(e) =>
                console.error(
                  "❌ Image failed to load:",
                  e,
                  "src:",
                  generatedImage
                )
              }
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          <p className="text-lg">{t("noImageGenerated")}</p>
        </div>
      )}
    </div>
  );
}
