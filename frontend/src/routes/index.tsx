import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, QrCode } from "lucide-react";
import { priceCalc } from "@/api";
import { WarliHero } from "@/components/art/WarliHero";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";
import { FeatureCards } from "@/components/home/FeatureCards";
import { CraftsStrip } from "@/components/home/CraftsStrip";
import { PriceBar } from "@/components/PriceBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRIFAIR | Tribal crafts with stories, provenance and fair prices" },
      {
        name: "description",
        content:
          "Culture-first platform for tribal crafts: heritage, QR provenance and a fair-price marketplace. Student demo.",
      },
      { property: "og:title", content: "TRIFAIR | Tribal crafts with stories and fair prices" },
      {
        property: "og:description",
        content:
          "Heritage education, QR provenance and visible price breakdowns. Student demo with sample data.",
      },
    ],
  }),
  component: HomePage,
});

export function HomePage() {
  const { t } = useTranslation();

  // Price calculation fed strictly through priceCalc in accordance with TRIFAIR rules
  // Sample inputs: materials 150, hours 10, rate 100, ngo 120, shipping 130, fee 100
  const samplePrice = priceCalc({
    materials: 150,
    hours: 10,
    rate: 100,
    ngo: 120,
    shipping: 130,
    fee: 100,
  });

  return (
    <div className="space-y-12 md:space-y-16">
      {/* ---------------- Hero Section: Village-wall feel with uneven hand-cut corners ---------------- */}
      <section
        aria-labelledby="hero-title"
        className="village-wall-card uneven-corners-lg p-6 sm:p-8 md:p-12 relative overflow-hidden"
      >
        {/* Subtle decorative Warli triangle corner accents */}
        <div
          aria-hidden="true"
          className="absolute -top-3 -right-3 size-16 bg-accent/20 rotate-45 pointer-events-none select-none"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero text & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3.5 py-1 text-xs font-semibold text-foreground uneven-corners-sm shadow-sm">
              <span className="size-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
              <span>{t("pages.home.heroBadge")}</span>
            </div>

            <h1
              id="hero-title"
              className="font-heading text-4xl sm:text-5xl lg:text-6xl text-foreground tracking-tight leading-[1.15]"
            >
              {t("pages.home.title")}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {t("pages.home.body")}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/shop"
                className="tap inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground uneven-corners-sm shadow transition-all hover:bg-primary/90 hover:scale-[1.02]"
              >
                <span>{t("pages.home.exploreShop")}</span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                to="/verify"
                className="tap inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-5 py-3.5 font-semibold text-foreground uneven-corners-sm transition-all hover:bg-muted hover:border-foreground/40"
              >
                <QrCode aria-hidden="true" className="size-4 text-muted-foreground" />
                <span>{t("pages.home.verifyCraft")}</span>
              </Link>
            </div>
          </div>

          {/* Warli Folk Art Hero (dancing figures in ring around sun) */}
          <div className="lg:col-span-5 flex justify-center">
            <WarliHero className="w-full" />
          </div>
        </div>
      </section>

      {/* Repeating Triangle Motif Band */}
      <TriangleMotifBand height={18} variant="alternating" className="opacity-90" />

      {/* Strip of Craft Names */}
      <CraftsStrip />

      {/* Three Feature Cards: Heritage, Provenance, Fair price */}
      <FeatureCards />

      {/* Repeating Triangle Motif Band */}
      <TriangleMotifBand height={16} variant="serrated" className="opacity-80" />

      {/* "Where every rupee goes" Section using PriceBar */}
      <section aria-labelledby="rupee-breakdown-heading" className="space-y-6">
        <div className="space-y-2 max-w-2xl">
          <h2
            id="rupee-breakdown-heading"
            className="font-heading text-3xl md:text-4xl text-foreground"
          >
            {t("pages.home.breakdownTitle")}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            {t("pages.home.breakdownSubtitle")}
          </p>
        </div>

        <PriceBar
          price={samplePrice}
          title={t("pages.home.breakdownCardTitle")}
          className="shadow-sm"
        />
      </section>
    </div>
  );
}
