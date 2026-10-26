import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { User, MapPin, Building2, ArrowRight, Tag } from "lucide-react";
import { getArtisans, getCrafts, type Artisan, type Craft } from "@/api";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

export const Route = createFileRoute("/artisans/")({
  head: () => ({
    meta: [
      { title: "Meet the Artisans | TRIFAIR" },
      {
        name: "description",
        content: "Discover indigenous craft creators sustaining generational tribal heritage.",
      },
      { property: "og:title", content: "Meet the Artisans | TRIFAIR" },
      {
        property: "og:description",
        content: "Discover indigenous craft creators sustaining generational tribal heritage.",
      },
    ],
  }),
  component: ArtisansIndexPage,
});

export function ArtisansIndexPage() {
  const { t } = useTranslation();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getArtisans(), getCrafts()])
      .then(([artData, craftData]) => {
        if (active) {
          setArtisans(artData);
          setCrafts(craftData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load artisans:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const craftMap = useMemo(() => {
    return new Map(crafts.map((c) => [c.id, c.name]));
  }, [crafts]);

  return (
    <div className="space-y-10">
      <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-4">
        <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center uneven-corners-sm">
          <User className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl text-foreground">
          {t("artisans.title")}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
          {t("artisans.subtitle")}
        </p>
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
          {t("artisans.consentNotice")}
        </p>
      </section>

      <TriangleMotifBand height={14} variant="alternating" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-muted/60 rounded-2xl uneven-corners" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {artisans.map((artisan) => (
            <article
              key={artisan.id}
              className="village-wall-card uneven-corners p-6 sm:p-8 flex flex-col justify-between space-y-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
                  <div>
                    <h2 className="font-heading text-2xl text-foreground">
                      {artisan.display_name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1">
                      <MapPin className="size-3 text-primary" aria-hidden="true" />
                      <span>{artisan.village}</span>
                      <span>&bull;</span>
                      <span>{craftMap.get(artisan.craft_id) ?? artisan.craft_id}</span>
                    </div>
                  </div>

                  {/* "Sample" label as requested */}
                  <span className="px-2.5 py-1 text-xs rounded-md bg-secondary/80 text-secondary-foreground font-semibold border border-border">
                    {t("artisans.sampleBadge")}
                  </span>
                </div>

                <blockquote className="text-sm text-foreground/80 italic leading-relaxed line-clamp-3">
                  "{artisan.story}"
                </blockquote>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Building2 className="size-3 text-primary" aria-hidden="true" />
                  <span>
                    {t("artisans.endorsedBy")}: <strong className="text-foreground">{artisan.endorsed_by}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60">
                <Link
                  to="/artisans/$id"
                  params={{ id: artisan.id }}
                  className="tap w-full inline-flex items-center justify-between rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground uneven-corners-sm hover:bg-primary/90"
                >
                  <span>{t("artisans.viewProfile")}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
