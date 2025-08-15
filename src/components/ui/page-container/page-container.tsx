import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export function PageContainerHeader({
  children,
  className,
}: PageContainerProps) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}

export function PageContainerContent({
  children,
  className,
}: PageContainerProps) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-8", className)}>
      {children}
    </div>
  );
}

export function PageContainerLeft({ children, className }: PageContainerProps) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export const PageContainerRight = forwardRef<
  HTMLDivElement,
  PageContainerProps
>(({ children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center min-h-[400px] rounded-xl bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm border-2 border-dashed border-pixoo-purple/30 shadow-lg shadow-pixoo-purple/10 group hover:border-pixoo-magenta/40 transition-all duration-300",
        className
      )}
    >
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
});

PageContainerRight.displayName = "PageContainerRight";
