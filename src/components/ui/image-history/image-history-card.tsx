import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Clock,
  Zap,
  AlertTriangle,
  Eye,
  Trash2,
  Copy,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ImageHistoryCardProps {
  image: {
    id: string;
    prompt: string;
    model: string;
    modelName: string | null;
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
  onPromptReuse?: (prompt: string) => void;
}

export function ImageHistoryCard({
  image,
  getModelBadgeColor,
  formatTime,
  onDownload,
  onViewFull,
  onDelete,
  zoom,
  cropped,
  isSelectionMode,
  isDeleting,
  onPromptReuse,
}: ImageHistoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const t = useTranslations("imageHistory");

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(image.prompt);
      toast.success("Prompt copiado para a área de transferência!");

      // Set the prompt in the form if callback is provided
      if (onPromptReuse) {
        onPromptReuse(image.prompt);
        toast.success("Prompt definido no formulário!");
      }
    } catch (error) {
      console.error("Erro ao copiar prompt:", error);
      toast.error("Erro ao copiar prompt");
    }
  };

  return (
    <div className="border rounded-lg p-3 sm:p-4 flex flex-col space-y-3 group relative overflow-hidden h-full">
      <div
        className="relative w-full aspect-square bg-muted rounded-md overflow-hidden"
        style={{
          overflow: "hidden",
        }}
      >
        {image.imageUrl && image.status === "ready" && !imageError ? (
          <Image
            src={image.imageUrl}
            alt={image.prompt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="transition-transform duration-300 object-cover"
            style={{
              transform: `scale(${zoom})`,
              objectFit: cropped ? "cover" : "contain",
            }}
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
            <span className="text-xs sm:text-sm text-center px-2">
              {image.status === "pending" ? t("generating") : t("failedToLoad")}
            </span>
          </div>
        )}
      </div>
      {/* Prompt */}
      <div className="flex-1">
        <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-tight">
          {image.prompt}
        </p>
      </div>
      {/* Badges e informações */}
      <div className="flex flex-wrap gap-1 sm:gap-2">
        <Badge className={`text-xs ${getModelBadgeColor(image.model)}`}>
          {image.modelName || image.model}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {image.aspectRatio}
        </Badge>
      </div>
      {/* Métricas */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{formatTime(image.generationTimeMs)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {image.creditsUsed} {t("credits")}
          </span>
        </div>
      </div>
      {/* Data */}
      <div className="text-xs text-muted-foreground truncate">
        {formatDistanceToNow(new Date(image.createdAt), {
          addSuffix: true,
          locale: ptBR,
        })}
      </div>
      {/* Ações */}
      {image.imageUrl && image.status === "ready" && !isSelectionMode && (
        <div className="flex gap-1 sm:gap-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrompt}
            className="px-2 flex-shrink-0"
            title="Copiar e reutilizar prompt"
          >
            <Copy className="h-3 w-3" />
          </Button>
          {onViewFull && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewFull(image.imageUrl!, image.prompt)}
              className="px-2 flex-shrink-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(image.imageUrl!, image.prompt)}
            className="px-2 flex-shrink-0"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
            className="px-2 flex-shrink-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
