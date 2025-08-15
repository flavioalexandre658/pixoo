"use client";

import { useTranslations } from "next-intl";
import { ExploreImageCard } from "./explore-image-card";
import { Search } from "lucide-react";

interface GridImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  modelName?: string;
  aspectRatio: string;
  likes: number;
  category: string;
  createdAt: Date;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface ExploreGridProps {
  images: GridImage[];
  lastElementRef?: (node: HTMLElement | null) => void;
}

export function ExploreGrid({ images, lastElementRef }: ExploreGridProps) {
  const t = useTranslations("explore");

  if (images.length === 0) {
    return (
      <div className="relative overflow-hidden">
        {/* Elementos decorativos flutuantes */}
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 rounded-full blur-xl opacity-60 animate-float" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-purple/20 rounded-full blur-lg opacity-40 animate-float-delayed" />
        <div className="absolute top-1/2 -right-2 w-8 h-8 bg-gradient-to-br from-pixoo-magenta/20 to-pixoo-pink/20 rounded-full blur-md opacity-50 animate-float-slow" />

        <div className="text-center py-16 px-8 bg-gradient-to-br from-background/95 via-pixoo-purple/5 to-pixoo-pink/5 backdrop-blur-sm rounded-xl border-2 border-dashed border-pixoo-purple/30 shadow-xl shadow-pixoo-purple/10 hover:border-pixoo-magenta/40 transition-all duration-500">
          <div className="flex flex-col items-center gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 shadow-lg shadow-pixoo-purple/20">
              <Search className="h-12 w-12 text-pixoo-purple" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                {t("noImages")}
              </h3>
              <p className="text-muted-foreground">
                {t("noImagesDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Elementos decorativos flutuantes para o grid */}
      <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-magenta/15 rounded-full blur-lg opacity-50 animate-float" />
      <div className="absolute bottom-1/4 -left-2 w-6 h-6 bg-gradient-to-br from-pixoo-pink/15 to-pixoo-purple/15 rounded-full blur-md opacity-40 animate-float-delayed" />

      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            ref={index === images.length - 1 ? lastElementRef : undefined}
            className="break-inside-avoid mb-4"
          >
            <ExploreImageCard
              image={{
                id: image.id,
                url: image.url,
                prompt: image.prompt,
                model: image.model,
                aspectRatio: image.aspectRatio,
                likes: image.likes,
                category: image.category,
                createdAt: image.createdAt,
                user: image.user,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
