"use client";

import { useState } from "react";
import { Heart, Download, Share2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface GridImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  likes: number;
  category: string;
  createdAt: Date;
}

interface ExploreGridProps {
  images: GridImage[];
}

export function ExploreGrid({ images }: ExploreGridProps) {
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());

  const handleLike = (imageId: string) => {
    setLikedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${prompt.slice(0, 50)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (image: GridImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Generated Image",
          text: image.prompt,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2">
          No images found
        </div>
        <div className="text-sm text-muted-foreground">
          Try adjusting your filters or search terms
        </div>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4">
      {images.map((image) => {
        const isLiked = likedImages.has(image.id);

        return (
          <Card
            key={image.id}
            className="group overflow-hidden hover:shadow-lg transition-all duration-300 break-inside-avoid mb-4"
          >
            <div className="relative overflow-hidden">
              <Image
                src={image.url}
                alt={image.prompt}
                width={400}
                height={600}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleLike(image.id)}
                    className={`${
                      isLiked ? "text-red-500" : "text-white"
                    } hover:text-red-500`}
                  >
                    <Heart
                      className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(image.url, image.prompt)}
                    className="text-white hover:text-blue-500"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleShare(image)}
                    className="text-white hover:text-green-500"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Category badge */}
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 bg-black/70 text-white border-0"
              >
                {image.category}
              </Badge>
            </div>

            {/* Image info */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {image.prompt}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-xs truncate">
                  {image.model}
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {image.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {Math.floor(parseInt(image.id.slice(-3), 16) % 900) + 100}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
