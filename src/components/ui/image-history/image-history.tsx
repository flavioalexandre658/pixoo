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
import { Trash2, X, History, Sparkles } from "lucide-react";
import { SearchBar } from "./search-bar";
import { FilterSelect } from "./filter-select";
import { ZoomControls } from "./zoom-controls";
import { toast } from "sonner";
import { PixooLoading } from "@/components/ui/pixoo-loading";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

import { ImageHistoryCard } from "./image-history-card";
import { getImagesHistory } from "@/actions/images/history/get-images-history.action";
import { deleteImage, deleteMultipleImages } from "@/actions/images/delete";
import { updateImagePublicStatus } from "@/actions/images/update-public-status/update-public-status.action";
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

export function ImageHistory({
  refreshTrigger,
  onPromptReuse,
}: ImageHistoryProps) {
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
    type: "single" | "multiple";
    imageId?: string;
    count?: number;
  }>({ isOpen: false, type: "single" });

  // Estados para paginação
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 12; // Número de imagens por página

  const { executeAsync: executeGetImagesHistory } = useAction(getImagesHistory);
  const { executeAsync: executeDeleteImage } = useAction(deleteImage);
  const { executeAsync: executeDeleteMultipleImages } =
    useAction(deleteMultipleImages);
  const { executeAsync: executeUpdatePublicStatus } = useAction(
    updateImagePublicStatus
  );

  // Hook de scroll infinito
  const { isFetching, setIsFetching, lastElementRef } = useInfiniteScroll(
    hasMore,
    fetchMoreImages,
    { threshold: 100, rootMargin: "100px" }
  );

  // Função para carregar mais imagens
  async function fetchMoreImages() {
    if (isFetching || !hasMore) return;

    try {
      const { data } = await executeGetImagesHistory({
        limit,
        offset,
      });

      if (data?.success && data.data) {
        const newImages = data.data.map((img) => ({
          ...img,
          createdAt: img.createdAt.toString(),
          completedAt: img.completedAt?.toString() || null,
        }));

        if (newImages.length < limit) {
          setHasMore(false);
        }

        setImages((prev) => [...prev, ...newImages]);
        setOffset((prev) => prev + limit);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching more images:", error);
      setHasMore(false);
    } finally {
      setIsFetching(false);
    }
  }

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setOffset(0);
      setHasMore(true);

      const { data } = await executeGetImagesHistory({
        limit,
        offset: 0,
      });

      if (data?.success && data.data) {
        const newImages = data.data.map((img) => ({
          ...img,
          createdAt: img.createdAt.toString(),
          completedAt: img.completedAt?.toString() || null,
        }));

        setImages(newImages);
        setOffset(limit);

        if (newImages.length < limit) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error fetching image history:", error);
    } finally {
      setLoading(false);
    }
  }, [executeGetImagesHistory, limit]);

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger, fetchImages]);

  // Reset paginação quando filtros mudam
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
  }, [search, modelFilter, statusFilter]);

  // Função para detectar dispositivo móvel
  const isMobileDevice = () => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
    );
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      toast.loading("Preparando download...", { id: "download" });

      const isMobile = isMobileDevice();
      let downloadSuccess = false;
      let lastError: Error | null = null;

      // Estratégia 1: Tentar fetch direto primeiro
      if (!downloadSuccess) {
        try {
          const response = await fetch(imageUrl, {
            mode: "cors",
            credentials: "omit",
            headers: {
              "User-Agent": isMobile
                ? "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
                : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            await downloadBlob(blob, `image-${Date.now()}.png`);
            downloadSuccess = true;
          } else {
            lastError = new Error(
              `HTTP ${response.status}: ${response.statusText}`
            );
          }
        } catch (corsError) {
          console.log("Fetch direto falhou:", corsError);
          lastError = corsError as Error;
        }
      }

      // Estratégia 2: Tentar através do proxy
      if (!downloadSuccess) {
        try {
          const response = await fetch(
            `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`,
            {
              headers: {
                "User-Agent": isMobile
                  ? "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
                  : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              },
            }
          );

          if (response.ok) {
            const blob = await response.blob();
            await downloadBlob(blob, `image-${Date.now()}.png`);
            downloadSuccess = true;
          } else {
            lastError = new Error(
              `Proxy HTTP ${response.status}: ${response.statusText}`
            );
          }
        } catch (proxyError) {
          console.log("Proxy falhou:", proxyError);
          lastError = proxyError as Error;
        }
      }

      // Estratégia 3: Para mobile, tentar data URL
      if (!downloadSuccess && isMobile) {
        try {
          const response = await fetch(
            `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
          );

          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onload = () => {
              const dataUrl = reader.result as string;
              const a = document.createElement("a");
              a.href = dataUrl;
              a.download = `image-${Date.now()}.png`;
              a.style.display = "none";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            };

            reader.readAsDataURL(blob);
            downloadSuccess = true;
          }
        } catch (dataUrlError) {
          console.log("Data URL falhou:", dataUrlError);
          lastError = dataUrlError as Error;
        }
      }

      // Estratégia 4: Fallback final - abrir em nova aba (para todos os dispositivos)
      if (!downloadSuccess) {
        try {
          // Tentar abrir a imagem em nova aba como último recurso
          window.open(imageUrl, "_blank");
          toast.success(
            isMobile
              ? "Imagem aberta em nova aba. Pressione e segure para salvar."
              : "Imagem aberta em nova aba. Clique com o botão direito para salvar.",
            { id: "download" }
          );
          downloadSuccess = true;
        } catch (openError) {
          console.log("Abertura em nova aba falhou:", openError);
          lastError = openError as Error;
        }
      }

      // Se ainda não teve sucesso, mostrar erro específico
      if (!downloadSuccess) {
        throw (
          lastError || new Error("Todas as estratégias de download falharam")
        );
      } else if (downloadSuccess && !lastError) {
        toast.success("Imagem baixada com sucesso!", { id: "download" });
      }
    } catch (error) {
      console.error("Error downloading image:", error);

      // Mensagens de erro mais específicas
      let errorMessage = "Falha ao baixar a imagem.";

      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        errorMessage =
          "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (error instanceof Error && error.message.includes("CORS")) {
        errorMessage = "Erro de permissão. Tente usar o botão de visualizar.";
      } else if (error instanceof Error && error.message.includes("HTTP 404")) {
        errorMessage = "Imagem não encontrada. O link pode ter expirado.";
      } else if (error instanceof Error && error.message.includes("HTTP 403")) {
        errorMessage = "Acesso negado. Tente visualizar a imagem em nova aba.";
      } else if (imageUrl.includes("together.ai")) {
        errorMessage = "Link temporário expirado. Tente gerar uma nova imagem.";
      } else if (isMobileDevice()) {
        errorMessage =
          "Erro no download mobile. Tente visualizar a imagem e salvar manualmente.";
      }

      toast.error(errorMessage, { id: "download" });
    }
  };

  // Função auxiliar para download de blob
  const downloadBlob = async (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  };

  const viewFullImage = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDeleteImage = (imageId: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: "single",
      imageId,
    });
  };

  const handleTogglePublic = async (imageId: string, isPublic: boolean) => {
    try {
      const response = await executeUpdatePublicStatus({ imageId, isPublic });

      if (response?.data?.success) {
        // Atualizar o estado local da imagem
        setImages((prevImages) =>
          prevImages.map((img) =>
            img.id === imageId ? { ...img, isPublic } : img
          )
        );
        toast.success(
          response.data.data?.message || "Status atualizado com sucesso"
        );
      } else {
        toast.error(
          response?.data?.errors?._form?.[0] ||
            "Erro ao atualizar status da imagem"
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar status público:", error);
      toast.error("Erro ao atualizar status da imagem");
    }
  };

  const confirmDeleteImage = async () => {
    if (isDeleting || !deleteConfirmation.imageId) return;

    setIsDeleting(true);
    try {
      const result = await executeDeleteImage({
        imageId: deleteConfirmation.imageId,
      });

      if (result?.data?.success) {
        toast.success("Imagem deletada com sucesso!");
        // Remove a imagem da lista local
        setImages((prev) =>
          prev.filter((img) => img.id !== deleteConfirmation.imageId)
        );
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
      setDeleteConfirmation({ isOpen: false, type: "single" });
    }
  };

  const handleDeleteMultipleImages = () => {
    if (selectedImages.size === 0) return;

    setDeleteConfirmation({
      isOpen: true,
      type: "multiple",
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
      setDeleteConfirmation({ isOpen: false, type: "multiple" });
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
        return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300";
      case "flux-dev":
        return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300";
      case "flux-pro":
        return "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300";
      case "flux-pro-1.1":
        return "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300";
      case "flux-pro-1.1-ultra":
        return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300";
      case "flux-realism":
        return "bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border-teal-300";
      case "flux-kontext-dev":
        return "bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300";
      case "flux-kontext-pro":
        return "bg-gradient-to-r from-violet-100 to-violet-200 text-violet-800 border-violet-300";
      case "flux-kontext-max":
        return "bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border-pink-300";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden">
        <Card className="border-pixoo-purple/20 bg-gradient-to-br from-background/95 via-pixoo-purple/5 to-pixoo-pink/5 backdrop-blur-sm shadow-xl shadow-pixoo-purple/10">
          <CardHeader className="border-b border-pixoo-purple/10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                <History className="h-5 w-5 text-pixoo-purple" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                {t("title")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PixooLoading size="md" />
          </CardContent>
        </Card>
      </div>
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
    <div className="relative overflow-hidden">
      {/* Elementos decorativos flutuantes */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 rounded-full blur-xl opacity-60 animate-float" />
      <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-purple/20 rounded-full blur-lg opacity-40 animate-float-delayed" />
      <div className="absolute top-1/2 -right-2 w-8 h-8 bg-gradient-to-br from-pixoo-magenta/20 to-pixoo-pink/20 rounded-full blur-md opacity-50 animate-float-slow" />

      <Card className="border-pixoo-purple/20 bg-gradient-to-br from-background/95 via-pixoo-purple/5 to-pixoo-pink/5 backdrop-blur-sm shadow-xl shadow-pixoo-purple/10 hover:shadow-2xl hover:shadow-pixoo-purple/20 transition-all duration-500">
        <CardHeader className="border-b border-pixoo-purple/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex-shrink-0 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                <History className="h-5 w-5 text-pixoo-purple" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                {t("title")}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {!isSelectionMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSelectionMode(true)}
                  disabled={filteredImages.length === 0}
                  className="whitespace-nowrap border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
                >
                  <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 mr-2">
                    <Sparkles className="h-3 w-3 text-pixoo-purple" />
                  </div>
                  {t("selectLabel")}
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <span className="text-sm text-muted-foreground whitespace-nowrap order-1 w-full sm:w-auto text-center sm:text-left bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
                    {selectedImages.size} {t("selecteds")}
                  </span>
                  <div className="flex gap-2 order-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllImages}
                      disabled={selectedImages.size === filteredImages.length}
                      className="flex-1 sm:flex-none whitespace-nowrap border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300"
                    >
                      <span className="hidden sm:inline">
                        {t("selecteAllButtonLabel")}
                      </span>
                      <span className="sm:hidden">
                        {t("selecteAllButtonLabelMobile")}
                      </span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteMultipleImages}
                      disabled={selectedImages.size === 0 || isDeleting}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-lg shadow-red-500/30 transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">
                        {isDeleting
                          ? t("deletingAllButtonLabel")
                          : t("deleteAllButtonLabel")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="px-2 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300"
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
                    const image = images.find((img) => img.model === model);
                    return {
                      label: image?.modelName || model,
                      value: model,
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
          <p className="text-sm text-muted-foreground mt-2 bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
            {t("description")}
          </p>
        </CardHeader>
        <CardContent>
          {filteredImages.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                  <History className="h-8 w-8 text-pixoo-purple" />
                </div>
                <p className="text-muted-foreground bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
                  {t("noImagesFound")}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {filteredImages.map((image, index) => {
                  const isLastElement = index === filteredImages.length - 1;
                  return (
                    <div
                      key={image.id}
                      className="relative"
                      ref={isLastElement ? lastElementRef : null}
                    >
                      {isSelectionMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={selectedImages.has(image.id)}
                            onCheckedChange={() =>
                              toggleImageSelection(image.id)
                            }
                            className="bg-white/90 border-2 border-pixoo-purple/30 shadow-lg backdrop-blur-sm data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pixoo-purple data-[state=checked]:to-pixoo-magenta data-[state=checked]:border-0"
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
                        onTogglePublic={handleTogglePublic}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Indicadores de carregamento */}
              {isFetching && (
                <div className="flex justify-center py-8">
                  <PixooLoading size="sm" />
                </div>
              )}

              {!hasMore && filteredImages.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground bg-gradient-to-r from-muted-foreground to-pixoo-purple bg-clip-text text-transparent">
                    Todas as imagens foram carregadas
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>

        {/* Modal de Confirmação de Deleção */}
        <AlertDialog
          open={deleteConfirmation.isOpen}
          onOpenChange={(open) =>
            setDeleteConfirmation((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <AlertDialogContent className="border-2 border-pixoo-purple/20 bg-background/98 backdrop-blur-md shadow-2xl">
            {/* Gradiente de fundo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/3 via-transparent to-pixoo-pink/3 rounded-lg" />

            <AlertDialogHeader className="relative">
              <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-red-200">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                Confirmar Deleção
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {deleteConfirmation.type === "single"
                  ? "Tem certeza que deseja deletar esta imagem? Esta ação não pode ser desfeita."
                  : `Tem certeza que deseja deletar ${deleteConfirmation.count} imagem(ns)? Esta ação não pode ser desfeita.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="relative gap-2">
              <AlertDialogCancel
                disabled={isDeleting}
                className="border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={
                  deleteConfirmation.type === "single"
                    ? confirmDeleteImage
                    : confirmDeleteMultipleImages
                }
                disabled={isDeleting}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-lg shadow-red-500/30 transition-all duration-300"
              >
                {isDeleting ? "Deletando..." : "Deletar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite 2s;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite 1s;
        }
      `}</style>
    </div>
  );
}
