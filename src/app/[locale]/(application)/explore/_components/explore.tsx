"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  PageContainer,
  PageContainerHeader,
} from "@/components/ui/page-container/page-container";
import { ExploreFilters } from "./explore-filters";
import { ExploreGrid } from "./explore-grid";
import { Sparkles } from "lucide-react";
import { PixooLoading } from "@/components/ui/pixoo-loading";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useAction } from "next-safe-action/hooks";
import { getPublicImages } from "@/actions/images/get/get-public-images.action";

interface ExploreImage {
  id: string;
  prompt: string;
  imageUrl: string | null;
  model: string;
  modelName?: string;
  aspectRatio: string;
  likes: number;
  category: string | null;
  createdAt: Date;
  user?: {
    name: string;
    email: string;
  };
}

interface ExplorePageProps {
  images: ExploreImage[];
}

function ExplorePage({ images: initialImages }: ExplorePageProps) {
  const t = useTranslations("explore");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para paginação
  const [allImages, setAllImages] = useState<ExploreImage[]>(initialImages);
  const [offset, setOffset] = useState(initialImages.length);
  const [hasMore, setHasMore] = useState(initialImages.length >= 50); // Assumindo que o limite inicial é 50
  const [isFetching, setIsFetching] = useState(false);
  const limit = 20; // Imagens por página

  // Action para buscar mais imagens
  const { execute: executeGetPublicImages } = useAction(getPublicImages, {
    onSuccess: (result) => {
      if (result.data?.success && result.data.data) {
        const newImages = result.data.data as ExploreImage[];
        setAllImages((prev) => [...prev, ...newImages]);
        setOffset((prev) => prev + newImages.length);
        setHasMore(result.data.hasMore || false);
      }
      setIsFetching(false);
    },
    onError: (error) => {
      console.error("Erro ao carregar mais imagens:", error);
      setIsFetching(false);
    },
  });

  // Função para carregar mais imagens
  const fetchMoreImages = useCallback(async () => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);
    await executeGetPublicImages({
      limit,
      offset,
    });
  }, [executeGetPublicImages, isFetching, hasMore, limit, offset]);

  // Hook de scroll infinito - CORRIGIDO: passando os parâmetros corretos
  const { lastElementRef } = useInfiniteScroll(hasMore, fetchMoreImages, {
    threshold: 0.8,
    rootMargin: "200px",
  });

  // Reset da paginação quando os filtros mudam
  useEffect(() => {
    setOffset(initialImages.length);
    setHasMore(initialImages.length >= 50);
    setAllImages(initialImages);
  }, [selectedCategory, selectedModel, sortBy, searchTerm, initialImages]);

  // Get unique categories and models from the data
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(allImages.map((img) => img.category).filter(Boolean)),
    ] as string[];
    return uniqueCategories;
  }, [allImages]);

  const models = useMemo(() => {
    const uniqueModels = [...new Set(allImages.map((img) => img.model))];
    return uniqueModels.map((model) => {
      const imageWithModel = allImages.find((img) => img.model === model);
      return {
        name: imageWithModel?.modelName || model,
        id: model,
      };
    });
  }, [allImages]);

  const filteredImages = useMemo(() => {
    return allImages.filter((image) => {
      if (!image.imageUrl) return false;

      const matchesCategory =
        selectedCategory === "all" || image.category === selectedCategory;
      const matchesModel =
        selectedModel === "all" || image.model === selectedModel;
      const matchesSearch = image.prompt
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesModel && matchesSearch;
    });
  }, [allImages, selectedCategory, selectedModel, searchTerm]);

  const sortedImages = useMemo(() => {
    return [...filteredImages].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.likes - a.likes;
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });
  }, [filteredImages, sortBy]);

  // Transform data for ExploreGrid component - CORRIGIDO: removendo a propriedade ref
  const gridImages = sortedImages.map((image) => ({
    id: image.id,
    url: image.imageUrl!,
    prompt: image.prompt,
    model: image.model,
    modelName: image.modelName,
    aspectRatio: image.aspectRatio,
    likes: image.likes,
    category: image.category || "general",
    createdAt: image.createdAt,
    user: image.user
      ? {
          name: image.user.name,
          avatar: undefined, // Não temos avatar no banco ainda
        }
      : undefined,
  }));

  // Se houver loading, mostrar o PixooLoading
  if (isLoading) {
    return (
      <div className="relative overflow-hidden">
        <PageContainer>
          <PageContainerHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 shadow-lg shadow-pixoo-purple/20">
                <Sparkles className="h-6 w-6 text-pixoo-purple" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent">
                  {t("title")}
                </h1>
                <p className="text-muted-foreground mt-2 bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
                  {t("description")}
                </p>
              </div>
            </div>
          </PageContainerHeader>

          <PixooLoading size="lg" />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <PageContainer>
        <PageContainerHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 shadow-lg shadow-pixoo-purple/20">
              <Sparkles className="h-6 w-6 text-pixoo-purple" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent">
                {t("title")}
              </h1>
              <p className="text-muted-foreground mt-2 bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
                {t("description")}
              </p>
            </div>
          </div>
        </PageContainerHeader>

        <div className="space-y-6">
          <ExploreFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            sortBy={sortBy}
            onSortChange={setSortBy}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            models={models}
            categories={categories}
          />

          <ExploreGrid images={gridImages} lastElementRef={lastElementRef} />

          {/* Indicadores de carregamento */}
          {isFetching && (
            <div className="flex justify-center py-8">
              <PixooLoading size="md" />
            </div>
          )}

          {/* Mensagem quando todas as imagens foram carregadas */}
          {!hasMore && !isFetching && gridImages.length > 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("allImagesLoaded")}</p>
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}

export default ExplorePage;
