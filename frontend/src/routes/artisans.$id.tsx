import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, User, MapPin, Building2, BookOpen, ShoppingBag } from "lucide-react";
import { getArtisan, getCraft, getProducts, type Artisan, type Craft, type Product } from "@/api";
import { ProductCard } from "@/components/shop/ProductCard";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

export const Route = createFileRoute("/artisans/$id")({
  head: () => ({
    meta: [
      { title: "Artisan Profile | TRIFAIR" },
      { name: "description", content: "Learn about the indigenous artisan, their village, and their craft story." },
      { property: "og:title", content: "Artisan Profile | TRIFAIR" },
      {
        property: "og:description",
        content: "Learn about the indigenous artisan, their village, and their craft story.",
      },
    ],
  }),
  component: ArtisanDetailPage,
});

export function ArtisanDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [craft, setCraft] = useState<Craft | null>(null);
  const [artisanProducts, setArtisanProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getArtisan(id)
      .then(async (art) => {
        if (!active) return;
        if (!art) {
          setLoading(false);
          return;
        }
        setArtisan(art);

        const [crf, prods] = await Promise.all([
          getCraft(art.craft_id),
          getProducts(),
        ]);

        if (active) {
          setCraft(crf);
          setArtisanProducts(prods.filter((p) => p.artisan_id === art.id));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load artisan profile:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-6 w-36 bg-muted rounded" />
        <div className="h-64 bg-muted/60 rounded-2xl uneven-corners" />
      </div>
    );
  }

  // Respect consent_status: If artisan is not found or has pending/withdrawn consent
  if (!artisan) {
    return (
      <div className="village-wall-card uneven-corners text-center p-12 space-y-4 max-w-xl mx-auto">
        <h1 className="font-heading text-3xl text-foreground">
          {t("artisans.notFound")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("artisans.consentNotice")}
        </p>
        <Link
          to="/artisans"
          className="tap inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground uneven-corners-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t("artisans.backToList")}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <Link
          to="/artisans"
          className="tap inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t("artisans.backToList")}</span>
        </Link>
      </div>

      {/* Profile Header */}
      <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-border/80 pb-6">
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="size-16 rounded-2xl bg-accent/20 text-accent-foreground flex items-center justify-center font-heading text-3xl font-bold uneven-corners-sm shrink-0"
            >
              <User className="size-8" />
            </div>
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl text-foreground">
                {artisan.display_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                  <span>{artisan.village}</span>
                </span>
                <span>&bull;</span>
                {craft && (
                  <Link
                    to="/culture/$id"
                    params={{ id: craft.id }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {craft.name}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* "Sample" label as requested */}
          <span className="px-3 py-1 text-xs rounded-md bg-secondary text-secondary-foreground font-semibold border border-border">
            {t("artisans.sampleBadge")}
          </span>
        </div>

        {/* Endorsement and Community Story */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Building2 className="size-4 text-primary" aria-hidden="true" />
            <span>
              {t("artisans.endorsedBy")}: <strong className="text-foreground">{artisan.endorsed_by}</strong>
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="font-heading text-2xl text-foreground">
              {t("artisans.storyHeading")}
            </h2>
            <blockquote className="text-base sm:text-lg text-foreground/90 italic leading-relaxed border-l-4 border-accent pl-4 py-1">
              "{artisan.story}"
            </blockquote>
          </div>
        </div>
      </section>

      <TriangleMotifBand height={14} variant="alternating" />

      {/* Associated Products by this Artisan */}
      <section aria-labelledby="artisan-crafts-heading" className="space-y-6">
        <h2 id="artisan-crafts-heading" className="font-heading text-2xl sm:text-3xl text-foreground">
          {t("artisans.craftsHeading")}
        </h2>

        {artisanProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active pieces currently available from this artisan.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artisanProducts.map((p) => (
              <ProductCard key={p.id} product={p} craft={craft} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
