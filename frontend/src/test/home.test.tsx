import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import i18n, { setLanguage } from "@/i18n";
import { priceCalc } from "@/api";
import { PriceBar } from "@/components/PriceBar";
import { WarliHero } from "@/components/art/WarliHero";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";
import { FeatureCards } from "@/components/home/FeatureCards";
import { CraftsStrip } from "@/components/home/CraftsStrip";

// Mock TanStack Router Link for isolated unit testing
vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({
      to,
      search: _search,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      to?: unknown;
      search?: unknown;
    }) => (
      <a href={typeof to === "string" ? to : "#"} {...props}>
        {children}
      </a>
    ),
  };
});

describe("PriceBar Component", () => {
  beforeEach(() => {
    setLanguage("en");
  });

  const samplePrice = priceCalc({
    materials: 150,
    hours: 10,
    rate: 100,
    ngo: 120,
    shipping: 130,
    fee: 100,
  });

  it("calculates exact totals and breakdown from priceCalc", () => {
    expect(samplePrice.total).toBe(1500);
    expect(samplePrice.components.labour).toBe(1000);
    expect(samplePrice.components.materials).toBe(150);
    expect(samplePrice.components.ngo).toBe(120);
    expect(samplePrice.components.shipping).toBe(130);
    expect(samplePrice.components.fee).toBe(100);
  });

  it("renders total price formatted in INR", () => {
    const { container } = render(<PriceBar price={samplePrice} />);
    // ₹1,500
    expect(container.textContent).toMatch(/₹\s*1,500/);
  });

  it("shows 'X% of this price is artisan wages (labour)' and 'a further Y% covers materials'", () => {
    render(<PriceBar price={samplePrice} />);

    // 1000 / 1500 = 66.7%
    // Matches in both the visible highlight card and the sr-only summary
    const wageMatches = screen.getAllByText(/66\.7% of this price is artisan wages \(labour\)/i);
    expect(wageMatches.length).toBeGreaterThanOrEqual(1);

    // 150 / 1500 = 10%
    const materialsMatches = screen.getAllByText(/a further 10% covers materials/i);
    expect(materialsMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("has distinct SVG patterns for each part so meaning never depends on colour alone", () => {
    const { container } = render(<PriceBar price={samplePrice} />);

    // Check pattern definitions
    const patternLabour = container.querySelector("pattern[id^='pat-labour-']");
    const patternMaterials = container.querySelector("pattern[id^='pat-materials-']");
    const patternNgo = container.querySelector("pattern[id^='pat-ngo-']");
    const patternShipping = container.querySelector("pattern[id^='pat-shipping-']");
    const patternFee = container.querySelector("pattern[id^='pat-fee-']");

    expect(patternLabour).toBeInTheDocument();
    expect(patternMaterials).toBeInTheDocument();
    expect(patternNgo).toBeInTheDocument();
    expect(patternShipping).toBeInTheDocument();
    expect(patternFee).toBeInTheDocument();

    // Check pattern labels in the breakdown
    expect(screen.getByText("Diagonal hatching")).toBeInTheDocument();
    expect(screen.getByText("Stippled dots")).toBeInTheDocument();
    expect(screen.getByText("Vertical stripes")).toBeInTheDocument();
    expect(screen.getByText("Diamond lattice")).toBeInTheDocument();
    expect(screen.getByText("Crosshatch mesh")).toBeInTheDocument();
  });

  it("provides an accessible text summary for screen readers", () => {
    const { container } = render(<PriceBar price={samplePrice} />);

    const srSummary = container.querySelector(".sr-only[aria-live='polite']");
    expect(srSummary).toBeInTheDocument();
    expect(srSummary?.textContent).toContain("66.7%");
    expect(srSummary?.textContent).toContain("10%");
    expect(srSummary?.textContent).toContain("artisan wages");
    expect(srSummary?.textContent).toContain("raw materials");
  });

  it("supports Hindi language via i18n", () => {
    setLanguage("hi");
    render(<PriceBar price={samplePrice} />);

    const hindiWageMatches = screen.getAllByText(
      /इस मूल्य का 66\.7% कारीगर की मज़दूरी \(श्रम\) है/i,
    );
    expect(hindiWageMatches.length).toBeGreaterThanOrEqual(1);

    const hindiMaterialsMatches = screen.getAllByText(/अन्य 10% कच्ची सामग्री के लिए है/i);
    expect(hindiMaterialsMatches.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("कुल:")).toBeInTheDocument();
  });
});

describe("WarliHero Component", () => {
  it("renders Warli dancers in a ring around a sun with rotation class", () => {
    const { container } = render(<WarliHero />);

    // Warli sun exists
    const sun = container.querySelector("#warli-sun");
    expect(sun).toBeInTheDocument();

    // Dancers ring exists with rotation animation class
    const ring = container.querySelector("#warli-dancers-ring");
    expect(ring).toBeInTheDocument();
    expect(ring).toHaveClass("warli-ring-spin");

    // Figures have circle heads and polygon triangle bodies
    const heads = ring?.querySelectorAll("circle");
    const polygons = ring?.querySelectorAll("polygon");

    expect(heads && heads.length).toBeGreaterThanOrEqual(14);
    expect(polygons && polygons.length).toBeGreaterThanOrEqual(28); // 2 triangles per dancer * 14
  });
});

describe("TriangleMotifBand Component", () => {
  it("renders repeating triangle pattern band", () => {
    const { container } = render(<TriangleMotifBand height={18} variant="alternating" />);
    const pattern = container.querySelector("pattern[id^='triangle-motif-']");
    expect(pattern).toBeInTheDocument();
    expect(pattern?.querySelectorAll("polygon").length).toBeGreaterThanOrEqual(3);
  });
});

describe("FeatureCards Component", () => {
  beforeEach(() => {
    setLanguage("en");
  });

  it("renders three feature cards for Heritage, Provenance, and Fair price", () => {
    render(<FeatureCards />);

    expect(screen.getByText("Heritage")).toBeInTheDocument();
    expect(screen.getByText("Provenance")).toBeInTheDocument();
    expect(screen.getByText("Fair price")).toBeInTheDocument();
  });

  it("renders in Hindi when language is set to hi", () => {
    setLanguage("hi");
    render(<FeatureCards />);

    expect(screen.getByText("विरासत")).toBeInTheDocument();
    expect(screen.getByText("सत्यापित मूल")).toBeInTheDocument();
    expect(screen.getByText("उचित मूल्य")).toBeInTheDocument();
  });
});

describe("CraftsStrip Component", () => {
  beforeEach(() => {
    setLanguage("en");
  });

  it("renders strip of crafts loaded from api", async () => {
    render(<CraftsStrip />);

    await waitFor(() => {
      expect(screen.getByText(/Warli painting/i)).toBeInTheDocument();
      expect(screen.getByText(/Gond painting/i)).toBeInTheDocument();
      expect(screen.getByText(/Dokra metal casting/i)).toBeInTheDocument();
      expect(screen.getByText(/Bodo weaving/i)).toBeInTheDocument();
    });
  });
});
