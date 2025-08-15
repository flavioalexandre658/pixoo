"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PixooLoadingProps {
  title?: string;
  subtitle?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PixooLoading({
  title = "Carregando...",
  subtitle,
  className,
  size = "md",
}: PixooLoadingProps) {
  const sizeClasses = {
    sm: {
      container: "py-8",
      title: "text-2xl md:text-3xl",
      spinner: "h-8 w-8",
      icon: "w-4 h-4",
      background: "w-40 h-40",
    },
    md: {
      container: "py-16",
      title: "text-4xl md:text-5xl",
      spinner: "h-12 w-12",
      icon: "w-6 h-6",
      background: "w-60 h-60",
    },
    lg: {
      container: "py-24",
      title: "text-5xl md:text-6xl",
      spinner: "h-16 w-16",
      icon: "w-8 h-8",
      background: "w-80 h-80",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        currentSize.container,
        className
      )}
    >
      {/* Background elements */}
      <div
        className={cn(
          "absolute top-20 left-20 bg-gradient-to-br from-pixoo-purple/10 to-pixoo-pink/10 rounded-full blur-3xl animate-pulse",
          currentSize.background
        )}
      />
      <div
        className={cn(
          "absolute bottom-20 right-20 bg-gradient-to-br from-pixoo-magenta/8 to-pixoo-purple/8 rounded-full blur-3xl animate-pulse delay-1000",
          currentSize.background
        )}
      />

      <div className="relative z-10 h-full w-full text-center">
        <h2
          className={cn(
            "mb-12 px-6 font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-pixoo-magenta bg-clip-text text-transparent",
            currentSize.title
          )}
        >
          {title}
        </h2>

        {subtitle && (
          <p className="mb-12 px-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}

        <div className="flex justify-center">
          <div className="relative">
            <div
              className={cn(
                "animate-spin rounded-full border-4 border-pixoo-purple/20 border-t-pixoo-magenta",
                currentSize.spinner
              )}
            ></div>
            <Sparkles
              className={cn(
                "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-pixoo-pink animate-pulse",
                currentSize.icon
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
