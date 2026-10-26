import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, Sparkles, Layers } from "lucide-react";
import { getCrafts, type Craft } from "@/api";
import { GiChip } from "@/components/culture/GiChip";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

export const Route = createFileRoute("/culture/")({
  head: () => ({
    meta: [
      { title: "Culture Hub & Craft Traditions | TRIFAIR" },
      {
        name: "description",
        content: "Explore the living traditions, sacred symbolism, and creation techniques of tribal crafts.",
      },
      { property: "og:title", content: "Culture Hub & Craft Traditions | TRIFAIR" },
      {
        property: "og:description",
        content: "Explore the living traditions, sacred symbolism, and creation techniques of tribal crafts.",
      },
    ],
  }),
  component: CultureIndexPage,
});

export function CultureIndexPage() {
  const { t } = useTranslation();
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCrafts()
      .then((data) => {
        if (active) {
          setCrafts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load crafts:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-10">
      <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-4">
        <div className="size-12 rounded-xl bg-accent/20 text-accent-foreground flex items-center justify-center uneven-corners-sm">
          <BookOpen className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl text-foreground">
          {t("culture.title")}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
          {t("culture.subtitle")}
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
          {crafts.map((craft) => (
            <article
              key={craft.id}
              className="village-wall-card uneven-corners p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-4">
                  <div>
                    <h2 className="font-heading text-2xl text-foreground">
                      {craft.name}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {craft.tribe} &bull; {craft.region}
                    </p>
                  </div>

                  <GiChip giStatus={craft.gi_status} />
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {craft.history}
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
                    <span>{craft.symbols.length} {t("culture.symbolsHeading").toLowerCase()}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers className="size-3.5 text-primary" aria-hidden="true" />
                    <span>{craft.steps.length} {t("culture.stepsHeading").toLowerCase()}</span>
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <Link
                  to="/culture/$id"
                  params={{ id: craft.id }}
                  className="tap inline-flex items-center gap-2 font-semibold text-primary hover:text-primary/80"
                >
                  <span>{t("culture.viewTradition")}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>

                <Link
                  to="/shop"
                  search={{ craft: craft.id }}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  {t("culture.exploreCrafts")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
