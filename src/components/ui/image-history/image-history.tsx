"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, X } from "lucide-react";
import { SearchBar } from "./search-bar";
import { FilterSelect } from "./filter-select";
import { ZoomControls } from "./zoom-controls";
import { toast } from "sonner";

import { ImageHistoryCard } from "./image-history-card";
import { getImagesHistory } from "@/actions/images/history/get-images-history.action";
import { deleteImage, deleteMultipleImages } from "@/actions/images/delete";
import { useAction } from "next-safe-action/hooks";

interface GeneratedImage {
  id: string;
  taskId: string;
  prompt: string;
  model: string;
  modelName: string | null;
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
  onPromptReuse?: (prompt: string) => void;
}

export function ImageHistory({ refreshTrigger, onPromptReuse }: ImageHistoryProps) {
  const t = useTranslations("imageHistory");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [zoom, setZoom] = useState(1);
  const [cropped, setCropped] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'single' | 'multiple';
    imageId?: string;
    count?: number;
  }>({ isOpen: false, type: 'single' });
  const { executeAsync: executeGetImagesHistory } = useAction(getImagesHistory);
  const { executeAsync: executeDeleteImage } = useAction(deleteImage);
  const { executeAsync: executeDeleteMultipleImages } =
    useAction(deleteMultipleImages);

  const fetchImages = useCallback(async () => {
    try {
      const { data } = await executeGetImagesHistory({
        limit: 100,
      });
      if (data?.success && data.data) {
        setImages(
          data.data.map((img) => ({
            ...img,
            createdAt: img.createdAt.toString(),
            completedAt: img.completedAt?.toString() || null,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching image history:", error);
    } finally {
      setLoading(false);
    }
  }, [executeGetImagesHistory]);

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger, fetchImages]);

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const viewFullImage = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDeleteImage = (imageId: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'single',
      imageId,
    });
  };

  const confirmDeleteImage = async () => {
    if (isDeleting || !deleteConfirmation.imageId) return;

    setIsDeleting(true);
    try {
      const result = await executeDeleteImage({ imageId: deleteConfirmation.imageId });

      if (result?.data?.success) {
        toast.success("Imagem deletada com sucesso!");
        // Remove a imagem da lista local
        setImages((prev) => prev.filter((img) => img.id !== deleteConfirmation.imageId));
        // Remove da seleção se estiver selecionada
        setSelectedImages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(deleteConfirmation.imageId!);
          return newSet;
        });
      } else {
        toast.error(
          result?.data?.errors?._form?.[0] || "Erro ao deletar imagem"
        );
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Erro ao deletar imagem");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ isOpen: false, type: 'single' });
    }
  };

  const handleDeleteMultipleImages = () => {
    if (selectedImages.size === 0) return;

    setDeleteConfirmation({
      isOpen: true,
      type: 'multiple',
      count: selectedImages.size,
    });
  };

  const confirmDeleteMultipleImages = async () => {
    if (isDeleting || selectedImages.size === 0) return;

    setIsDeleting(true);
    try {
      const imageIds = Array.from(selectedImages);
      const result = await executeDeleteMultipleImages({ imageIds });

      if (result?.data?.success && result.data.data) {
        toast.success(
          `${result.data.data.deletedCount} imagem(ns) deletada(s) com sucesso!`
        );
        // Remove as imagens da lista local
        setImages((prev) => prev.filter((img) => !selectedImages.has(img.id)));
        // Limpa a seleção
        setSelectedImages(new Set());
        setIsSelectionMode(false);
      } else {
        toast.error(
          result?.data?.errors?._form?.[0] || "Erro ao deletar imagens"
        );
      }
    } catch (error) {
      console.error("Error deleting multiple images:", error);
      toast.error("Erro ao deletar imagens");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ isOpen: false, type: 'multiple' });
    }
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const selectAllImages = () => {
    const allImageIds = filteredImages.map((img) => img.id);
    setSelectedImages(new Set(allImageIds));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
    setIsSelectionMode(false);
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
      case "flux-realism":
        return "bg-teal-100 text-teal-800";
      case "flux-kontext-dev":
        return "bg-indigo-100 text-indigo-800";
      case "flux-kontext-pro":
        return "bg-violet-100 text-violet-800";
      case "flux-kontext-max":
        return "bg-pink-100 text-pink-800";
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex-shrink-0">{t("title")}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {!isSelectionMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSelectionMode(true)}
                disabled={filteredImages.length === 0}
                className="whitespace-nowrap"
              >
                Selecionar
              </Button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <span className="text-sm text-muted-foreground whitespace-nowrap order-1 w-full sm:w-auto text-center sm:text-left">
                  {selectedImages.size} selecionada(s)
                </span>
                <div className="flex gap-2 order-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllImages}
                    disabled={selectedImages.size === filteredImages.length}
                    className="flex-1 sm:flex-none whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Selecionar Todas</span>
                    <span className="sm:hidden">Todas</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteMultipleImages}
                    disabled={selectedImages.size === 0 || isDeleting}
                    className="flex-1 sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{isDeleting ? "Deletando..." : "Deletar"}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearSelection}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="sm:col-span-2 lg:col-span-1">
              <SearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
              />
            </div>
            <FilterSelect
              options={[...new Set(images.map((img) => img.model))].map(
                (model) => {
                  const image = images.find(img => img.model === model);
                  return { 
                    label: image?.modelName || model, 
                    value: model 
                  };
                }
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
        <p className="text-sm text-muted-foreground mt-2">{t("description")}</p>
      </CardHeader>
      <CardContent>
        {filteredImages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("noImagesFound")}</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredImages.map((image) => (
              <div key={image.id} className="relative">
                {isSelectionMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedImages.has(image.id)}
                      onCheckedChange={() => toggleImageSelection(image.id)}
                      className="bg-white border-2 border-gray-300 shadow-sm"
                    />
                  </div>
                )}
                <ImageHistoryCard
                  image={image}
                  getModelBadgeColor={getModelBadgeColor}
                  formatTime={formatTime}
                  onDownload={downloadImage}
                  onViewFull={viewFullImage}
                  onDelete={handleDeleteImage}
                  zoom={zoom}
                  cropped={cropped}
                  isSelectionMode={isSelectionMode}
                  isDeleting={isDeleting}
                  onPromptReuse={onPromptReuse}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de Confirmação de Deleção */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => 
        setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirmation.type === 'single' 
                ? 'Confirmar deleção de imagem'
                : 'Confirmar deleção de múltiplas imagens'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation.type === 'single' 
                ? 'Tem certeza que deseja deletar esta imagem? Esta ação não pode ser desfeita.'
                : `Tem certeza que deseja deletar ${deleteConfirmation.count} imagem(ns)? Esta ação não pode ser desfeita.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteConfirmation.type === 'single' ? confirmDeleteImage : confirmDeleteMultipleImages}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
