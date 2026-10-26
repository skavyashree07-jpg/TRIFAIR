import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  MapPin,
  Building2,
  Calendar,
  Tag,
} from "lucide-react";
import type { VerifyResult, VerifyState } from "@/types";

export interface VerificationStampProps {
  result: VerifyResult;
  token: string;
  className?: string;
}

export function VerificationStamp({ result, token, className = "" }: VerificationStampProps) {
  const { t } = useTranslation();
  const { state, artisan, village, ngo, verified_on, labels } = result;

  const stampConfigs: Record<
    VerifyState,
    {
      icon: typeof ShieldCheck;
      stampBorder: string;
      stampBg: string;
      stampText: string;
      titleKey: string;
      descKey: string;
    }
  > = {
    VERIFIED: {
      icon: ShieldCheck,
      stampBorder: "border-4 border-success/80 border-double",
      stampBg: "bg-success/10",
      stampText: "text-success-text",
      titleKey: "status.stampVERIFIED",
      descKey: "status.descVERIFIED",
    },
    PENDING: {
      icon: Clock,
      stampBorder: "border-4 border-accent/90 border-dashed",
      stampBg: "bg-accent/10",
      stampText: "text-foreground",
      titleKey: "status.stampPENDING",
      descKey: "status.descPENDING",
    },
    REVOKED: {
      icon: AlertTriangle,
      stampBorder: "border-4 border-destructive/90 border-solid",
      stampBg: "bg-destructive/10",
      stampText: "text-danger-text",
      titleKey: "status.stampREVOKED",
      descKey: "status.descREVOKED",
    },
    NOT_FOUND: {
      icon: HelpCircle,
      stampBorder: "border-4 border-border border-dotted",
      stampBg: "bg-muted/80",
      stampText: "text-muted-foreground",
      titleKey: "status.stampNOT_FOUND",
      descKey: "status.descNOT_FOUND",
    },
  };

  const config = stampConfigs[state] ?? stampConfigs.NOT_FOUND;
  const Icon = config.icon;
  const stampTitle = t(config.titleKey);
  const oneLineExplanation = t(config.descKey);

  return (
    <div
      role="region"
      aria-labelledby="stamp-result-heading"
      className={`village-wall-card uneven-corners p-6 md:p-8 space-y-6 ${className}`}
    >
      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite" role="status">
        {t("verify.srResultAnnounce", {
          state: stampTitle,
          explanation: oneLineExplanation,
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 id="stamp-result-heading" className="font-heading text-2xl text-foreground">
            {t("verify.resultHeading")}
          </h3>
          <p className="font-mono text-sm text-muted-foreground mt-0.5">
            {t("verify.inputLabel")}: <span className="font-bold text-foreground">{token}</span>
          </p>
        </div>

        {/* The Official Verification Stamp Element */}
        <div
          role="img"
          aria-label={`${stampTitle}: ${oneLineExplanation}`}
          className={`px-5 py-2.5 rounded-xl uppercase tracking-wider font-heading text-xl sm:text-2xl font-black flex items-center gap-2 transform -rotate-1 select-none ${config.stampBorder} ${config.stampBg} ${config.stampText}`}
        >
          <Icon className="size-6 shrink-0" aria-hidden="true" />
          <span>{stampTitle}</span>
        </div>
      </div>

      {/* One-line explanation (required wording for VERIFIED: "Traced to a verified artisan and NGO.") */}
      <div className="p-4 rounded-xl bg-background/80 border border-border/70 flex items-start gap-3">
        <Icon className={`size-5 shrink-0 mt-0.5 ${config.stampText}`} aria-hidden="true" />
        <p className="font-semibold text-foreground text-base">{oneLineExplanation}</p>
      </div>

      {/* Provenance Record Details (shown when verified/artisan data exists) */}
      {(artisan || village || ngo || verified_on || (labels && labels.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {artisan && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border/80 bg-background/50">
              <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  {t("verify.artisanLabel")}
                </span>
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {artisan}
                </span>
              </div>
            </div>
          )}

          {village && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border/80 bg-background/50">
              <MapPin className="size-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  {t("verify.villageLabel")}
                </span>
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {village}
                </span>
              </div>
            </div>
          )}

          {ngo && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border/80 bg-background/50">
              <Building2 className="size-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  {t("verify.ngoLabel")}
                </span>
                <span className="font-semibold text-foreground text-sm sm:text-base">{ngo}</span>
              </div>
            </div>
          )}

          {verified_on && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border/80 bg-background/50">
              <Calendar className="size-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  {t("verify.dateLabel")}
                </span>
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {verified_on}
                </span>
              </div>
            </div>
          )}

          {labels && labels.length > 0 && (
            <div className="sm:col-span-2 flex items-center gap-2 p-3 rounded-lg border border-border/80 bg-background/50 flex-wrap">
              <Tag className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs text-muted-foreground font-medium">
                {t("verify.labelsLabel")}:
              </span>
              {labels.map((lbl) => (
                <span
                  key={lbl}
                  className="px-2 py-0.5 text-xs rounded bg-secondary text-secondary-foreground font-medium"
                >
                  {lbl}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
