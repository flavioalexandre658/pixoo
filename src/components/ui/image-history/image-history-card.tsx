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
  Globe,
  Edit,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

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
    isPublic?: boolean;
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
  onTogglePublic?: (imageId: string, isPublic: boolean) => void;
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
  onTogglePublic,
}: ImageHistoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const t = useTranslations("imageHistory");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

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

  const handleEditImage = () => {
    if (image.imageUrl && image.prompt) {
      const editUrl = `/${locale}/edit-image?imageUrl=${encodeURIComponent(
        image.imageUrl
      )}&prompt=${encodeURIComponent(image.prompt)}`;
      router.push(editUrl);
    }
  };

  const handleTogglePublic = () => {
    if (onTogglePublic) {
      const newPublicState = !image.isPublic;
      onTogglePublic(image.id, newPublicState);
      toast.success(
        newPublicState ? "Imagem tornada pública!" : "Imagem tornada privada!"
      );
    }
  };

  return (
    <div className="relative group overflow-hidden h-full">
      {/* Elementos decorativos flutuantes */}
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
      <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-purple/20 rounded-full blur-sm opacity-40 group-hover:opacity-60 transition-opacity duration-300" />

      <div className="border border-pixoo-purple/20 rounded-xl p-3 sm:p-4 flex flex-col space-y-3 h-full bg-gradient-to-br from-background/95 via-pixoo-purple/5 to-pixoo-pink/5 backdrop-blur-sm hover:border-pixoo-magenta/30 hover:shadow-xl hover:shadow-pixoo-purple/20 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-pixoo-purple/10 group-hover:via-background/90 group-hover:to-pixoo-pink/10">
        <div
          className="relative w-full aspect-square bg-gradient-to-br from-muted/50 to-pixoo-purple/10 rounded-lg overflow-hidden border border-pixoo-purple/20"
          style={{
            overflow: "hidden",
          }}
        >
          {image.imageUrl &&
          (image.status === "ready" || image.status === "completed") &&
          !imageError ? (
            <Image
              src={image.imageUrl}
              alt={image.prompt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="transition-transform duration-300 object-cover hover:scale-105"
              style={{
                transform: `scale(${zoom})`,
                objectFit: cropped ? "cover" : "contain",
              }}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-pixoo-purple/5 to-pixoo-pink/5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 mb-2">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-pixoo-purple" />
              </div>
              <span className="text-xs sm:text-sm text-center px-2 bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
                {image.status === "pending"
                  ? t("generating")
                  : t("failedToLoad")}
              </span>
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-tight bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
            {image.prompt}
          </p>
        </div>

        {/* Badges e informações */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Badge
            className={`text-xs border-pixoo-purple/30 ${getModelBadgeColor(
              image.model
            )} hover:shadow-md hover:shadow-pixoo-purple/20 transition-all duration-300`}
          >
            {image.modelName || image.model}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs border-pixoo-purple/30 bg-gradient-to-r from-pixoo-purple/10 to-pixoo-pink/10 hover:border-pixoo-magenta/50 transition-all duration-300"
          >
            {image.aspectRatio}
          </Badge>
        </div>

        {/* Métricas */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
              <Clock className="h-3 w-3 text-pixoo-purple" />
            </div>
            <span className="truncate bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
              {formatTime(image.generationTimeMs)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
              <Zap className="h-3 w-3 text-pixoo-purple" />
            </div>
            <span className="truncate bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
              {image.creditsUsed} {t("credits")}
            </span>
          </div>
        </div>

        {/* Data */}
        <div className="text-xs text-muted-foreground truncate bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
          {formatDistanceToNow(new Date(image.createdAt), {
            addSuffix: true,
            locale: ptBR,
          })}
        </div>

        {/* Ações */}
        {image.imageUrl &&
          (image.status === "ready" || image.status === "completed") &&
          !isSelectionMode && (
            <div className="flex gap-1 sm:gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
                className="px-2 flex-shrink-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
                title="Copiar e reutilizar prompt"
              >
                <Copy className="h-3 w-3 text-pixoo-purple" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditImage}
                className="px-2 flex-shrink-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
                title="Editar imagem"
              >
                <Edit className="h-3 w-3 text-pixoo-purple" />
              </Button>
              {onTogglePublic && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePublic}
                  className={`px-2 flex-shrink-0 transition-all duration-300 hover:shadow-lg ${
                    image.isPublic
                      ? "bg-gradient-to-r from-pixoo-purple to-pixoo-magenta text-white border-0 hover:from-pixoo-purple/90 hover:to-pixoo-magenta/90 shadow-lg shadow-pixoo-purple/30"
                      : "border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 hover:shadow-pixoo-purple/20"
                  }`}
                  title={image.isPublic ? "Tornar privada" : "Tornar pública"}
                >
                  <Globe
                    className={`h-3 w-3 ${
                      image.isPublic ? "text-white" : "text-pixoo-purple"
                    }`}
                  />
                </Button>
              )}
              {onViewFull && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewFull(image.imageUrl!, image.prompt)}
                  className="px-2 flex-shrink-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
                >
                  <Eye className="h-3 w-3 text-pixoo-purple" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(image.imageUrl!, image.prompt)}
                className="px-2 flex-shrink-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
              >
                <Download className="h-3 w-3 text-pixoo-purple" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(image.id)}
                disabled={isDeleting}
                className="px-2 flex-shrink-0 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-lg shadow-red-500/30 transition-all duration-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
