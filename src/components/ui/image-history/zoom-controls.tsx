import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Crop } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  setZoom: (z: number) => void;
  cropped: boolean;
  setCropped: (c: boolean) => void;
}

export function ZoomControls({ zoom, setZoom, cropped, setCropped }: ZoomControlsProps) {
  return (
    <div className="flex gap-2 items-center">
      <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}><ZoomOut className="h-4 w-4" /></Button>
      <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
      <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.25))}><ZoomIn className="h-4 w-4" /></Button>
      <Button variant={cropped ? "default" : "outline"} size="icon" onClick={() => setCropped(!cropped)} title={cropped ? "Ver imagem completa" : "Ver imagem cropped"}>
        <Crop className="h-4 w-4" />
      </Button>
    </div>
  );
}