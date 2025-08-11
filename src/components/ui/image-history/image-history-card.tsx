import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Clock, Zap, AlertTriangle, Eye, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";

interface ImageHistoryCardProps {
  image: {
    id: string;
    prompt: string;
    model: string;
    aspectRatio: string;
    imageUrl: string | null;
    status: string;
    creditsUsed: number;
    generationTimeMs: number | null;
    createdAt: string;
  };
  getModelBadgeColor: (model: string) => string;
  formatTime: (ms: number | null) => string;
  onDownload: (url: string, prompt: string) => void;
  onViewFull?: (url: string, prompt: string) => void;
  onDelete: (imageId: string) => void;
  zoom: number;
  cropped: boolean;
  isSelectionMode: boolean;
  isDeleting: boolean;
}

export function ImageHistoryCard({ image, getModelBadgeColor, formatTime, onDownload, onViewFull, onDelete, zoom, cropped, isSelectionMode, isDeleting }: ImageHistoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const t = useTranslations("imageHistory");

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col space-y-3 group relative overflow-hidden">
      <div 
        className="relative w-full aspect-square bg-muted rounded-md"
        style={{
          overflow: cropped ? 'hidden' : 'visible',
        }}
      >
        {image.imageUrl && image.status === "ready" && !imageError ? (
          <Image
            src={image.imageUrl}
            alt={image.prompt}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300"
            style={{
              transform: `scale(${zoom})`,
              objectFit: cropped ? 'cover' : 'contain',
            }}
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <span className="text-sm text-center">
              {image.status === 'pending' ? t("generating") : t("failedToLoad")}
            </span>
          </div>
        )}
      </div>
      {/* Prompt */}
      <div>
        <p className="text-sm font-medium line-clamp-2">
          {image.prompt}
        </p>
      </div>
      {/* Badges e informações */}
      <div className="flex flex-wrap gap-2">
        <Badge className={getModelBadgeColor(image.model)}>
          {image.model}
        </Badge>
        <Badge variant="outline">{image.aspectRatio}</Badge>
      </div>
      {/* Métricas */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(image.generationTimeMs)}
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {image.creditsUsed} {t("credits")}
        </div>
      </div>
      {/* Data */}
      <div className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(image.createdAt), {
          addSuffix: true,
          locale: ptBR,
        })}
      </div>
      {/* Ações */}
      {image.imageUrl && image.status === "ready" && !isSelectionMode && (
        <div className="flex gap-2">
          {onViewFull && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewFull(image.imageUrl!, image.prompt)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              {t("viewFull")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(image.imageUrl!, image.prompt)}
            className="flex-1"
          >
            <Download className="h-3 w-3 mr-1" />
            {t("download")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
            className="px-2"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}