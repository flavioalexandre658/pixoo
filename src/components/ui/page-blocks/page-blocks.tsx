import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageBlockProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  variant?: "default" | "outline" | "secondary";
}

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function PageBlock({
  children,
  className,
  title,
  description,
  variant = "default",
}: PageBlockProps) {
  const variantClasses = {
    default:
      "bg-gradient-to-br from-background/95 to-pixoo-purple/5 border border-pixoo-purple/20 shadow-lg shadow-pixoo-purple/10 backdrop-blur-sm",
    outline:
      "border-2 border-pixoo-purple/30 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm shadow-lg shadow-pixoo-purple/10",
    secondary:
      "bg-gradient-to-br from-pixoo-purple/10 to-pixoo-pink/10 border border-pixoo-purple/20 shadow-lg shadow-pixoo-purple/10 backdrop-blur-sm",
  };

  return (
    <div className="relative group">
      {/* Elementos decorativos flutuantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20 rounded-full blur-lg animate-pulse" />
        <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-purple/20 rounded-full blur-md animate-pulse delay-500" />
      </div>

      <Card
        className={cn(
          variantClasses[variant],
          "hover:shadow-xl hover:shadow-pixoo-purple/20 transition-all duration-300 hover:border-pixoo-magenta/30",
          className
        )}
      >
        {(title || description) && (
          <CardHeader className="relative">
            {/* Gradiente sutil no header */}
            <div className="absolute inset-0 bg-gradient-to-r from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-t-lg" />
            <div className="relative">
              {title && (
                <CardTitle className="bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-muted-foreground/80">
                  {description}
                </CardDescription>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent
          className={cn(!title && !description && "pt-6", "relative")}
        >
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("relative space-y-2 mb-8", className)}>
      {/* Elementos decorativos */}
      <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-pixoo-purple/10 to-pixoo-magenta/10 rounded-full blur-xl animate-pulse pointer-events-none" />
      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-pixoo-pink/10 to-pixoo-purple/10 rounded-full blur-lg animate-pulse delay-1000 pointer-events-none" />

      {/* Gradiente de fundo */}
      <div className="absolute inset-0 bg-gradient-to-r from-pixoo-purple/5 via-transparent to-pixoo-pink/5 rounded-xl -z-10" />

      <div className="relative">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-muted-foreground/80">{description}</p>
        )}
      </div>
    </div>
  );
}

export function PageSection({
  children,
  className,
  title,
  description,
}: PageSectionProps) {
  return (
    <section className={cn("relative space-y-6", className)}>
      {(title || description) && (
        <div className="relative space-y-2">
          {/* Elemento decorativo para seção */}
          <div className="absolute -left-3 top-0 w-1 h-full bg-gradient-to-b from-pixoo-purple via-pixoo-magenta to-pixoo-pink rounded-full" />

          <div className="pl-6">
            {title && (
              <h2 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-pixoo-purple bg-clip-text text-transparent">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground/80">{description}</p>
            )}
          </div>
        </div>
      )}
      <div className="relative">{children}</div>
    </section>
  );
}
