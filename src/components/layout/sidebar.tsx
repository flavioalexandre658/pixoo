"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Logo from "@/components/branding/logo";
import {
  Search,
  Sparkles,
  Wand2,
  Image as ImgIcon,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SubscriptionRequiredModal } from "@/components/modals/subscription-required-modal";

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
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
      /* {
        icon: Home,
        label: t("home"),
        href: "/",
        isActive: currentPath === "/",
      },*/
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
        icon: ImgIcon,
        label: t("textToImage"),
        href: "/create-image",
        isActive: currentPath === "/create-image",
      },
      {
        icon: Wand2,
        label: t("imageEditing"),
        href: "/edit-image",
        isActive: currentPath === "/edit-image",
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

export function Sidebar({ className, isMobile = false, isCollapsed, onCollapsedChange }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = typeof isCollapsed === "boolean" ? isCollapsed : internalCollapsed;
  const setCollapsed = typeof onCollapsedChange === "function" ? onCollapsedChange : setInternalCollapsed;
  const [showPlansModal, setShowPlansModal] = useState(false);
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  // Remove locale from pathname immediately (e.g., /pt/create-image -> /create-image)
  const currentPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

  const navigationSections = getNavigationSections(t, currentPath);

  const SidebarContent = () => (
    <div
      className={cn("flex h-full flex-col relative overflow-hidden", className)}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-pixoo-pink/5 to-pixoo-magenta/10 -z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent -z-10" />

      {/* Floating decorative elements */}
      <div className="absolute top-10 left-2 w-12 h-12 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-2 w-16 h-16 bg-gradient-to-br from-pixoo-purple/15 to-pixoo-pink/15 rounded-full blur-2xl animate-pulse delay-1000" />

      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-pixoo-purple/20 backdrop-blur-sm bg-card/80",
          collapsed && !isMobile
            ? "justify-center p-2"
            : "justify-between p-[12px]"
        )}
      >
        <Logo
          width={32}
          height={32}
          customLogo="../images/icon.svg"
          showText={!collapsed || isMobile}
          className={cn(
            "flex items-center",
            collapsed && !isMobile ? "justify-center" : "gap-2"
          )}
        />
        {!isMobile && !collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 flex-shrink-0 hover:bg-pixoo-purple/10 transition-all duration-300"
          >
            <ChevronLeft className="h-4 w-4 text-pixoo-purple" />
          </Button>
        )}
        {!isMobile && collapsed && (
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 p-0 hover:bg-pixoo-purple/10 transition-all duration-300"
            >
              <ChevronRight className="h-4 w-4 text-pixoo-purple" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto space-y-6 relative",
          collapsed && !isMobile ? "p-2" : "p-4"
        )}
      >
        {navigationSections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className={cn("space-y-2", collapsed && !isMobile && "space-y-1")}
          >
            {section.title && (!collapsed || isMobile) && (
              <h3 className="text-xs font-medium uppercase tracking-wider px-2 bg-gradient-to-r from-foreground/60 to-pixoo-purple/60 bg-clip-text text-transparent">
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
                      "w-full h-10 transition-all duration-300",
                      collapsed && !isMobile
                        ? "justify-center p-0 min-w-[2.5rem]"
                        : "justify-start gap-3 px-3",
                      item.isActive
                        ? "bg-gradient-to-r from-pixoo-purple to-pixoo-magenta text-white shadow-lg hover:shadow-xl hover:from-pixoo-magenta hover:to-pixoo-purple"
                        : "hover:bg-gradient-to-r hover:from-pixoo-purple/10 hover:to-pixoo-magenta/10 hover:border-pixoo-purple/20"
                    )}
                    title={collapsed && !isMobile ? item.label : undefined}
                    asChild
                    suppressHydrationWarning
                  >
                    <a href={item.href}>
                      <div
                        className={cn(
                          "flex items-center justify-center",
                          item.isActive ? "p-1 rounded-md bg-white/20" : ""
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                      </div>
                      {(!collapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {item.badge && (!collapsed || isMobile) && (
                        <span className="ml-auto text-xs bg-gradient-to-r from-pixoo-pink to-pixoo-magenta text-white px-2 py-1 rounded-full">
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
      <div
        className={cn(
          "border-t border-pixoo-purple/20 backdrop-blur-sm bg-card/80",
          isCollapsed && !isMobile ? "p-2" : "p-4"
        )}
      >
        <Button
          onClick={() => setShowPlansModal(true)}
          className={cn(
            "w-full bg-gradient-to-r from-pixoo-dark to-pixoo-purple hover:from-pixoo-purple hover:to-pixoo-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
            collapsed && !isMobile && "h-10 p-0 min-w-[2.5rem]"
          )}
        >
          {!collapsed || isMobile ? (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-white/20">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              {t("upgradeToPro")}
            </div>
          ) : (
            <Sparkles className="h-4 w-4 animate-pulse" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          className={cn(
            "hidden md:flex h-screen bg-background/95 backdrop-blur-sm border-r border-pixoo-purple/20 transition-all duration-300 relative overflow-hidden w-full"
          )}
        >
          <SidebarContent />
        </div>
      )}

      {/* Mobile Sidebar Content */}
      {isMobile && <SidebarContent />}

      {/* Plans Modal */}
      <SubscriptionRequiredModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        locale={locale}
      />
    </>
  );
}
