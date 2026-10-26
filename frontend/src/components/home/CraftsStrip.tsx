import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getCrafts, type Craft } from "@/api";

export function CraftsStrip() {
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
        console.error("Failed to load crafts for strip:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="crafts-strip-title" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
        <h2 id="crafts-strip-title" className="font-heading text-xl md:text-2xl text-foreground">
          {t("pages.home.craftsStripTitle")}
        </h2>
        <Link
          to="/shop"
          className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-accent-foreground"
        >
          {t("pages.home.viewAllCrafts")}
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-3 animate-pulse" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 w-44 rounded-xl bg-muted/60 uneven-corners-sm" />
          ))}
        </div>
      ) : (
        <ul
          role="list"
          className="flex flex-wrap items-center gap-3"
          aria-label={t("pages.home.craftsStripTitle")}
        >
          {crafts.map((craft, idx) => {
            // Alternating accent borders and earthen styles
            const isEven = idx % 2 === 0;
            return (
              <li key={craft.id} role="listitem">
                <Link
                  to="/shop"
                  search={{ craft: craft.id }}
                  className={`tap group inline-flex flex-col justify-center px-4 py-2.5 rounded-xl border transition-all uneven-corners-sm ${
                    isEven
                      ? "border-border bg-card hover:border-accent hover:bg-accent/5"
                      : "border-border bg-secondary/50 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <span className="font-heading text-base font-medium text-foreground group-hover:text-primary">
                    {craft.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {craft.tribe} &bull; {craft.region}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
