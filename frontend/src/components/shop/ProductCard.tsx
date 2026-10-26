import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Tag } from "lucide-react";
import type { Craft, Product } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface ProductCardProps {
  product: Product;
  craft?: Craft | null;
}

export function ProductCard({ product, craft }: ProductCardProps) {
  const { t } = useTranslation();

  return (
    <article className="village-wall-card uneven-corners flex flex-col justify-between overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="space-y-4">
        {/* Illustrative Tribal Art Header (labeled strictly as illustrative) */}
        <div className="relative aspect-16/10 w-full overflow-hidden rounded-lg border border-border/80 bg-muted/40 flex items-center justify-center p-4">
          <svg
            viewBox="0 0 200 120"
            className="w-full h-full text-foreground/40 select-none"
            role="img"
            aria-label={t("art.label")}
          >
            {/* Background geometric grid */}
            <rect width="200" height="120" fill="transparent" />
            <circle
              cx="100"
              cy="60"
              r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Central symbolic motif */}
            <g transform="translate(100, 60)">
              <polygon points="0,-22 18,12 -18,12" fill="var(--color-motif-1)" opacity="0.6" />
              <polygon points="0,22 18,-12 -18,-12" fill="var(--color-motif-2)" opacity="0.4" />
              <circle cx="0" cy="0" r="8" fill="var(--color-motif-3)" opacity="0.8" />
              <circle cx="0" cy="-30" r="4" fill="currentColor" opacity="0.7" />
            </g>

            {/* Serrated edge accents */}
            <path
              d="M 10 110 L 25 95 L 40 110 L 55 95 L 70 110"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M 130 110 L 145 95 L 160 110 L 175 95 L 190 110"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <span className="sr-only">{t("art.label")}</span>

          {/* Status Badge positioned on the card */}
          <div className="absolute top-2.5 right-2.5">
            <StatusBadge status={product.status} />
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-2">
          {craft && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span>{craft.name}</span>
              <span>&bull;</span>
              <span>{craft.region}</span>
            </div>
          )}

          <h3 className="font-heading text-xl text-foreground line-clamp-1">{product.title}</h3>

          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

          {/* Labels chips */}
          {product.labels && product.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.labels.map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded bg-secondary/80 text-secondary-foreground font-medium"
                >
                  <Tag className="size-2.5" aria-hidden="true" />
                  <span>{lbl}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Price note (no prices on cards!) and direct link */}
      <div className="mt-5 border-t border-border/60 pt-4 space-y-3">
        <p className="text-xs text-muted-foreground italic">{t("shop.craftNotice")}</p>

        <Link
          to="/shop/$id"
          params={{ id: product.id }}
          className="tap w-full inline-flex items-center justify-between rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground uneven-corners-sm transition-all hover:bg-primary/90"
        >
          <span>{t("shop.viewDetails")}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
