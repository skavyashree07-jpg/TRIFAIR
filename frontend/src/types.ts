export type ConsentStatus = "consented" | "pending" | "withdrawn";
export type GiStatusValue = "registered" | "not_registered" | "unverified";
export type ProductStatus = "PENDING" | "VERIFIED" | "REVOKED";
export type VerifyState = ProductStatus | "NOT_FOUND";

export interface GiStatus {
  status: GiStatusValue;
  registry_url: string | null;
  verified_on: string | null;
}

export interface Craft {
  id: string;
  name: string;
  tribe: string;
  region: string;
  history: string;
  steps: string[];
  symbols: string[];
  gi_status: GiStatus;
  consent_status: ConsentStatus;
  reviewed_on: string;
}

export interface Artisan {
  id: string;
  ngo_id: string;
  display_name: string;
  village: string;
  craft_id: string;
  story: string;
  consent_status: ConsentStatus;
  endorsed_by: string;
}

export interface Product {
  id: string;
  artisan_id: string;
  craft_id: string;
  title: string;
  description: string;
  images: string[];
  materials: number;
  hours: number;
  rate: number;
  ngo_cost: number;
  shipping: number;
  platform_fee: number;
  qr_token: string;
  status: ProductStatus;
  labels: string[];
  verified_by: string | null;
  verified_on: string | null;
}

export interface Ngo {
  id: string;
  name: string;
  region: string;
  verified: boolean;
  consent_status: ConsentStatus;
}

export interface PriceInput {
  materials: number;
  hours: number;
  rate: number;
  ngo: number;
  shipping: number;
  fee: number;
}

export interface PriceComponents {
  materials: number;
  labour: number;
  ngo: number;
  shipping: number;
  fee: number;
}

export interface PriceResult {
  components: PriceComponents;
  total: number;
  artisan_share: number;
  artisan_pct: number;
}

export interface VerifyResult {
  state: VerifyState;
  artisan: string | null;
  village: string | null;
  ngo: string | null;
  verified_on: string | null;
  labels: string[];
}
