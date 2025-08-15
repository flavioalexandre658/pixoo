"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

interface AdvancedSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  trigger?: ReactNode;
}

export function AdvancedSettingsDialog({
  isOpen,
  onOpenChange,
  children,
  trigger,
}: AdvancedSettingsDialogProps) {
  const t = useTranslations("generate");

  const defaultTrigger = (
    <Button
      variant="outline"
      size="icon"
      className="border-pixoo-purple/30 hover:border-pixoo-magenta/50 hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-pink/10 transition-all duration-300 hover:shadow-lg hover:shadow-pixoo-purple/20"
    >
      <div className="p-1 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
        <Settings className="h-4 w-4 text-pixoo-purple" />
      </div>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[85vh] border-pixoo-purple/20 bg-background/95 backdrop-blur-sm overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
            {t("advancedOptions")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-pixoo-purple/20 scrollbar-track-transparent">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}