import { cn } from "@/lib/utils";

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

export function PageContainerRight({
  children,
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center min-h-[600px] rounded-xl bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm border-2 border-dashed border-pixoo-purple/30 shadow-lg shadow-pixoo-purple/10 group hover:border-pixoo-magenta/40 transition-all duration-300",
        className
      )}
    >
      {/* Gradiente de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-xl" />

      {/* Elementos decorativos internos */}
      <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 rounded-full blur-sm animate-pulse" />
      <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-purple/20 rounded-full blur-sm animate-pulse delay-700" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
