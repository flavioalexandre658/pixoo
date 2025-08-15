import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Crop } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  setZoom: (z: number) => void;
  cropped: boolean;
  setCropped: (c: boolean) => void;
}

export function ZoomControls({
  zoom,
  setZoom,
  cropped,
  setCropped,
}: ZoomControlsProps) {
  return (
    <div className="flex gap-1.5 items-center h-11 px-2 rounded-lg bg-gradient-to-r from-pixoo-purple/5 to-pixoo-pink/5 border border-pixoo-purple/20 backdrop-blur-sm">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
        className="h-7 w-7 p-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
      >
        <ZoomOut className="h-3.5 w-3.5 text-pixoo-purple" />
      </Button>

      <div className="flex-1 min-w-0 px-2">
        <span className="text-xs font-medium bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent block text-center">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setZoom(Math.min(2, zoom + 0.25))}
        className="h-7 w-7 p-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
      >
        <ZoomIn className="h-3.5 w-3.5 text-pixoo-purple" />
      </Button>

      <Button
        variant={cropped ? "default" : "outline"}
        size="sm"
        onClick={() => setCropped(!cropped)}
        title={cropped ? "Ver imagem completa" : "Ver imagem cropped"}
        className={
          cropped
            ? "h-7 w-7 p-0 bg-gradient-to-r from-pixoo-purple to-pixoo-magenta hover:from-pixoo-purple/90 hover:to-pixoo-magenta/90 border-0 shadow-lg shadow-pixoo-purple/30 transition-all duration-300"
            : "h-7 w-7 p-0 border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
        }
      >
        <Crop
          className={`h-3.5 w-3.5 ${
            cropped ? "text-white" : "text-pixoo-purple"
          }`}
        />
      </Button>
    </div>
  );
}
