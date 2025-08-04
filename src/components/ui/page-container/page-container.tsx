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
        "flex items-center justify-center min-h-[400px] bg-muted rounded-lg border-2 border-dashed",
        className
      )}
    >
      {children}
    </div>
  );
}
