"use client";

import { ReactNode, useRef, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    // guarda a var; default expandido (16rem)
    <div
      ref={rootRef}
      className="min-h-dvh bg-background overflow-hidden"
      style={{ ["--sidebar-w" as any]: isSidebarCollapsed ? "4rem" : "16rem" }}
    >
      {/* SIDEBAR FIXA (desktop) */}
      <aside
        className={cn(
          "hidden md:block fixed top-[var(--sat)] left-0",
          "h-[calc(100dvh-var(--sat))] w-[var(--sidebar-w)] overflow-y-auto shrink-0",
          "z-[55] bg-sidebar border-r border-sidebar-border",
          "transition-[width] duration-200 ease-out"
        )}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
        />
      </aside>

      {/* COLUNA DIREITA: segue a largura com a mesma var */}
      <div
        className={cn(
          "flex min-h-dvh flex-col overflow-y-auto scroll-container",
          "md:ml-[var(--sidebar-w)] transition-[margin] duration-200 ease-out"
        )}
      >
        <Header className="sticky-header z-40" />
        <main className={cn("flex-1 min-h-0 p-6 relative", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
