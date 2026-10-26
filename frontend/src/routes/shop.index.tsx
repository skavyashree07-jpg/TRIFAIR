
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Filter, RotateCcw, Search, ArrowUpDown } from "lucide-react";
import {
  getCrafts,
  getProducts,
  getArtisans,
  type Craft,
  type Product,
  type ProductStatus,
  type Artisan,
} from "@/api";
import { ProductCard } from "@/components/shop/ProductCard";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

interface ShopSearchParams {
  craft?: string;
  status?: string;
}

type SortOption = "name-asc" | "name-desc";

export const Route = createFileRoute("/shop/")({
  validateSearch: (search: Record<string, unknown>): ShopSearchParams => ({
    craft: typeof search.craft === "string" ? search.craft : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Tribal Crafts | TRIFAIR" },
      {
        name: "description",
        content:
          "Browse tribal crafts with visible provenance and artisan stories.",
      },
      { property: "og:title", content: "Shop Tribal Crafts | TRIFAIR" },
      {
        property: "og:description",
        content:
          "Discover traditional crafts and the artisans behind them.",
      },
    ],
  }),
  component: ShopPage,
});

export function ShopPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const selectedCraft = search.craft ?? "all";
  const selectedStatus = search.status ?? "all";

  useEffect(() => {
    let active = true;

    Promise.all([getProducts(), getCrafts(), getArtisans()])
      .then(([prods, crfts, artisanList]) => {
        if (!active) return;

        setProducts(prods);
        setCrafts(crfts);
        setArtisans(artisanList);
        setLoadError(false);
      })
      .catch((err) => {
        console.error("Failed to load shop items:", err);
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const craftMap = useMemo(
    () => new Map(crafts.map((craft) => [craft.id, craft])),
    [crafts],
  );

  const artisanMap = useMemo(
    () => new Map(artisans.map((artisan) => [artisan.id, artisan])),
    [artisans],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    const result = products.filter((product) => {
      if (selectedCraft !== "all" && product.craft_id !== selectedCraft) {
        return false;
      }

      if (selectedStatus !== "all" && product.status !== selectedStatus) {
        return false;
      }

      if (normalizedQuery) {
        const craft = craftMap.get(product.craft_id);
        const artisan = artisanMap.get(product.artisan_id);

        const searchableText = [
          product.title,
          product.description,
          ...(product.labels ?? []),
          craft?.name,
          craft?.tribe,
          craft?.region,
          artisan?.display_name,
          artisan?.village,
          artisan?.story,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();

        if (!searchableText.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, undefined, {
        sensitivity: "base",
      });

      return sortBy === "name-asc" ? comparison : -comparison;
    });

    return result;
  }, [
    products,
    selectedCraft,
    selectedStatus,
    query,
    sortBy,
    craftMap,
    artisanMap,
  ]);

  const hasActiveFilters =
    selectedCraft !== "all" ||
    selectedStatus !== "all" ||
    query.trim() !== "" ||
    sortBy !== "name-asc";

  const resetFilters = () => {
    setQuery("");
    setSortBy("name-asc");
    navigate({ search: {} });
  };

  const updateFilters = (craftVal: string, statusVal: string) => {
    navigate({
      search: {
        craft: craftVal === "all" ? undefined : craftVal,
        status: statusVal === "all" ? undefined : statusVal,
      },
    });
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-4">
        <h1 className="font-heading text-4xl sm:text-5xl text-foreground">
          {t("shop.title")}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
          {t("shop.subtitle")}
        </p>
      </section>

      <TriangleMotifBand height={14} variant="alternating" />

      {/* Search, sort and filters */}
      <section
        aria-label="Shop search and filters"
        className="village-wall-card uneven-corners p-5 space-y-5 bg-card/60"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="size-4 text-primary" aria-hidden="true" />
            <span>Find your craft</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="tap text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>{t("shop.resetFilters")}</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <label
            htmlFor="product-search"
            className="text-xs font-semibold text-muted-foreground"
          >
            Search products, crafts or artisans
          </label>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="product-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try a craft, village or artisan name..."
              className="w-full tap rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Craft, status and sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="craft-filter"
              className="text-xs font-semibold text-muted-foreground"
            >
              {t("shop.filterCraft")}
            </label>
            <select
              id="craft-filter"
              value={selectedCraft}
              onChange={(event) =>
                updateFilters(event.target.value, selectedStatus)
              }
              className="w-full tap rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">{t("shop.allCrafts")}</option>
              {crafts.map((craft) => (
                <option key={craft.id} value={craft.id}>
                  {craft.name} ({craft.region})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="status-filter"
              className="text-xs font-semibold text-muted-foreground"
            >
              {t("shop.filterStatus")}
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(event) =>
                updateFilters(selectedCraft, event.target.value)
              }
              className="w-full tap rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">{t("shop.allStatuses")}</option>
              {(["VERIFIED", "PENDING", "REVOKED"] as ProductStatus[]).map(
                (status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="product-sort"
              className="text-xs font-semibold text-muted-foreground"
            >
              Sort products
            </label>
            <div className="relative">
              <ArrowUpDown
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <select
                id="product-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className="w-full tap rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
              </select>
            </div>
          </div>
        </div>

        <div
          className="text-xs text-muted-foreground border-t border-border/60 pt-3"
          aria-live="polite"
        >
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </section>

      {/* Loading */}
      {loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse"
          aria-busy="true"
          aria-label="Loading products"
        >
          {[1, 2, 3, 4, 5, 6].map((number) => (
            <div
              key={number}
              className="h-80 rounded-2xl bg-muted/50 uneven-corners"
            />
          ))}
        </div>
      ) : loadError ? (
        <div className="village-wall-card uneven-corners text-center p-12 space-y-4">
          <p className="text-lg text-muted-foreground">
            We couldn't load the shop right now. Please check your connection
            and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="tap inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground uneven-corners-sm"
          >
            Try again
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="village-wall-card uneven-corners text-center p-12 space-y-4">
          <p className="text-lg text-muted-foreground">
            {query.trim()
              ? "No products match your search and filters."
              : t("shop.noProducts")}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="tap inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground uneven-corners-sm"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span>{t("shop.resetFilters")}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="space-y-3">
              <ProductCard
                product={product}
                craft={craftMap.get(product.craft_id)}
              />

              {(() => {
                const artisan = artisanMap.get(product.artisan_id);

                if (!artisan) return null;

                return (
                  <div className="village-wall-card uneven-corners p-4 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Made by
                    </p>
                    <p className="font-heading text-base text-foreground">
                      {artisan.display_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {artisan.village}
                    </p>
                    {artisan.story && (
                      <p className="text-sm text-muted-foreground line-clamp-3 pt-1">
                        {artisan.story}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
