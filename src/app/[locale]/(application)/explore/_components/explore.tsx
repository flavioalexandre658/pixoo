"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  PageContainer,
  PageContainerHeader,
} from "@/components/ui/page-container/page-container";
import { ExploreFilters } from "./explore-filters";
import { ExploreGrid } from "./explore-grid";
import { Sparkles } from "lucide-react";
import { PixooLoading } from "@/components/ui/pixoo-loading";

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

function ExplorePage({ images }: ExplorePageProps) {
  const t = useTranslations("explore");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get unique categories and models from the data
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(images.map((img) => img.category).filter(Boolean)),
    ] as string[];
    return uniqueCategories;
  }, [images]);

  const models = useMemo(() => {
    const uniqueModels = [...new Set(images.map((img) => img.model))];
    return uniqueModels.map((model) => {
      const imageWithModel = images.find((img) => img.model === model);
      return {
        name: imageWithModel?.modelName || model,
        id: model,
      };
    });
  }, [images]);

  const filteredImages = useMemo(() => {
    return images.filter((image) => {
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
  }, [images, selectedCategory, selectedModel, searchTerm]);

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

  // Transform data for ExploreGrid component
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

          <ExploreGrid images={gridImages} />
        </div>
      </PageContainer>
    </div>
  );
}

export default ExplorePage;
