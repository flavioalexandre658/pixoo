import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Clock, Zap, AlertTriangle } from "lucide-react";
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
  getModelBadgeColor: (model: string) => string;
  formatTime: (ms: number | null) => string;
  onDownload: (url: string, prompt: string) => void;
  zoom: number;
  cropped: boolean;
}

export function ImageHistoryCard({ image, getModelBadgeColor, formatTime, onDownload, zoom, cropped }: ImageHistoryCardProps) {
  const [imageError, setImageError] = useState(false);

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
              {image.status === 'pending' ? 'Gerando...' : 'Falha ao carregar imagem'}
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