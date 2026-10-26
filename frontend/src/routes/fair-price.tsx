import { createFileRoute } from "@tanstack/react-router";
import { useState, useId } from "react";
import { useTranslation } from "react-i18next";
import { Scale, RotateCcw, HelpCircle, CheckCircle2 } from "lucide-react";
import { priceCalc, formatPrice } from "@/api";
import { PriceBar } from "@/components/PriceBar";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

export const Route = createFileRoute("/fair-price")({
  head: () => ({
    meta: [
      { title: "Fair Price Guide & Calculator | TRIFAIR" },
      {
        name: "description",
        content: "Transparent fair-trade pricing calculator for indigenous crafts. Zero hidden middleman markups.",
      },
      { property: "og:title", content: "Fair Price Guide & Calculator | TRIFAIR" },
      {
        property: "og:description",
        content: "Transparent fair-trade pricing calculator for indigenous crafts. Zero hidden middleman markups.",
      },
    ],
  }),
  component: FairPricePage,
});

export function FairPricePage() {
  const { t, i18n } = useTranslation();

  // Initial values matching sample inputs: materials 150, hours 10, rate 100, ngo 120, shipping 130, fee 100
  const [materials, setMaterials] = useState<number>(150);
  const [hours, setHours] = useState<number>(10);
  const [rate, setRate] = useState<number>(100);
  const [ngo, setNgo] = useState<number>(120);
  const [shipping, setShipping] = useState<number>(130);
  const [fee, setFee] = useState<number>(100);

  const resetToDefaults = () => {
    setMaterials(150);
    setHours(10);
    setRate(100);
    setNgo(120);
    setShipping(130);
    setFee(100);
  };

  // priceCalc is the single source of truth for pricing calculations
  const priceResult = priceCalc({
    materials,
    hours,
    rate,
    ngo,
    shipping,
    fee,
  });

  return (
    <div className="space-y-10">
      {/* Header banner */}
      <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-4">
        <div className="size-12 rounded-xl bg-success/20 text-success-text flex items-center justify-center uneven-corners-sm">
          <Scale className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl text-foreground">
          {t("fairPrice.title")}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
          {t("fairPrice.subtitle")}
        </p>
      </section>

      <TriangleMotifBand height={14} variant="alternating" />

      {/* Formula explanation */}
      <section className="village-wall-card uneven-corners p-6 sm:p-8 space-y-3 bg-card/60">
        <h2 className="font-heading text-2xl text-foreground">
          {t("fairPrice.formulaTitle")}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t("fairPrice.formulaDesc")}
        </p>
        <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-background font-mono text-xs sm:text-sm font-semibold text-foreground">
          total = materials + (hours × rate) + ngo + shipping + fee
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section aria-labelledby="calc-heading" className="space-y-8">
        <div className="village-wall-card uneven-corners p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <h2 id="calc-heading" className="font-heading text-2xl sm:text-3xl text-foreground">
                {t("fairPrice.calcHeading")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {t("fairPrice.calcSubheading")}
              </p>
            </div>

            <button
              type="button"
              onClick={resetToDefaults}
              className="tap text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>{t("fairPrice.resetDefaults")}</span>
            </button>
          </div>

          {/* Calculator Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Raw Materials */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-background/50">
              <div className="flex justify-between items-baseline">
                <label htmlFor="materials-input" className="text-xs font-semibold text-foreground">
                  {t("fairPrice.materialsLabel")}
                </label>
                <span className="font-mono text-sm font-bold text-foreground">
                  {formatPrice(materials, i18n.language)}
                </span>
              </div>
              <input
                id="materials-input"
                type="range"
                min="50"
                max="1500"
                step="25"
                value={materials}
                onChange={(e) => setMaterials(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            {/* Hours */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-background/50">
              <div className="flex justify-between items-baseline">
                <label htmlFor="hours-input" className="text-xs font-semibold text-foreground">
                  {t("fairPrice.hoursLabel")}
                </label>
                <span className="font-mono text-sm font-bold text-foreground">
                  {hours} hrs
                </span>
              </div>
              <input
                id="hours-input"
                type="range"
                min="1"
                max="40"
                step="1"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Rate */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-background/50">
              <div className="flex justify-between items-baseline">
                <label htmlFor="rate-input" className="text-xs font-semibold text-foreground">
                  {t("fairPrice.rateLabel")}
                </label>
                <span className="font-mono text-sm font-bold text-foreground">
                  {formatPrice(rate, i18n.language)}/hr
                </span>
              </div>
              <input
                id="rate-input"
                type="range"
                min="50"
                max="300"
                step="10"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* NGO cost */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-background/50">
              <div className="flex justify-between items-baseline">
                <label htmlFor="ngo-input" className="text-xs font-semibold text-foreground">
                  {t("fairPrice.ngoLabel")}
                </label>
                <span className="font-mono text-sm font-bold text-foreground">
                  {formatPrice(ngo, i18n.language)}
                </span>
              </div>
              <input
                id="ngo-input"
                type="range"
                min="20"
                max="500"
                step="10"
                value={ngo}
                onChange={(e) => setNgo(Number(e.target.value))}
                className="w-full accent-success cursor-pointer"
              />
            </div>

            {/* Shipping */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-background/50">
              <div className="flex justify-between items-baseline">
                <label htmlFor="shipping-input" className="text-xs font-semibold text-foreground">
                  {t("fairPrice.shippingLabel")}
                </label>
                <span className="font-mono text-sm font-bold text-foreground">
                  {formatPrice(shipping, i18n.language)}
                </span>
              </div>
              <input
                id="shipping-input"
                type="range"
                min="50"
                max="400"
                step="10"
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value))}
                className="w-full accent-destructive cursor-pointer"
              />
            </div>

            {/* Platform fee */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-background/50">
              <div className="flex justify-between items-baseline">
                <label htmlFor="fee-input" className="text-xs font-semibold text-foreground">
                  {t("fairPrice.feeLabel")}
                </label>
                <span className="font-mono text-sm font-bold text-foreground">
                  {formatPrice(fee, i18n.language)}
                </span>
              </div>
              <input
                id="fee-input"
                type="range"
                min="10"
                max="300"
                step="10"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full accent-muted-foreground cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Segmented PriceBar component output */}
        <div className="space-y-4">
          <PriceBar
            price={priceResult}
            title={t("pages.home.breakdownCardTitle")}
          />
        </div>
      </section>
    </div>
  );
}
