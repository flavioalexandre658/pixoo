import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  zoom: number;
  cropped: boolean;
  getModelBadgeColor: (model: string) => string;
  formatTime: (ms: number | null) => string;
  onDownload: (url: string, prompt: string) => void;
}

export function ImageHistoryCard({ image, zoom, cropped, getModelBadgeColor, formatTime, onDownload }: ImageHistoryCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Imagem */}
      {image.imageUrl && image.status === "ready" ? (
        <div className="relative aspect-square">
          <Image
            src={image.imageUrl}
            alt={image.prompt}
            width={200 * zoom}
            height={450 * zoom}
            className={`w-full ${cropped ? 'h-32 object-cover' : 'h-auto object-contain'} rounded-md transition-all`}
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
      ) : (
        <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
          <div className="text-gray-400 text-sm">
            {image.status === "pending" ? "Gerando..." : "Erro"}
          </div>
        </div>
      )}
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
          {image.creditsUsed} créditos
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
      {image.imageUrl && image.status === "ready" && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(image.imageUrl!, image.prompt)}
            className="flex-1"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
}