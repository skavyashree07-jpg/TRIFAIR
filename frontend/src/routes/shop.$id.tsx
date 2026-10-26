import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, User, Sparkles, BookOpen, Layers, CheckCircle } from "lucide-react";
import {
  getProduct,
  getArtisan,
  getCraft,
  priceOf,
  type Product,
  type Artisan,
  type Craft,
} from "@/api";
import { PriceBar } from "@/components/PriceBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QrPassportPanel } from "@/components/shop/QrPassportPanel";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

export const Route = createFileRoute("/shop/$id")({
  head: () => ({
    meta: [
      { title: "Craft Details | TRIFAIR" },
      {
        name: "description",
        content: "Sample tribal craft with transparent price breakdown and verified provenance.",
      },
      { property: "og:title", content: "Craft Details | TRIFAIR" },
      {
        property: "og:description",
        content: "Sample tribal craft with transparent price breakdown and verified provenance.",
      },
    ],
  }),
  component: ProductPage,
});

export function ProductPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const [product, setProduct] = useState<Product | null>(null);
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [craft, setCraft] = useState<Craft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProduct(id)
      .then(async (prod) => {
        if (!active) return;
        if (!prod) {
          setLoading(false);
          return;
        }
        setProduct(prod);

        const [art, crf] = await Promise.all([
          getArtisan(prod.artisan_id),
          getCraft(prod.craft_id),
        ]);

        if (active) {
          setArtisan(art);
          setCraft(crf);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load product details:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-64 bg-muted/50 rounded-2xl uneven-corners" />
        <div className="h-48 bg-muted/40 rounded-2xl uneven-corners" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="village-wall-card uneven-corners text-center p-12 space-y-4 max-w-xl mx-auto">
        <h1 className="font-heading text-3xl text-foreground">{t("product.notFoundTitle")}</h1>
        <p className="text-muted-foreground">{t("product.notFoundDesc")}</p>
        <Link
          to="/shop"
          className="tap inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground uneven-corners-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t("product.backToShop")}</span>
        </Link>
      </div>
    );
  }

  // Calculate price strictly through priceCalc via priceOf(product)
  const priceResult = priceOf(product);

  return (
    <div className="space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/shop"
          className="tap inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t("product.backToShop")}</span>
        </Link>
      </div>

      {/* Main product header layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Visual + Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="village-wall-card uneven-corners p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
              {craft && (
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {craft.name} &bull; {craft.region}
                </span>
              )}
              <StatusBadge status={product.status} />
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl text-foreground">{product.title}</h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Labels / Tags */}
            {product.labels && product.labels.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("product.labelsHeading")}:
                </span>
                {product.labels.map((lbl) => (
                  <span
                    key={lbl}
                    className="px-2.5 py-1 text-xs rounded-md bg-secondary text-secondary-foreground font-medium"
                  >
                    #{lbl}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Artisan & Community Story Section */}
          {artisan && (
            <section
              aria-labelledby="artisan-story-heading"
              className="village-wall-card uneven-corners p-6 sm:p-8 space-y-4 border-l-4 border-l-accent"
            >
              <div className="flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="size-9 rounded-lg bg-accent/20 text-accent-foreground flex items-center justify-center font-bold"
                >
                  <User className="size-5" />
                </div>
                <div>
                  <h2 id="artisan-story-heading" className="font-heading text-2xl text-foreground">
                    {t("product.artisanHeading")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {artisan.display_name} &bull; {artisan.village} ({t("product.endorsedBy")}:{" "}
                    {artisan.endorsed_by})
                  </p>
                </div>
              </div>

              <blockquote className="text-base text-foreground/90 italic leading-relaxed border-l-2 border-border pl-4">
                "{artisan.story}"
              </blockquote>
            </section>
          )}

          {/* Heritage & Craft Context */}
          {craft && (
            <section
              aria-labelledby="craft-heritage-heading"
              className="village-wall-card uneven-corners p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" aria-hidden="true" />
                <h2 id="craft-heritage-heading" className="font-heading text-xl text-foreground">
                  {t("product.craftHeading")}: {craft.name}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{craft.history}</p>

              {craft.symbols && craft.symbols.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
                    <span>{t("product.symbolsHeading")}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {craft.symbols.map((sym) => (
                      <span
                        key={sym.name}
    title={sym.meaning}
                        className="px-2.5 py-1 text-xs rounded bg-muted text-muted-foreground font-medium"
                      >
                        {sym.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right column: QR Passport Panel */}
        <div className="lg:col-span-5 space-y-6">
          <QrPassportPanel product={product} />
        </div>
      </div>

      <TriangleMotifBand height={16} variant="alternating" />

      {/* "Where every rupee goes" PriceBar Section */}
      <section aria-labelledby="product-price-breakdown-heading" className="space-y-4">
        <h2 id="product-price-breakdown-heading" className="font-heading text-3xl text-foreground">
          {t("product.priceHeading")}
        </h2>

        <PriceBar price={priceResult} />
      </section>
    </div>
  );
}
