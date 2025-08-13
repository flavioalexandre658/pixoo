"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Search,
  Image,
  Sparkles,
  Wand2,
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

const getNavigationSections = (t: any, currentPath: string): NavSection[] => [
  {
    items: [
      {
        icon: Home,
        label: t("home"),
        href: "/",
        isActive: currentPath === "/",
      },
      {
        icon: Search,
        label: t("explore"),
        href: "/explore",
        isActive: currentPath === "/explore",
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
        isActive: currentPath === "/text-to-image",
      },
      {
        icon: Wand2,
        label: t("imageEditing"),
        href: "/image-editing",
        isActive: currentPath === "/image-editing",
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
        isActive: currentPath === "/history",
      },
    ],
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const t = useTranslations("navigation");
  const pathname = usePathname();

  useEffect(() => {
    // Remove locale from pathname (e.g., /pt/text-to-image -> /text-to-image)
    const pathWithoutLocale =
      pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
    setCurrentPath(pathWithoutLocale);
  }, [pathname]);

  const navigationSections = getNavigationSections(t, currentPath);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b",
          isCollapsed && !isMobile
            ? "justify-center p-2"
            : "justify-between p-4"
        )}
      >
        <div
          className={cn(
            "flex items-center",
            isCollapsed && !isMobile ? "justify-center" : "gap-2"
          )}
        >
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
      <nav
        className={cn(
          "flex-1 overflow-y-auto space-y-6",
          isCollapsed && !isMobile ? "p-2" : "p-4"
        )}
      >
        {navigationSections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className={cn("space-y-2", isCollapsed && !isMobile && "space-y-1")}
          >
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
                    suppressHydrationWarning
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
      <div className={cn("border-t", isCollapsed && !isMobile ? "p-2" : "p-4")}>
        <Button
          className={cn(
            "w-full bg-blue-600 hover:bg-blue-700",
            isCollapsed && !isMobile && "h-10 p-0 min-w-[2.5rem]"
          )}
        >
          {!isCollapsed || isMobile ? (
            t("upgradeToPro")
          ) : (
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
