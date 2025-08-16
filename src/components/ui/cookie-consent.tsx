"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CookieConsentProps {
  className?: string;
}

export const CookieConsent = ({ className }: CookieConsentProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const t = useTranslations("cookieConsent");

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem("cookie-consent");
    if (!hasConsent) {
      // Show banner after a small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    handleClose();
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    handleClose();
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md transition-all duration-300 ease-in-out",
        isAnimating
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0",
        className
      )}
    >
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-xl rounded-2xl border border-pixoo-magenta/20 shadow-2xl shadow-pixoo-purple/10" />
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-2xl" />
      
      <div className="relative p-4 space-y-3">
        {/* Header with icon */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-lg">
            <Cookie className="h-4 w-4 text-pixoo-magenta" />
          </div>
          
          <div className="flex-1 space-y-2">
            {/* Message */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("message")}{" "}
              <Link 
                href="/privacy-policy" 
                className="text-pixoo-magenta hover:text-pixoo-pink transition-colors duration-200 underline underline-offset-2"
              >
                {t("privacyPolicy")}
              </Link>
              .
            </p>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                size="sm"
                className="flex-1 h-8 bg-gradient-to-r from-pixoo-purple to-pixoo-magenta hover:from-pixoo-purple/90 hover:to-pixoo-magenta/90 text-white text-xs font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-pixoo-purple/25"
              >
                {t("accept")}
              </Button>
              
              <Button
                onClick={handleDecline}
                variant="outline"
                size="sm"
                className="flex-1 h-8 border-pixoo-magenta/30 hover:border-pixoo-magenta/50 hover:bg-pixoo-magenta/10 text-xs transition-all duration-200 hover:scale-105"
              >
                {t("decline")}
              </Button>
            </div>
          </div>
          
          {/* Close button */}
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-pixoo-magenta/10 transition-colors duration-200"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};