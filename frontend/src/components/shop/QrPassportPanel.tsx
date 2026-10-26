import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { QrCode, ArrowRight, ShieldCheck, Check } from "lucide-react";
import type { Product } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface QrPassportPanelProps {
  product: Product;
  className?: string;
}

export function QrPassportPanel({ product, className = "" }: QrPassportPanelProps) {
  const { t } = useTranslation();

  return (
    <aside
      aria-labelledby="qr-passport-heading"
      className={`village-wall-card uneven-corners p-6 space-y-5 border-2 border-primary/20 bg-card ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" aria-hidden="true" />
            <h3 id="qr-passport-heading" className="font-heading text-xl text-foreground">
              {t("product.qrPassportHeading")}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">{t("product.qrPassportDesc")}</p>
        </div>

        <StatusBadge status={product.status} />
      </div>

      {/* Passport Token Box */}
      <div className="rounded-xl border border-dashed border-primary/40 bg-background/80 p-4 space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          {t("product.tokenCode")}
        </span>
        <div className="flex items-center justify-between gap-2 font-mono text-lg font-bold text-foreground">
          <span>{product.qr_token}</span>
          <div
            aria-hidden="true"
            className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center"
          >
            <ShieldCheck className="size-4" />
          </div>
        </div>
      </div>

      {/* Verification Details summary */}
      {product.verified_by && (
        <div className="text-xs text-muted-foreground space-y-1 border-t border-border/60 pt-3">
          <div className="flex justify-between">
            <span>{t("verify.ngoLabel")}:</span>
            <span className="font-medium text-foreground">{product.verified_by}</span>
          </div>
          {product.verified_on && (
            <div className="flex justify-between">
              <span>{t("verify.dateLabel")}:</span>
              <span className="font-medium text-foreground">{product.verified_on}</span>
            </div>
          )}
        </div>
      )}

      {/* Direct link to verify page */}
      <Link
        to="/verify/$token"
        params={{ token: product.qr_token }}
        className="tap w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground uneven-corners-sm transition-all hover:bg-primary/90 shadow-sm"
      >
        <span>{t("product.verifyButton")}</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </aside>
  );
}
