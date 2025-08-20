"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";

interface OptimizePromptButtonProps {
  onClick: () => void;
  isOptimizing: boolean;
  disabled?: boolean;
  className?: string;
}

export function OptimizePromptButton({
  onClick,
  isOptimizing,
  disabled = false,
  className = "",
}: OptimizePromptButtonProps) {
  const t = useTranslations("common");
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [hasShownTooltip, setHasShownTooltip] = useState(false);

  // Mostrar tooltip automaticamente quando o botão aparecer pela primeira vez
  useEffect(() => {
    if (!hasShownTooltip) {
      const timer = setTimeout(() => {
        setIsTooltipOpen(true);
        setHasShownTooltip(true);
      }, 500); // Delay de 500ms para dar tempo do botão renderizar

      return () => clearTimeout(timer);
    }
  }, [hasShownTooltip]);

  return (
    <TooltipProvider>
      <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-pixoo-purple/20 hover:to-pixoo-pink/20 transition-all duration-300 ${className}`}
            onClick={onClick}
            disabled={isOptimizing || disabled}
          >
            {isOptimizing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-pixoo-purple/30 border-t-pixoo-magenta" />
            ) : (
              <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
                <Zap className="h-3 w-3 text-pixoo-purple" />
              </div>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="center"
          className="bg-gradient-to-br from-pixoo-purple/95 to-pixoo-magenta/95 backdrop-blur-sm border border-pixoo-purple/30 shadow-xl rounded-md px-2 py-1 relative"
          sideOffset={-1}
        >
          <div className="flex items-center gap-1.5 p-1">
            <Zap className="h-3 w-3 text-white/90" />
            <span className="text-xs font-medium text-white/95">
              {t("optimize")}
            </span>
          </div>

          <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-gradient-to-br from-pixoo-purple/95 to-pixoo-magenta/95 border-l border-t border-pixoo-purple/30 rotate-45" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}