"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download, Eye, Trash2, Sparkles, Zap, ZoomIn, ZoomOut, Crop } from "lucide-react";
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
  const [zoom, setZoom] = useState(1);
  const [cropped, setCropped] = useState(false);

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
    <div
      className={`relative flex items-center justify-center w-full h-full ${className}`}
    >
      {isGenerating ? (
        <div className="relative flex flex-col items-center justify-center space-y-6 p-8">
          {/* Gradiente de fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-xl" />

          {isWaitingWebhook && (
            <div className="relative text-center space-y-4">
              {/* Container do timer com gradiente */}
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm border border-pixoo-purple/20 shadow-lg shadow-pixoo-purple/10">
                <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/10 via-transparent to-pixoo-magenta/10 rounded-2xl" />
                <div className="relative">
                  <div className="text-6xl font-mono font-bold bg-gradient-to-r from-pixoo-purple via-pixoo-magenta to-pixoo-pink bg-clip-text text-transparent animate-pulse">
                    {(currentTime / 1000).toFixed(1)}
                  </div>
                  <div className="text-lg text-muted-foreground mt-2 flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4 text-pixoo-purple animate-pulse" />
                    {t("seconds")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status de geração */}
          <div className="relative flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-pixoo-purple/10 to-pixoo-pink/10 border border-pixoo-purple/20 backdrop-blur-sm">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
              <Sparkles className="h-5 w-5 text-pixoo-purple animate-spin" />
            </div>
            <span className="text-sm font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
              {t("generating")}
            </span>
          </div>
        </div>
      ) : generatedImage ? (
        <div className="relative space-y-6 p-6 w-full max-w-2xl">
          {/* Gradiente de fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-xl" />

          {/* Header com título e controles */}
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                {t("generatedImage")}
              </h3>

              {/* Controles de zoom */}
              <div className="flex gap-1.5 items-center h-11 px-2 rounded-lg bg-gradient-to-r from-pixoo-purple/5 to-pixoo-pink/5 border border-pixoo-purple/20 backdrop-blur-sm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="h-7 w-7 p-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
                >
                  <ZoomOut className="h-3.5 w-3.5 text-pixoo-purple" />
                </Button>

                <div className="flex-1 min-w-0 px-2">
                  <span className="text-xs font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent block text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  className="h-7 w-7 p-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
                >
                  <ZoomIn className="h-3.5 w-3.5 text-pixoo-purple" />
                </Button>

                <Button
                  variant={cropped ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCropped(!cropped)}
                  title={cropped ? "Ver imagem completa" : "Ver imagem cortada"}
                  className={
                    cropped
                      ? "h-7 w-7 p-0 bg-gradient-to-r from-pixoo-purple to-pixoo-magenta hover:from-pixoo-purple/90 hover:to-pixoo-magenta/90 border-0 shadow-lg shadow-pixoo-purple/30 transition-all duration-300"
                      : "h-7 w-7 p-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
                  }
                >
                  <Crop
                    className={`h-3.5 w-3.5 ${
                      cropped ? "text-white" : "text-pixoo-purple"
                    }`}
                  />
                </Button>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewFullSize}
                className="group w-full sm:w-auto border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
              >
                <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 mr-2 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-3 w-3 text-pixoo-purple" />
                </div>
                <span className="text-sm bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent group-hover:from-pixoo-purple group-hover:to-pixoo-magenta">
                  {t("viewFullSize")}
                </span>
              </Button>

              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="group w-full sm:w-auto border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
                >
                  <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 mr-2 group-hover:scale-110 transition-transform duration-300">
                    <Download className="h-3 w-3 text-pixoo-purple" />
                  </div>
                  <span className="text-sm bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent group-hover:from-pixoo-purple group-hover:to-pixoo-magenta">
                    {t("download")}
                  </span>
                </Button>
              )}

              {onDelete && imageId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(imageId)}
                  disabled={isDeleting}
                  className="group w-full sm:w-auto bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700 border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
                >
                  <div className="p-1 rounded-md bg-white/20 mr-2 group-hover:scale-110 transition-transform duration-300">
                    <Trash2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm text-white font-medium">
                    {isDeleting ? "Deletando..." : "Deletar"}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Container da imagem */}
          <div className="relative w-full aspect-square group">
            {imageError ? (
              <div className="flex items-center justify-center h-full rounded-xl bg-gradient-to-br from-muted/80 to-muted/60 backdrop-blur-sm border border-pixoo-purple/20 shadow-lg">
                <div className="text-center space-y-4 p-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 w-fit mx-auto">
                    <Sparkles className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {t("imageLoadError")}
                  </p>
                  <div className="flex flex-col gap-3">
                    {!useProxy && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUseProxy(true);
                          setImageError(false);
                        }}
                        className="border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300"
                      >
                        {t("retryWithProxy")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generatedImage, "_blank")}
                      className="border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300"
                    >
                      {t("openInNewTab")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-pixoo-purple/20 shadow-lg shadow-pixoo-purple/10 group-hover:shadow-xl group-hover:shadow-pixoo-purple/20 transition-all duration-500">
                {/* Overlay gradiente sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom})`,
                    transition: 'transform 0.3s ease-in-out'
                  }}
                >
                  <Image
                    key={`${generatedImage}-${useProxy}`}
                    src={getImageUrl(generatedImage)}
                    alt={t("generatedImageAlt")}
                    fill
                    style={{ objectFit: cropped ? "cover" : "contain" }}
                    className="transition-all duration-500 group-hover:scale-105"
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
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative text-center p-12">
          {/* Gradiente de fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-xl" />

          {/* Estado vazio */}
          <div className="relative space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 w-fit mx-auto">
              <Sparkles className="h-8 w-8 text-pixoo-purple" />
            </div>
            <p className="text-lg font-medium bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
              {t("noImageGenerated")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
