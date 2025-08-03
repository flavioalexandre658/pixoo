import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageBlockProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'outline' | 'secondary';
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
  variant = 'default'
}: PageBlockProps) {
  const variantClasses = {
    default: '',
    outline: 'border-2',
    secondary: 'bg-secondary'
  };

  return (
    <Card className={cn(variantClasses[variant], className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn(!title && !description && 'pt-6')}>
        {children}
      </CardContent>
    </Card>
  );
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-2 mb-8', className)}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function PageSection({ 
  children, 
  className, 
  title, 
  description 
}: PageSectionProps) {
  return (
    <section className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}