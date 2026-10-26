import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles, Layers, ShieldCheck, ShoppingBag } from "lucide-react";
import { getCraft, type Craft } from "@/api";
import { GiChip } from "@/components/culture/GiChip";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

export const Route = createFileRoute("/culture/$id")({
  head: () => ({
    meta: [
      { title: "Craft Tradition Details | TRIFAIR" },
      { name: "description", content: "Explore the deep cultural heritage, making steps, and sacred symbolism." },
      { property: "og:title", content: "Craft Tradition Details | TRIFAIR" },
      {
        property: "og:description",
        content: "Explore the deep cultural heritage, making steps, and sacred symbolism.",
      },
    ],
  }),
  component: CraftDetailPage,
});

export function CraftDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const [craft, setCraft] = useState<Craft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCraft(id)
      .then((data) => {
        if (active) {
          setCraft(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load craft tradition:", err);
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

  if (!craft) {
    return (
      <div className="village-wall-card uneven-corners text-center p-12 space-y-4 max-w-xl mx-auto">
        <h1 className="font-heading text-3xl text-foreground">
          {t("culture.notFound")}
        </h1>
        <Link
          to="/culture"
          className="tap inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground uneven-corners-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t("culture.backToCulture")}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <Link
          to="/culture"
          className="tap inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t("culture.backToCulture")}</span>
        </Link>
      </div>

      {/* Header Banner */}
      <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <h1 className="font-heading text-4xl sm:text-5xl text-foreground">
              {craft.name}
            </h1>
            <p className="text-base text-muted-foreground font-medium mt-1">
              <span className="font-semibold text-foreground">{t("culture.tribe")}:</span> {craft.tribe} &bull;{" "}
              <span className="font-semibold text-foreground">{t("culture.region")}:</span> {craft.region}
            </p>
          </div>

          {/* GI Chip showing status, registry link and verified date */}
          <div className="sm:text-right">
            <GiChip giStatus={craft.gi_status} showDetails={true} />
          </div>
        </div>

        {/* History & Origins */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-heading text-2xl text-foreground">
              {t("culture.historyHeading")}
            </h2>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
            {craft.history}
          </p>
        </div>
      </section>

      <TriangleMotifBand height={16} variant="alternating" />

      {/* Two-column layout for Steps and Symbols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Making Steps */}
        <section aria-labelledby="steps-heading" className="village-wall-card uneven-corners p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-border/80 pb-3">
            <Layers className="size-5 text-primary" aria-hidden="true" />
            <h2 id="steps-heading" className="font-heading text-2xl text-foreground">
              {t("culture.stepsHeading")}
            </h2>
          </div>

          <ol className="space-y-4">
            {craft.steps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3.5 p-3.5 rounded-xl border border-border/60 bg-background/50"
              >
                <span className="size-7 rounded-lg bg-primary text-primary-foreground font-heading text-sm font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm sm:text-base text-foreground font-medium pt-0.5">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Sacred Symbols and Cultural Meanings */}
        <section aria-labelledby="symbols-heading" className="village-wall-card uneven-corners p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-border/80 pb-3">
            <Sparkles className="size-5 text-accent" aria-hidden="true" />
            <h2 id="symbols-heading" className="font-heading text-2xl text-foreground">
              {t("culture.symbolsHeading")}
            </h2>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">{t("culture.symbolContextNote")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {craft.symbols.map((sym, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border/80 bg-background/50 uneven-corners-sm flex items-start gap-3"
              >
                <div className="size-2.5 rounded-full bg-accent mt-2 shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <span className="font-medium text-foreground text-sm sm:text-base leading-snug block">{sym}</span>
                  <p className="text-xs leading-relaxed text-muted-foreground">{t(`culture.symbolMeanings.${craft.id}.${idx}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA to browse shop items */}
      <section className="village-wall-card uneven-corners p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 border border-primary/20">
        <div>
          <h3 className="font-heading text-xl text-foreground">
            {t("culture.exploreCrafts")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {craft.name} &bull; {craft.tribe}
          </p>
        </div>

        <Link
          to="/shop"
          search={{ craft: craft.id }}
          className="tap inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground uneven-corners-sm hover:bg-primary/90"
        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          <span>{t("culture.exploreCrafts")}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
