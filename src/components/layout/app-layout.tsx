"use client";

import { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto p-6 mt-4  relative",
            "mobile-content-spacing", // Nova classe para espaçamento no mobile
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
