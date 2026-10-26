import { useId } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice, type PriceResult } from "@/api";

export interface PriceBarProps {
  price: PriceResult;
  title?: string;
  className?: string;
}

interface SegmentDef {
  key: "labour" | "materials" | "ngo" | "shipping" | "fee";
  amount: number;
  pct: number;
  patternId: string;
  bgClass: string;
  patternClass: string;
  borderClass: string;
}

export function PriceBar({ price, title, className = "" }: PriceBarProps) {
  const { t, i18n } = useTranslation();
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  const { components, total } = price;
  const { materials, labour, ngo, shipping, fee } = components;

  const labourPct = total > 0 ? Math.round((labour / total) * 1000) / 10 : 0;
  const materialsPct = total > 0 ? Math.round((materials / total) * 1000) / 10 : 0;
  const ngoPct = total > 0 ? Math.round((ngo / total) * 1000) / 10 : 0;
  const shippingPct = total > 0 ? Math.round((shipping / total) * 1000) / 10 : 0;
  const feePct = total > 0 ? Math.round((fee / total) * 1000) / 10 : 0;

  const segments: SegmentDef[] = [
    {
      key: "labour",
      amount: labour,
      pct: labourPct,
      patternId: `pat-labour-${uid}`,
      bgClass: "bg-primary text-primary-foreground",
      patternClass: "text-primary-foreground/45",
      borderClass: "border-primary-foreground/30",
    },
    {
      key: "materials",
      amount: materials,
      pct: materialsPct,
      patternId: `pat-materials-${uid}`,
      bgClass: "bg-accent text-accent-foreground",
      patternClass: "text-accent-foreground/50",
      borderClass: "border-accent-foreground/30",
    },
    {
      key: "ngo",
      amount: ngo,
      pct: ngoPct,
      patternId: `pat-ngo-${uid}`,
      bgClass: "bg-success text-success-foreground",
      patternClass: "text-success-foreground/50",
      borderClass: "border-success-foreground/30",
    },
    {
      key: "shipping",
      amount: shipping,
      pct: shippingPct,
      patternId: `pat-shipping-${uid}`,
      bgClass: "bg-destructive text-destructive-foreground",
      patternClass: "text-destructive-foreground/50",
      borderClass: "border-destructive-foreground/30",
    },
    {
      key: "fee",
      amount: fee,
      pct: feePct,
      patternId: `pat-fee-${uid}`,
      bgClass: "bg-secondary text-secondary-foreground",
      patternClass: "text-secondary-foreground/50",
      borderClass: "border-secondary-foreground/30",
    },
  ];

  const formattedTotal = formatPrice(total, i18n.language);
  const formattedLabour = formatPrice(labour, i18n.language);
  const formattedMaterials = formatPrice(materials, i18n.language);
  const formattedNgo = formatPrice(ngo, i18n.language);
  const formattedShipping = formatPrice(shipping, i18n.language);
  const formattedFee = formatPrice(fee, i18n.language);

  const wageSentence = t("price.wagesShare", { percent: labourPct });
  const materialsSentence = t("price.materialsShare", { percent: materialsPct });

  const screenReaderSummary = t("price.srSummary", {
    total: formattedTotal,
    labour: formattedLabour,
    labourPct,
    materials: formattedMaterials,
    materialsPct,
    ngo: formattedNgo,
    ngoPct,
    shipping: formattedShipping,
    shippingPct,
    fee: formattedFee,
    feePct,
  });

  return (
    <section
      aria-label={title ?? t("price.breakdownAria")}
      className={`village-wall-card p-6 md:p-8 space-y-6 ${className}`}
    >
      {/* Pattern definitions - each segment has an unmistakable tactile pattern */}
      <svg className="sr-only" aria-hidden="true" focusable="false">
        <defs>
          {/* 1. Labour: Diagonal 45-degree hatching */}
          <pattern
            id={`pat-labour-${uid}`}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="3" />
          </pattern>

          {/* 2. Materials: Stippled polka dots */}
          <pattern id={`pat-materials-${uid}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="2.2" fill="currentColor" />
          </pattern>

          {/* 3. NGO Support: Dense vertical lines */}
          <pattern id={`pat-ngo-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <line x1="4" y1="0" x2="4" y2="8" stroke="currentColor" strokeWidth="2.5" />
          </pattern>

          {/* 4. Shipping: Diamond / chevron weave */}
          <pattern id={`pat-shipping-${uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <path
              d="M 0 6 L 6 0 L 12 6 L 6 12 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </pattern>

          {/* 5. Platform fee: Crosshatch grid mesh */}
          <pattern id={`pat-fee-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 8 8 M 8 0 L 0 8" stroke="currentColor" strokeWidth="1.8" />
          </pattern>
        </defs>
      </svg>

      {/* Header and Total */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-border pb-4">
        <div>
          {title && <h3 className="font-heading text-2xl text-foreground">{title}</h3>}
          <p className="text-sm text-muted-foreground">{t("price.breakdownAria")}</p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-muted-foreground">{t("price.total")}:</span>
          <span className="font-heading text-3xl font-bold text-foreground">{formattedTotal}</span>
        </div>
      </div>

      {/* Accessible screen reader summary */}
      <div className="sr-only" aria-live="polite">
        {screenReaderSummary}
      </div>

      {/* Horizontal Segmented Bar */}
      <div>
        <div
          role="img"
          aria-label={t("price.breakdownAria")}
          className="relative flex h-10 w-full overflow-hidden rounded-md border-2 border-border shadow-inner"
        >
          {segments.map((s) => {
            if (s.amount <= 0) return null;
            const label = t(`price.${s.key}`);
            const patternLabel = t(`price.patternLabels.${s.key}`);
            const formattedAmt = formatPrice(s.amount, i18n.language);
            return (
              <div
                key={s.key}
                style={{ width: `${s.pct}%` }}
                className={`relative h-full transition-all border-r last:border-r-0 ${s.bgClass} ${s.borderClass}`}
                title={`${label}: ${formattedAmt} (${s.pct}%) - [${patternLabel}]`}
              >
                {/* SVG pattern overlay: renders pattern clearly regardless of color */}
                <svg
                  className={`absolute inset-0 h-full w-full pointer-events-none ${s.patternClass}`}
                  aria-hidden="true"
                >
                  <rect width="100%" height="100%" fill={`url(#${s.patternId})`} />
                </svg>
              </div>
            );
          })}
        </div>

        {/* Caption below bar highlighting pattern independence */}
        <p className="mt-1.5 text-xs text-muted-foreground">{t("price.accessibleNote")}</p>
      </div>

      {/* Legend & Amount Breakdown (Label, Amount, Pattern, Percentage) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
        {segments.map((s) => {
          const label = t(`price.${s.key}`);
          const formattedAmt = formatPrice(s.amount, i18n.language);
          const patternLabel = t(`price.patternLabels.${s.key}`);
          return (
            <div
              key={s.key}
              className="flex items-start gap-3 rounded-lg border border-border/80 bg-background/60 p-3"
            >
              {/* Pattern + color swatch */}
              <div
                aria-hidden="true"
                className={`relative size-8 shrink-0 rounded border ${s.bgClass} ${s.borderClass} shadow-sm overflow-hidden`}
              >
                <svg className={`absolute inset-0 h-full w-full ${s.patternClass}`}>
                  <rect width="100%" height="100%" fill={`url(#${s.patternId})`} />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground truncate">{label}</div>
                <div className="text-xs text-muted-foreground truncate">{patternLabel}</div>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className="font-semibold text-foreground">{formattedAmt}</span>
                  <span className="text-xs text-muted-foreground">{s.pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Artisan Labor and Raw Materials Highlights (strictly separate!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Wages / Labour: X% of this price is artisan wages (labour) */}
        <div className="flex items-center gap-3 rounded-xl border-2 border-primary/20 bg-primary/5 p-4 uneven-corners">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading text-lg font-bold"
          >
            {labourPct}%
          </div>
          <div>
            <p className="font-semibold text-foreground leading-snug">{wageSentence}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("price.labourNote", { hours: 10, rate: formatPrice(100, i18n.language) })}
            </p>
          </div>
        </div>

        {/* Materials: a further Y% covers materials (not income) */}
        <div className="flex items-center gap-3 rounded-xl border-2 border-accent/30 bg-accent/10 p-4 uneven-corners">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground font-heading text-lg font-bold"
          >
            {materialsPct}%
          </div>
          <div>
            <p className="font-semibold text-foreground leading-snug">{materialsSentence}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("price.materialsNote")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
