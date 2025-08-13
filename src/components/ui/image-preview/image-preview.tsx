"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download, Eye, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";

interface ImagePreviewProps {
  isGenerating: boolean;
  generatedImage: string | null;
  currentTime: number;
  onDownload?: () => void;
  onDelete?: (imageId: string) => void;
  imageId?: string;
  isDeleting?: boolean;
  className?: string;
  isWaitingWebhook?: boolean;
}

export const ImagePreview = memo(ImagePreviewComponent);

function ImagePreviewComponent({
  isGenerating,
  generatedImage,
  currentTime,
  onDownload,
  onDelete,
  imageId,
  isDeleting = false,
  className = "",
  isWaitingWebhook = false,
}: ImagePreviewProps) {
  const t = useTranslations("imagePreview");
  const [imageError, setImageError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  // Função para obter a URL da imagem (direta ou via proxy)
  const getImageUrl = (originalUrl: string) => {
    if (useProxy) {
      return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
    }
    return originalUrl;
  };

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
          {isWaitingWebhook && (
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-primary">
                {(currentTime / 1000).toFixed(1)}
              </div>
              <div className="text-lg text-muted-foreground mt-2">
                {t("seconds")}
              </div>
            </div>
          )}
          <div className="text-sm text-muted-foreground">{t("generating")}</div>
        </div>
      ) : generatedImage ? (
        <div className="space-y-4 py-4 px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-lg font-semibold">{t("generatedImage")}</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewFullSize}
                className="w-full sm:w-auto"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="text-sm">{t("viewFullSize")}</span>
              </Button>
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-sm">{t("download")}</span>
                </Button>
              )}
              {onDelete && imageId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(imageId)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {isDeleting ? "Deletando..." : "Deletar"}
                  </span>
                </Button>
              )}
            </div>
          </div>
          <div className="relative w-full aspect-square">
            {imageError ? (
              <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("imageLoadError")}
                  </p>
                  <div className="flex flex-col gap-2">
                    {!useProxy && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUseProxy(true);
                          setImageError(false);
                        }}
                      >
                        {t("retryWithProxy")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generatedImage, "_blank")}
                    >
                      {t("openInNewTab")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Image
                key={`${generatedImage}-${useProxy}`}
                src={getImageUrl(generatedImage)}
                alt={t("generatedImageAlt")}
                fill
                style={{ objectFit: "cover" }}
                className="transition-transform duration-300"
                unoptimized={true}
                onLoad={() => {
                  setImageError(false);
                }}
                onError={() => {
                  if (!useProxy) {
                    setUseProxy(true);
                  } else {
                    setImageError(true);
                  }
                }}
              />
            )}
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
