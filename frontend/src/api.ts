/**
 * The ONLY data access module. Pages must never import src/data/*.json directly.
 * Mock mode filters out anything whose consent_status is not "consented".
 * Set USE_REAL_API = true to fetch from GET /api/* instead.
 */
import craftsData from "./data/crafts.json";
import artisansData from "./data/artisans.json";
import ngosData from "./data/ngos.json";
import productsData from "./data/products.json";
import type { Artisan, Craft, Ngo, PriceInput, PriceResult, Product, VerifyResult } from "./types";

export * from "./types";

export const USE_REAL_API = import.meta.env.VITE_USE_REAL_API
  ? import.meta.env.VITE_USE_REAL_API !== "false"
  : import.meta.env.MODE !== "test";

// Empty by default: same-origin production deployments and the Vite dev proxy.
// Set VITE_API_BASE_URL when the API is hosted on a separate origin.
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}
async function getOrNull<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

const ok = (s: string) => s === "consented";
const crafts = () => (craftsData as Craft[]).filter((c) => ok(c.consent_status));
const ngos = () => (ngosData as Ngo[]).filter((n) => ok(n.consent_status));
const artisans = () => {
  const n = new Set(ngos().map((x) => x.id));
  return (artisansData as Artisan[]).filter((a) => ok(a.consent_status) && n.has(a.ngo_id));
};
/** A product is visible only if its artisan and craft are consented. */
const products = () => {
  const a = new Set(artisans().map((x) => x.id));
  const c = new Set(crafts().map((x) => x.id));
  return (productsData as Product[]).filter((p) => a.has(p.artisan_id) && c.has(p.craft_id));
};

export async function getCrafts(): Promise<Craft[]> {
  return USE_REAL_API ? get("/api/crafts") : crafts();
}
export async function getCraft(id: string): Promise<Craft | null> {
  return USE_REAL_API
    ? getOrNull(`/api/crafts/${encodeURIComponent(id)}`)
    : (crafts().find((c) => c.id === id) ?? null);
}
export async function getArtisans(): Promise<Artisan[]> {
  return USE_REAL_API ? get("/api/artisans") : artisans();
}
export async function getArtisan(id: string): Promise<Artisan | null> {
  return USE_REAL_API
    ? getOrNull(`/api/artisans/${encodeURIComponent(id)}`)
    : (artisans().find((a) => a.id === id) ?? null);
}
export async function getProducts(): Promise<Product[]> {
  return USE_REAL_API ? get("/api/products") : products();
}
export async function getProduct(id: string): Promise<Product | null> {
  return USE_REAL_API
    ? getOrNull(`/api/products/${encodeURIComponent(id)}`)
    : (products().find((p) => p.id === id) ?? null);
}

const NOT_FOUND: VerifyResult = {
  state: "NOT_FOUND",
  artisan: null,
  village: null,
  ngo: null,
  verified_on: null,
  labels: [],
};

export async function verifyToken(token: string): Promise<VerifyResult> {
  if (USE_REAL_API) return get(`/api/verify/${encodeURIComponent(token)}`);
  const p = products().find((x) => x.qr_token === token);
  if (!p) return NOT_FOUND;
  const a = artisans().find((x) => x.id === p.artisan_id);
  const n = ngos().find((x) => x.id === a?.ngo_id);
  if (!a || !n) return NOT_FOUND;
  return {
    state: p.status,
    artisan: a.display_name,
    village: a.village,
    ngo: n.name,
    verified_on: p.verified_on,
    labels: p.labels,
  };
}

/** Single source of truth for prices. total = materials + hours*rate + ngo + shipping + fee. */
export function priceCalc({ materials, hours, rate, ngo, shipping, fee }: PriceInput): PriceResult {
  const labour = hours * rate;
  const artisan_share = materials + labour;
  const total = artisan_share + ngo + shipping + fee;
  const artisan_pct = total > 0 ? Math.round((artisan_share / total) * 1000) / 10 : 0;
  return {
    components: { materials, labour, ngo, shipping, fee },
    total,
    artisan_share,
    artisan_pct,
  };
}

/** Maps a Product's fields to priceCalc input. */
export const priceOf = (p: Product) =>
  priceCalc({
    materials: p.materials,
    hours: p.hours,
    rate: p.rate,
    ngo: p.ngo_cost,
    shipping: p.shipping,
    fee: p.platform_fee,
  });

export function formatPrice(amount: number, lang: string, currency = "INR") {
  return new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
