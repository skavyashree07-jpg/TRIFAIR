import { useTranslation } from "react-i18next";
import { ShieldCheck, Clock, AlertTriangle, HelpCircle } from "lucide-react";
import type { ProductStatus, VerifyState } from "@/types";

export interface StatusBadgeProps {
  status: ProductStatus | VerifyState;
  className?: string;
  showIcon?: boolean;
}

/**
 * StatusBadge: renders status with both icon and text, plus distinct border styles
 * ensuring status meaning never depends on colour alone.
 */
export function StatusBadge({ status, className = "", showIcon = true }: StatusBadgeProps) {
  const { t } = useTranslation();

  const configs: Record<
    ProductStatus | VerifyState,
    {
      icon: typeof ShieldCheck;
      bgClass: string;
      borderClass: string;
      textClass: string;
      patternStyle: string;
    }
  > = {
    VERIFIED: {
      icon: ShieldCheck,
      bgClass: "bg-success/15",
      borderClass: "border-success/60 border-solid",
      textClass: "text-success-text font-semibold",
      patternStyle: "shadow-sm",
    },
    PENDING: {
      icon: Clock,
      bgClass: "bg-accent/15",
      borderClass: "border-accent/80 border-dashed",
      textClass: "text-foreground font-semibold",
      patternStyle: "shadow-sm",
    },
    REVOKED: {
      icon: AlertTriangle,
      bgClass: "bg-destructive/15",
      borderClass: "border-destructive/80 border-double border-2",
      textClass: "text-danger-text font-semibold",
      patternStyle: "shadow-sm",
    },
    NOT_FOUND: {
      icon: HelpCircle,
      bgClass: "bg-muted",
      borderClass: "border-border border-dotted",
      textClass: "text-muted-foreground font-semibold",
      patternStyle: "shadow-sm",
    },
  };

  const config = configs[status] ?? configs.NOT_FOUND;
  const Icon = config.icon;
  const label = t(`status.${status}`);

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border ${config.bgClass} ${config.borderClass} ${config.textClass} ${config.patternStyle} ${className}`}
    >
      {showIcon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
