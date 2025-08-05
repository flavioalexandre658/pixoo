"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { SearchBar } from "./search-bar";
import { FilterSelect } from "./filter-select";
import { ZoomControls } from "./zoom-controls";

import { ImageHistoryCard } from "./image-history-card";

interface GeneratedImage {
  id: string;
  taskId: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  imageUrl: string | null;
  status: string;
  creditsUsed: number;
  generationTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface ImageHistoryProps {
  refreshTrigger?: number;
}

export function ImageHistory({ refreshTrigger }: ImageHistoryProps) {
  const t = useTranslations("imageHistory");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [zoom, setZoom] = useState(1);
  const [cropped, setCropped] = useState(false);

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/images/history");
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error("Error fetching image history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${prompt
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const viewFullImage = (url: string, prompt: string) => {
    window.open(url, '_blank');
  };

  const formatTime = (timeMs: number | null) => {
    if (!timeMs) return "--";
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  const getModelBadgeColor = (model: string) => {
    switch (model) {
      case "flux-schnell":
        return "bg-green-100 text-green-800";
      case "flux-dev":
        return "bg-blue-100 text-blue-800";
      case "flux-pro":
        return "bg-purple-100 text-purple-800";
      case "flux-pro-1.1":
        return "bg-orange-100 text-orange-800";
      case "flux-pro-1.1-ultra":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredImages = images.filter((img) => {
    const matchesSearch = img.prompt
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesModel = !modelFilter || img.model === modelFilter;
    const matchesStatus = !statusFilter || img.status === statusFilter;
    return matchesSearch && matchesModel && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-2">
          <div className="flex flex-wrap gap-2 flex-1">
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
            />
            <FilterSelect
              options={[...new Set(images.map((img) => img.model))].map(
                (model) => ({ label: model, value: model })
              )}
              value={modelFilter}
              onChange={setModelFilter}
              placeholder={t("allModels")}
            />
            <FilterSelect
              options={[
                { label: t("ready"), value: "ready" },
                { label: t("pending"), value: "pending" },
                { label: t("error"), value: "error" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder={t("allStatus")}
            />
            <ZoomControls
              zoom={zoom}
              setZoom={setZoom}
              cropped={cropped}
              setCropped={setCropped}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t("description")}
        </p>
      </CardHeader>
      <CardContent>
        {filteredImages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("noImagesFound")}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredImages.map((image) => (
              <ImageHistoryCard
                key={image.id}
                image={image}
                getModelBadgeColor={getModelBadgeColor}
                formatTime={formatTime}
                onDownload={downloadImage}
                onViewFull={viewFullImage}
                zoom={zoom}
                cropped={cropped}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
