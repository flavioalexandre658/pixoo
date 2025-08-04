"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GeneratedImage {
  id: string;
  taskId: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  imageUrl: string | null;
  status: string;
  creditsUsed: number;
  generationTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface ImageHistoryProps {
  refreshTrigger?: number;
}

export function ImageHistory({ refreshTrigger }: ImageHistoryProps) {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/images/history");
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error("Error fetching image history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${prompt
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const formatTime = (timeMs: number | null) => {
    if (!timeMs) return "--";
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  const getModelBadgeColor = (model: string) => {
    switch (model) {
      case "flux-schnell":
        return "bg-green-100 text-green-800";
      case "flux-dev":
        return "bg-blue-100 text-blue-800";
      case "flux-pro":
        return "bg-purple-100 text-purple-800";
      case "flux-pro-1.1":
        return "bg-orange-100 text-orange-800";
      case "flux-pro-1.1-ultra":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Imagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Imagens</CardTitle>
        <p className="text-sm text-muted-foreground">
          Suas últimas imagens geradas com detalhes de tempo e créditos
        </p>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma imagem gerada ainda</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="border rounded-lg p-4 space-y-3">
                {/* Imagem */}
                {image.imageUrl && image.status === "ready" ? (
                  <div className="relative aspect-square">
                    <Image
                      src={image.imageUrl}
                      alt={image.prompt}
                      width={200}
                      height={128}
                      className="w-full h-32 object-cover rounded-md"
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
                      onClick={() =>
                        downloadImage(image.imageUrl!, image.prompt)
                      }
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
