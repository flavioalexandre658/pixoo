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

  return (
    <div className="relative overflow-hidden">
      {/* Elementos decorativos flutuantes de fundo */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-magenta/15 rounded-full blur-2xl opacity-60 animate-float" />
      <div className="absolute top-1/4 -left-8 w-16 h-16 bg-gradient-to-br from-pixoo-pink/15 to-pixoo-purple/15 rounded-full blur-xl opacity-40 animate-float-delayed" />
      <div className="absolute bottom-1/3 -right-4 w-12 h-12 bg-gradient-to-br from-pixoo-magenta/15 to-pixoo-pink/15 rounded-full blur-lg opacity-50 animate-float-slow" />
      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-br from-pixoo-purple/10 to-pixoo-magenta/10 rounded-full blur-2xl opacity-30 animate-float" />

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
