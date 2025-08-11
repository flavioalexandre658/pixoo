"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Search,
  Image,
  ImageIcon,
  MessageSquare,
  Sparkles,
  Wand2,
  Video,
  History,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
  isActive?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const getNavigationSections = (t: any): NavSection[] => [
  {
    items: [
      {
        icon: Home,
        label: t("home"),
        href: "/",
        isActive: false,
      },
      {
        icon: Search,
        label: t("explore"),
        href: "/explore",
        isActive: false,
      },
    ],
  },
  {
    title: "Image AI",
    items: [
      {
        icon: Image,
        label: t("textToImage"),
        href: "/text-to-image",
        isActive: true,
      },
      {
        icon: ImageIcon,
        label: t("imageToImage"),
        href: "/image-to-image",
        isActive: false,
      },
      {
        icon: MessageSquare,
        label: t("imageToPrompt"),
        href: "/image-to-prompt",
        isActive: false,
      },
      {
        icon: Sparkles,
        label: t("fluxLora"),
        href: "/flux-lora",
        isActive: false,
      },
      {
        icon: Wand2,
        label: t("fluxTools"),
        href: "/flux-tools",
        isActive: false,
      },
    ],
  },
  {
    title: "Flux Designer",
    items: [
      {
        icon: Sparkles,
        label: t("fluxDesigner"),
        href: "/flux-designer",
        isActive: false,
      },
    ],
  },
  {
    title: "Video AI",
    items: [
      {
        icon: Video,
        label: t("textToVideo"),
        href: "/text-to-video",
        isActive: false,
      },
      {
        icon: Video,
        label: t("imageToVideo"),
        href: "/image-to-video",
        isActive: false,
      },
    ],
  },
  {
    title: "My Creations",
    items: [
      {
        icon: History,
        label: t("history"),
        href: "/history",
        isActive: false,
      },
    ],
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = useTranslations("navigation");
  const navigationSections = getNavigationSections(t);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className={cn(
        "flex items-center border-b",
        isCollapsed && !isMobile ? "justify-center p-2" : "justify-between p-4"
      )}>
        <div className={cn(
          "flex items-center",
          isCollapsed && !isMobile ? "justify-center" : "gap-2"
        )}>
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {(!isCollapsed || isMobile) && (
            <span className="font-semibold text-lg">Pixoo</span>
          )}
        </div>
        {!isMobile && !isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {!isMobile && isCollapsed && (
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto space-y-6",
        isCollapsed && !isMobile ? "p-2" : "p-4"
      )}>
        {navigationSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={cn(
            "space-y-2",
            isCollapsed && !isMobile && "space-y-1"
          )}>
            {section.title && (!isCollapsed || isMobile) && (
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={itemIndex}
                    variant={item.isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full h-10",
                      isCollapsed && !isMobile 
                        ? "justify-center p-0 min-w-[2.5rem]" 
                        : "justify-start gap-3 px-3",
                      item.isActive &&
                        "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    )}
                    title={isCollapsed && !isMobile ? item.label : undefined}
                    asChild
                  >
                    <a href={item.href}>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {(!isCollapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {item.badge && (!isCollapsed || isMobile) && (
                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade Button */}
      <div className={cn(
        "border-t",
        isCollapsed && !isMobile ? "p-2" : "p-4"
      )}>
        <Button className={cn(
          "w-full bg-blue-600 hover:bg-blue-700",
          isCollapsed && !isMobile && "h-10 p-0 min-w-[2.5rem]"
        )}>
          {!isCollapsed || isMobile ? t("upgradeToPro") : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex h-screen bg-background border-r transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden fixed top-4 left-4 z-50 h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>
    </>
  );
}
