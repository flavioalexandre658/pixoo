import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pixoo-purple/5 via-background to-pixoo-magenta/5">
      {/* Subtle background decoration - only visible on larger screens */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
      <div className="hidden md:block absolute top-20 left-20 w-32 h-32 bg-pixoo-purple/10 rounded-full blur-3xl animate-pulse" />
      <div className="hidden md:block absolute bottom-20 right-20 w-40 h-40 bg-pixoo-magenta/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Main container - mobile optimized */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        <div className="bg-background/95 backdrop-blur-sm shadow-lg border border-border/50 rounded-2xl p-6 transition-all duration-300">
          {children}
        </div>
      </div>
    </div>
  );
}
