"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
interface ExploreImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  likes: number;
  category: string;
  createdAt: Date;
}
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Shuffle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ExploreImageCardProps {
  image: ExploreImage;
}

export function ExploreImageCard({ image }: ExploreImageCardProps) {
  const t = useTranslations();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(image.likes);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    // TODO: Implementar like/unlike na API
  };

  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implementar remix - redirecionar para text-to-image com o prompt
    console.log("Remix image:", image.prompt);
  };

  const truncatePrompt = (prompt: string, maxLength: number = 80) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + "...";
  };

  return (
    <div
      className="relative group cursor-pointer break-inside-avoid mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {/* Image */}
        <Image
          src={image.url}
          alt={image.prompt}
          width={400}
          height={600}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Video Play Button (if applicable) */}
        {image.model.includes("video") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-3">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Top Section - User Info */}
          <div
            className={cn(
              "absolute top-0 left-0 right-0 p-4 transition-transform duration-300",
              isHovered ? "translate-y-0" : "-translate-y-full"
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarFallback className="text-xs">AI</AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-sm">
                {image.model}
              </span>
            </div>
          </div>

          {/* Bottom Section - Prompt and Actions */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300",
              isHovered ? "translate-y-0" : "translate-y-full"
            )}
          >
            <div className="space-y-3">
              {/* Prompt */}
              <p className="text-white text-sm leading-relaxed">
                {truncatePrompt(image.prompt)}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleRemix}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  variant="outline"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  {t("explore.remix")}
                </Button>

                <Button
                  onClick={handleLike}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "text-white hover:bg-white/20",
                    isLiked && "text-red-400"
                  )}
                >
                  <Heart
                    className={cn("w-4 h-4 mr-1", isLiked && "fill-current")}
                  />
                  {likes}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
