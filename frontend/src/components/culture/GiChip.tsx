import { useTranslation } from "react-i18next";
import { ShieldCheck, Clock, ExternalLink, Info } from "lucide-react";
import type { GiStatus } from "@/types";

export interface GiChipProps {
  giStatus: GiStatus;
  className?: string;
  showDetails?: boolean;
}

/**
 * GI Chip component strictly enforcing:
 * - Never show "GI" unless status is "registered".
 * - If "unverified", show "GI status not yet verified".
 * - If "registered", show the registry link and verified date.
 */
export function GiChip({ giStatus, className = "", showDetails = false }: GiChipProps) {
  const { t } = useTranslation();
  const { status, registry_url, verified_on } = giStatus;

  if (status === "registered") {
    return (
      <div className={`space-y-2 ${className}`}>
        <span
          role="status"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-success/15 border border-success/70 text-success-text shadow-sm"
        >
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{t("culture.giRegistered")}</span>
        </span>

        {showDetails && (
          <div className="text-xs text-muted-foreground space-y-1">
            {verified_on && (
              <p>
                <span className="font-medium text-foreground">{t("culture.verifiedDate")}:</span>{" "}
                {verified_on}
              </p>
            )}
            {registry_url && (
              <a
                href={registry_url}
                target="_blank"
                rel="noopener noreferrer"
                className="tap inline-flex items-center gap-1 font-medium text-primary hover:underline underline-offset-2"
              >
                <span>{t("culture.registryLink")}</span>
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  if (status === "unverified") {
    return (
      <div className={className}>
        <span
          role="status"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-accent/15 border border-dashed border-accent/80 text-foreground shadow-sm"
        >
          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{t("culture.giUnverified")}</span>
        </span>
      </div>
    );
  }

  // Not registered - strictly avoid saying "GI" alone
  return (
    <div className={className}>
      <span
        role="status"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-dotted border-border"
      >
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{t("culture.giNotRegistered")}</span>
      </span>
    </div>
  );
}
