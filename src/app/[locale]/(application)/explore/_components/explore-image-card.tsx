"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Play, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { likeImage } from "@/actions/images/like/like-image.action";
import { useAction } from "next-safe-action/hooks";

interface ExploreImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  likes: number;
  category: string;
  createdAt: Date;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface ExploreImageCardProps {
  image: ExploreImage;
}

export function ExploreImageCard({ image }: ExploreImageCardProps) {
  const t = useTranslations("explore");
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(image.likes);
  const [isCopied, setIsCopied] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  const { execute: executeLike, isExecuting: isLiking } = useAction(likeImage, {
    onSuccess: (result) => {
      if (result.data && "likes" in result.data && "isLiked" in result.data) {
        setLikes(result.data.likes as number);
        setIsLiked(result.data.isLiked as boolean);
      }
    },
    onError: ({ error }) => {
      console.error("Erro ao curtir imagem:", error);
      // Reverter estado em caso de erro
      setIsLiked(!isLiked);
      setLikes((prev) => (isLiked ? prev + 1 : prev - 1));
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isLiking) return; // Prevenir múltiplos cliques

    const newIsLiked = !isLiked;

    // Atualizar estado otimisticamente
    setIsLiked(newIsLiked);
    setLikes((prev) => (newIsLiked ? prev + 1 : prev - 1));

    // Executar action
    executeLike({
      imageId: image.id,
      isLiked: newIsLiked,
    });
  };

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(image.prompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar prompt:", error);
    }
  };

  const handleCardClick = () => {
    setIsClicked(!isClicked);
  };

  const handleImageError = () => {
    setHasImageError(true);
  };

  // Se a imagem tem erro, não renderizar o card
  if (hasImageError) {
    return null;
  }

  const showOverlay = isHovered || isClicked;

  return (
    <div
      className="relative cursor-pointer break-inside-avoid mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-background/95 to-pixoo-purple/10 backdrop-blur-sm border border-pixoo-purple/20 shadow-lg shadow-pixoo-purple/10 hover:shadow-2xl hover:shadow-pixoo-purple/30 hover:border-pixoo-magenta/40 transition-all duration-500 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{
        aspectRatio: `${image.aspectRatio.replace(":", "/")}`,
      }}
    >
      {/* Elementos decorativos flutuantes */}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-pixoo-purple/30 to-pixoo-magenta/30 rounded-full blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-300 animate-float" />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-pixoo-pink/30 to-pixoo-purple/30 rounded-full blur-sm opacity-0 group-hover:opacity-40 transition-opacity duration-300 animate-float-delayed" />

      {/* Image */}
      <Image
        src={image.url}
        alt={image.prompt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        onError={handleImageError}
      />

      {/* Video Play Button (if applicable) */}
      {image.model.includes("video") && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-gradient-to-br from-pixoo-purple/80 to-pixoo-magenta/80 backdrop-blur-sm rounded-full p-4 shadow-xl shadow-pixoo-purple/30 border border-pixoo-purple/30">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 transition-opacity duration-500",
          showOverlay ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Top Section - User Info and Like */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 p-4 transition-all duration-500",
            showOverlay
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-white/80 shadow-xl shadow-pixoo-purple/30 backdrop-blur-sm">
                {image.user?.avatar ? (
                  <img
                    src={image.user.avatar}
                    alt={image.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-pixoo-purple to-pixoo-magenta text-white">
                    {image.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-white font-semibold text-sm drop-shadow-lg">
                {image.user?.name || "Usuário Anônimo"}
              </span>
            </div>

            <Button
              onClick={handleLike}
              size="sm"
              variant="ghost"
              className={cn(
                "text-white hover:bg-white/20 transition-all duration-300 rounded-full p-2 backdrop-blur-sm border border-white/20 shadow-lg shadow-pixoo-purple/20",
                isLiked && "text-red-400 scale-110 bg-white/10"
              )}
            >
              <Heart
                className={cn(
                  "w-6 h-6",
                  isLiked && "fill-current animate-pulse"
                )}
              />
              <span className="ml-1 font-semibold">{likes}</span>
            </Button>
          </div>
        </div>

        {/* Bottom Section - Prompt and Copy Button */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-4 transition-all duration-500",
            showOverlay
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0"
          )}
        >
          <div className="space-y-3">
            {/* Prompt */}
            <div className="max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              <p className="text-white text-sm leading-relaxed drop-shadow-lg backdrop-blur-sm bg-black/20 rounded-lg p-3 border border-white/10">
                {image.prompt}
              </p>
            </div>

            {/* Copy Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleCopyPrompt}
                size="sm"
                className={cn(
                  "bg-gradient-to-r from-white/90 to-white/80 hover:from-white hover:to-white/90 text-black font-medium transition-all duration-300 rounded-full px-6 shadow-xl shadow-pixoo-purple/30 border border-white/20 backdrop-blur-sm",
                  isCopied &&
                    "bg-gradient-to-r from-green-500 to-green-600 text-white"
                )}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar prompt
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
