"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageContainer, PageContainerHeader } from "@/components/ui/page-container/page-container";
import { ExploreFilters } from "./explore-filters";
import { ExploreGrid } from "./explore-grid";

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
    const uniqueCategories = [...new Set(images.map(img => img.category).filter(Boolean))] as string[];
    return uniqueCategories;
  }, [images]);

  const models = useMemo(() => {
    const uniqueModels = [...new Set(images.map(img => img.model))];
    return uniqueModels.map(model => {
      const imageWithModel = images.find(img => img.model === model);
      return { 
        name: imageWithModel?.modelName || model, 
        id: model 
      };
    });
  }, [images]);

  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      if (!image.imageUrl) return false;
      
      const matchesCategory = selectedCategory === "all" || image.category === selectedCategory;
      const matchesModel = selectedModel === "all" || image.model === selectedModel;
      const matchesSearch = image.prompt.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesModel && matchesSearch;
    });
  }, [images, selectedCategory, selectedModel, searchTerm]);

  const sortedImages = useMemo(() => {
    return [...filteredImages].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.likes - a.likes;
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
    user: image.user ? {
      name: image.user.name,
      avatar: undefined, // Não temos avatar no banco ainda
    } : undefined,
  }));

  return (
    <PageContainer>
      <PageContainerHeader>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("description")}
        </p>
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
  );
}

export default ExplorePage;
