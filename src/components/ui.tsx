import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  highlight?: "default" | "success" | "destructive";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  highlight = "default",
}: StatCardProps) {
  const valueColors = {
    default: "text-foreground",
    success: "text-green-600 dark:text-green-400",
    destructive: "text-destructive",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {icon && (
          <span className="text-muted-foreground opacity-60">{icon}</span>
        )}
      </div>
      <div>
        <p className={`text-2xl font-bold tabular-nums ${valueColors[highlight]}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface BadgeProps {
  variant?: "default" | "success" | "destructive" | "warning" | "outline";
  children: ReactNode;
}

export function Badge({ variant = "default", children }: BadgeProps) {
  const styles = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    outline: "border border-border text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function Separator() {
  return <div className="border-t border-border" />;
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-muted-foreground opacity-30 mb-4">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
      )}
    </div>
  );
}
