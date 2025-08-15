"use client";

import { Search, Filter, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/ui/image-history/search-bar";
import { FilterSelect } from "@/components/ui/image-history/filter-select";

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

  const categoryOptions = [
    { label: t("allCategories"), value: "all" },
    ...categories.map((category) => ({
      label: category.charAt(0).toUpperCase() + category.slice(1),
      value: category,
    })),
  ];

  const modelOptions = [
    { label: t("allModels"), value: "all" },
    ...models.map((model) => ({
      label: model.name,
      value: model.id,
    })),
  ];

  const sortSelectOptions = [
    { label: t("sortBy"), value: "" },
    ...sortOptions.map((option) => ({
      label: option.name,
      value: option.id,
    })),
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="p-4 bg-gradient-to-br from-background/95 via-pixoo-purple/5 to-pixoo-pink/5 backdrop-blur-sm rounded-xl border border-pixoo-purple/20">
        {/* Search Bar */}
        <div className="mb-4">
          <SearchBar
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Category Filter */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                <Filter className="h-3.5 w-3.5 text-pixoo-purple" />
              </div>
            </div>
            <FilterSelect
              options={categoryOptions}
              value={selectedCategory}
              onChange={onCategoryChange}
              placeholder={t("category")}
              className="pl-12"
            />
          </div>

          {/* Model Filter */}
          <FilterSelect
            options={modelOptions}
            value={selectedModel}
            onChange={onModelChange}
            placeholder={t("model")}
          />

          {/* Sort Filter */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                <TrendingUp className="h-3.5 w-3.5 text-pixoo-purple" />
              </div>
            </div>
            <FilterSelect
              options={sortSelectOptions}
              value={sortBy}
              onChange={onSortChange}
              placeholder={t("sortBy")}
              className="pl-12"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
