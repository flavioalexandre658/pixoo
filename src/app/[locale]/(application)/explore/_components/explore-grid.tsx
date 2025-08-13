"use client";

import { useTranslations } from "next-intl";
import { ExploreImageCard } from "./explore-image-card";

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
}

export function ExploreGrid({ images }: ExploreGridProps) {
  const t = useTranslations("explore");

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2">
          {t("noImagesFound")}
        </div>
        <div className="text-sm text-muted-foreground">
          {t("tryAdjustingFilters")}
        </div>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4">
      {images.map((image) => (
        <ExploreImageCard
          key={image.id}
          image={{
            id: image.id,
            url: image.url,
            prompt: image.prompt,
            model: image.model,
            aspectRatio: image.aspectRatio,
            likes: image.likes,
            category: image.category,
            createdAt: image.createdAt,
            user: image.user
          }}
        />
      ))}
    </div>
  );
}
