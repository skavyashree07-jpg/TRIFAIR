import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Sparkles, ShieldCheck, Scale, ArrowRight } from "lucide-react";

export function FeatureCards() {
  const { t } = useTranslation();

  const features = [
    {
      key: "heritage",
      icon: Sparkles,
      title: t("pages.home.heritageTitle"),
      desc: t("pages.home.heritageDesc"),
      to: "/about",
      action: t("pages.home.heritageAction"),
      accentBorder: "border-accent/40 hover:border-accent",
      badgeClass: "bg-accent/15 text-accent-foreground",
    },
    {
      key: "provenance",
      icon: ShieldCheck,
      title: t("pages.home.provenanceTitle"),
      desc: t("pages.home.provenanceDesc"),
      to: "/verify",
      action: t("pages.home.provenanceAction"),
      accentBorder: "border-primary/40 hover:border-primary",
      badgeClass: "bg-primary/10 text-primary",
    },
    {
      key: "fairPrice",
      icon: Scale,
      title: t("pages.home.fairPriceTitle"),
      desc: t("pages.home.fairPriceDesc"),
      to: "/shop",
      action: t("pages.home.fairPriceAction"),
      accentBorder: "border-success/40 hover:border-success",
      badgeClass: "bg-success/15 text-success-foreground",
    },
  ] as const;

  return (
    <section aria-labelledby="features-heading" className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 id="features-heading" className="font-heading text-3xl md:text-4xl text-foreground">
          {t("pages.home.featuresTitle")}
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          {t("pages.home.featuresSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <article
              key={f.key}
              className={`village-wall-card uneven-corners p-6 md:p-7 flex flex-col justify-between transition-all hover:shadow-md ${f.accentBorder}`}
            >
              <div className="space-y-4">
                <div
                  aria-hidden="true"
                  className={`size-12 rounded-xl flex items-center justify-center uneven-corners-sm ${f.badgeClass}`}
                >
                  <Icon className="size-6" />
                </div>
                <h3 className="font-heading text-2xl text-foreground">{f.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-border/60">
                <Link
                  to={f.to}
                  className="tap inline-flex items-center gap-2 font-medium text-foreground hover:text-accent-foreground group"
                >
                  <span>{f.action}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
