import { describe, expect, it } from "vitest";
import {
  getArtisans,
  getArtisan,
  getCrafts,
  getCraft,
  getProducts,
  getProduct,
  priceCalc,
  verifyToken,
} from "@/api";
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";

describe("api", () => {
  it("hides the pending-consent artisan and their products", async () => {
    expect((await getArtisans()).map((a) => a.id)).not.toContain("art-8");
    expect(await getArtisan("art-8")).toBeNull();
    expect((await getProducts()).some((p) => p.artisan_id === "art-8")).toBe(false);
    expect(await getCrafts()).toHaveLength(4);
  });
  it("getCraft and getProduct return item or null", async () => {
    const craft = await getCraft("craft-warli");
    expect(craft?.name).toBe("Warli painting (sample)");
    expect(await getCraft("unknown")).toBeNull();

    const product = await getProduct("p-101");
    expect(product?.title).toBe("Sample item 1");
    // p-108 belongs to art-8 whose consent is pending
    expect(await getProduct("p-108")).toBeNull();
    expect(await getProduct("unknown")).toBeNull();
  });
  it("priceCalc: total = materials + hours*rate + ngo + shipping + fee and artisan_share = materials + hours*rate", () => {
    const r = priceCalc({ materials: 200, hours: 10, rate: 120, ngo: 100, shipping: 150, fee: 50 });
    expect(r.total).toBe(1700);
    expect(r.artisan_share).toBe(1400); // 200 + 10 * 120
    expect(r.artisan_pct).toBe(82.4);
    expect(r.components).toEqual({
      materials: 200,
      labour: 1200,
      ngo: 100,
      shipping: 150,
      fee: 50,
    });
  });
  it("verifyToken returns product state or NOT_FOUND", async () => {
    const v1 = await verifyToken("TF-SAMPLE-101");
    expect(v1.state).toBe("VERIFIED");
    expect(v1.artisan).toBe("Sample Artisan 1");
    expect(v1.village).toBe("Sample Village A");
    expect(v1.ngo).toBe("Sample NGO One");
    expect(v1.labels).toContain("sample");

    expect((await verifyToken("TF-SAMPLE-104")).state).toBe("PENDING");
    expect((await verifyToken("TF-SAMPLE-111")).state).toBe("REVOKED");
    expect((await verifyToken("TF-SAMPLE-108")).state).toBe("NOT_FOUND"); // pending-consent artisan
    expect((await verifyToken("nope")).state).toBe("NOT_FOUND");
  });
});

const keys = (o: object, p = ""): string[] =>
  Object.entries(o)
    .flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
    .sort();

it("en and hi locales have identical keys", () => {
  expect(keys(hi)).toEqual(keys(en));
});
