"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Marquee from "@/components/ui/marquee";
import { PixooLoading } from "@/components/ui/pixoo-loading";
import { getPublicImages } from "@/actions/images/get/get-public-images.action";
import { useTranslations } from "next-intl";

interface PublicImage {
  id: string;
  prompt: string;
  imageUrl: string | null;
  model: string;
  modelName: string | null;
  aspectRatio: string;
  likes: number;
  category: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  } | null;
}

const PublicImages = () => {
  const [images, setImages] = useState<PublicImage[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await getPublicImages({ limit: 20 });
        if (response?.data?.success) {
          setImages(response.data.data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar imagens públicas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Filtrar apenas imagens válidas
  const validImages = images.filter((img) => img.imageUrl);

  if (loading) {
    return <PixooLoading className="py-16" />;
  }

  return (
    <div
      id="testimonials"
      className="relative flex items-center justify-center py-16 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute top-20 left-20 w-60 h-60 bg-gradient-to-br from-pixoo-purple/10 to-pixoo-pink/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-pixoo-magenta/8 to-pixoo-purple/8 rounded-full blur-3xl" />

      <div className="relative z-10 h-full w-full">
        <div className="text-center mb-16">
          <h2 className="mb-6 px-6 text-4xl font-bold tracking-tight md:text-5xl bg-gradient-to-br from-foreground via-foreground to-pixoo-magenta bg-clip-text text-transparent">
            Galeria da Comunidade
          </h2>
          <p className="mb-12 px-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Descubra criações incríveis feitas por nossa comunidade de artistas
          </p>
        </div>

        {validImages.length > 0 ? (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 z-10 w-[15%] bg-gradient-to-r from-background to-transparent" />
            <div className="absolute inset-y-0 right-0 z-10 w-[15%] bg-gradient-to-l from-background to-transparent" />
            <Marquee className="[--duration:60s]">
              <ImageList images={validImages.slice(0, 10)} />
            </Marquee>
            <Marquee reverse className="mt-6 [--duration:60s]">
              <ImageList images={validImages.slice(10, 20)} />
            </Marquee>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-pixoo-magenta" />
            </div>
            <p className="text-lg">
              Nenhuma imagem pública disponível no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ImageList = ({ images }: { images: PublicImage[] }) =>
  images.map((image) => <ImageCard key={image.id} image={image} />);

const ImageCard = ({ image }: { image: PublicImage }) => {
  const [hasImageError, setHasImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageError = () => {
    setHasImageError(true);
  };

  if (hasImageError || !image.imageUrl) {
    return null;
  }

  return (
    <div
      className="relative cursor-pointer break-inside-avoid mx-3 rounded-2xl overflow-hidden bg-gradient-to-br from-background to-background/50 group min-w-[300px] max-w-[340px] shadow-lg hover:shadow-2xl hover:shadow-pixoo-purple/20 transition-all duration-500 hover:scale-105 border border-border/50 hover:border-pixoo-magenta/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        aspectRatio: `${image.aspectRatio.replace(":", "/")}`,
      }}
    >
      <Image
        src={image.imageUrl}
        alt={image.prompt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="340px"
        onError={handleImageError}
      />

      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 transition-all duration-500",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Top Section - Likes */}
        <div
          className={cn(
            "absolute top-4 right-4 transition-all duration-500",
            isHovered
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0"
          )}
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-pixoo-purple/90 to-pixoo-magenta/90 rounded-full px-4 py-2 backdrop-blur-sm shadow-lg border border-pixoo-purple/30">
            <Heart className="w-4 h-4 text-white fill-current" />
            <span className="text-white text-sm font-semibold">
              {image.likes}
            </span>
          </div>
        </div>

        {/* Bottom Section - Prompt */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-6 transition-all duration-500",
            isHovered
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0"
          )}
        >
          <div className="bg-gradient-to-t from-black/60 to-transparent p-4 rounded-t-xl">
            <p className="text-white text-sm leading-relaxed line-clamp-2 drop-shadow-lg font-medium">
              {image.prompt}
            </p>
            {image.user && (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-6 h-6 bg-gradient-to-br from-pixoo-purple to-pixoo-magenta rounded-full flex items-center justify-center border border-pixoo-purple/30 shadow-sm">
                  <span className="text-white text-xs font-bold">
                    {image.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-white/80 text-xs">por {image.user.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicImages;
