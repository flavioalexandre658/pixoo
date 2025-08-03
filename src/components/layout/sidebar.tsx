'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
} from 'lucide-react';

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
        label: t('home'),
        href: '/',
        isActive: false,
      },
      {
        icon: Search,
        label: t('explore'),
        href: '/explore',
        isActive: false,
      },
    ],
  },
  {
    title: 'Image AI',
    items: [
      {
        icon: Image,
        label: t('textToImage'),
        href: '/text-to-image',
        isActive: true,
      },
      {
        icon: ImageIcon,
        label: t('imageToImage'),
        href: '/image-to-image',
        isActive: false,
      },
      {
        icon: MessageSquare,
        label: t('imageToPrompt'),
        href: '/image-to-prompt',
        isActive: false,
      },
      {
        icon: Sparkles,
        label: t('fluxLora'),
        href: '/flux-lora',
        isActive: false,
      },
      {
        icon: Wand2,
        label: t('fluxTools'),
        href: '/flux-tools',
        isActive: false,
      },
    ],
  },
  {
    title: 'Flux Designer',
    items: [
      {
        icon: Sparkles,
        label: t('fluxDesigner'),
        href: '/flux-designer',
        isActive: false,
      },
    ],
  },
  {
    title: 'Video AI',
    items: [
      {
        icon: Video,
        label: t('textToVideo'),
        href: '/text-to-video',
        isActive: false,
      },
      {
        icon: Video,
        label: t('imageToVideo'),
        href: '/image-to-video',
        isActive: false,
      },
    ],
  },
  {
    title: 'My Creations',
    items: [
      {
        icon: History,
        label: t('history'),
        href: '/history',
        isActive: false,
      },
    ],
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = useTranslations('navigation');
  const navigationSections = getNavigationSections(t);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {(!isCollapsed || isMobile) && (
            <span className="font-semibold text-lg">Flux Pro AI</span>
          )}
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navigationSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2">
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
                    variant={item.isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 h-10',
                      isCollapsed && !isMobile && 'px-2',
                      item.isActive && 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    )}
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
      <div className="p-4 border-t">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          {(!isCollapsed || isMobile) ? t('upgradeToPro') : 'Pro'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden md:flex h-screen bg-background border-r transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
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