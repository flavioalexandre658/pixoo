"use client";

import { Search, Filter, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExploreFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  models: { id: string; name: string }[];
  categories: string[];
}

export function ExploreFilters({
  selectedCategory,
  onCategoryChange,
  selectedModel,
  onModelChange,
  sortBy,
  onSortChange,
  searchTerm,
  onSearchChange,
  models,
  categories,
}: ExploreFiltersProps) {
  const t = useTranslations("explore");
  
  const sortOptions = [
    { id: "recent", name: t("mostRecent") },
    { id: "popular", name: t("mostPopular") },
  ];
  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Model Filter */}
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("model")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allModels")}</SelectItem>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Filter */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <TrendingUp className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("sortBy")} />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}