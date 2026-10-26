import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import i18n, { setLanguage } from "@/i18n";
import { getProduct, getCrafts, verifyToken } from "@/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProductCard } from "@/components/shop/ProductCard";
import { QrPassportPanel } from "@/components/shop/QrPassportPanel";
import { VerificationStamp } from "@/components/verify/VerificationStamp";
import { VerificationView } from "@/components/verify/VerificationView";

// Mock TanStack Router
vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({
      to,
      params,
      search: _search,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      to?: string | unknown;
      params?: Record<string, string>;
      search?: unknown;
    }) => {
      let href = typeof to === "string" ? to : "#";
      if (params && typeof to === "string") {
        Object.entries(params).forEach(([k, v]) => {
          href = href.replace(`$${k}`, v);
        });
      }
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: "p-101", token: "TF-SAMPLE-101" }),
    useSearch: () => ({ craft: undefined, status: undefined }),
  };
});

describe("StatusBadge Component", () => {
  beforeEach(() => {
    setLanguage("en");
  });

  it("renders status with text and icon, not color alone", () => {
    const { container, rerender } = render(<StatusBadge status="VERIFIED" />);
    expect(screen.getByText("Verified origin")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<StatusBadge status="PENDING" />);
    expect(screen.getByText("Pending verification")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<StatusBadge status="REVOKED" />);
    expect(screen.getByText("Revoked tag")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<StatusBadge status="NOT_FOUND" />);
    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("supports Hindi language for status badge", () => {
    setLanguage("hi");
    render(<StatusBadge status="VERIFIED" />);
    expect(screen.getByText("सत्यापित मूल")).toBeInTheDocument();
  });
});

describe("ProductCard Component (/shop)", () => {
  beforeEach(() => {
    setLanguage("en");
  });

  it("shows title, craft, status badge, and link to product page", async () => {
    const product = await getProduct("p-101");
    const crafts = await getCrafts();
    const craft = crafts.find((c) => c.id === product?.craft_id);

    expect(product).toBeTruthy();
    render(<ProductCard product={product!} craft={craft} />);

    expect(screen.getByText(product!.title)).toBeInTheDocument();
    expect(screen.getByText(craft!.name)).toBeInTheDocument();
    expect(screen.getByText("Verified origin")).toBeInTheDocument();

    // Link to product page
    const link = screen.getByRole("link", { name: /view craft details/i });
    expect(link).toHaveAttribute("href", "/shop/p-101");
  });

  it("does NOT show price on cards (price only on product page via priceCalc)", async () => {
    const product = await getProduct("p-101");
    const { container } = render(<ProductCard product={product!} />);

    // Must not display INR currency or numbers like ₹1,200 or ₹
    expect(container.textContent).not.toContain("₹");
    expect(screen.getByText(/price breakdown visible on craft page/i)).toBeInTheDocument();
  });
});

describe("QrPassportPanel Component (/shop/:id)", () => {
  beforeEach(() => {
    setLanguage("en");
  });

  it("shows verify state, qr token, and link to /verify/:token", async () => {
    const product = await getProduct("p-101");
    expect(product).toBeTruthy();

    render(<QrPassportPanel product={product!} />);

    expect(screen.getByText("QR Provenance Passport")).toBeInTheDocument();
    expect(screen.getByText(product!.qr_token)).toBeInTheDocument();
    expect(screen.getByText("Verified origin")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /verify this token on trifair/i });
    expect(link).toHaveAttribute("href", `/verify/${product!.qr_token}`);
  });
});

describe("VerificationStamp Component (/verify)", () => {
  beforeEach(() => {
    setLanguage("en");
  });

  it("renders VERIFIED stamp with required wording 'Traced to a verified artisan and NGO.' and aria-live", async () => {
    const result = await verifyToken("TF-SAMPLE-101");
    const { container } = render(<VerificationStamp result={result} token="TF-SAMPLE-101" />);

    // Text AND icon for stamp
    expect(screen.getByText("VERIFIED")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();

    // Word-for-word required wording: "Traced to a verified artisan and NGO."
    expect(screen.getByText("Traced to a verified artisan and NGO.")).toBeInTheDocument();

    // Screen reader aria-live region
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion?.textContent).toContain("VERIFIED");
    expect(liveRegion?.textContent).toContain("Traced to a verified artisan and NGO.");

    // Details
    expect(screen.getByText(result.artisan!)).toBeInTheDocument();
    expect(screen.getByText(result.village!)).toBeInTheDocument();
    expect(screen.getByText(result.ngo!)).toBeInTheDocument();
  });

  it("renders PENDING stamp with one-line explanation and icon", async () => {
    const result = await verifyToken("TF-SAMPLE-104");
    const { container } = render(<VerificationStamp result={result} token="TF-SAMPLE-104" />);

    const stampMatches = screen.getAllByText("PENDING");
    expect(stampMatches.length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector("svg")).toBeInTheDocument();

    const descMatches = screen.getAllByText(
      /verification review is in progress with the partner ngo/i,
    );
    expect(descMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders REVOKED stamp with one-line explanation and icon", async () => {
    const result = await verifyToken("TF-SAMPLE-111");
    const { container } = render(<VerificationStamp result={result} token="TF-SAMPLE-111" />);

    const stampMatches = screen.getAllByText("REVOKED");
    expect(stampMatches.length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector("svg")).toBeInTheDocument();

    const descMatches = screen.getAllByText(/this craft verification token has been revoked/i);
    expect(descMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders NOT FOUND stamp for unknown or non-consented tokens", async () => {
    const result = await verifyToken("UNKNOWN-999");
    const { container } = render(<VerificationStamp result={result} token="UNKNOWN-999" />);

    const stampMatches = screen.getAllByText("NOT FOUND");
    expect(stampMatches.length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector("svg")).toBeInTheDocument();

    const descMatches = screen.getAllByText(/no consented craft record found for this token/i);
    expect(descMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Hindi translations for verification stamp", () => {
    setLanguage("hi");
    const mockResult = {
      state: "VERIFIED" as const,
      artisan: "कारीगर १",
      village: "गाँव क",
      ngo: "एनजीओ १",
      verified_on: "2026-10-10",
      labels: ["sample"],
    };

    render(<VerificationStamp result={mockResult} token="TF-SAMPLE-101" />);

    const stampMatches = screen.getAllByText(/सत्यापित \(VERIFIED\)/i);
    expect(stampMatches.length).toBeGreaterThanOrEqual(1);

    const descMatches = screen.getAllByText("एक सत्यापित कारीगर और एनजीओ तक पता लगाया गया।");
    expect(descMatches.length).toBeGreaterThanOrEqual(1);
  });
});

describe("VerificationView Component", () => {
  beforeEach(() => {
    setLanguage("en");
  });

  it("provides code input form and sample test token buttons", async () => {
    render(<VerificationView initialToken="TF-SAMPLE-101" />);

    expect(screen.getByLabelText(/qr token code/i)).toBeInTheDocument();
    expect(screen.getByText("TF-SAMPLE-101")).toBeInTheDocument();
    expect(screen.getByText("TF-SAMPLE-104")).toBeInTheDocument();
    expect(screen.getByText("TF-SAMPLE-111")).toBeInTheDocument();
    expect(screen.getByText("TF-UNKNOWN-999")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("VERIFIED")).toBeInTheDocument();
      expect(screen.getByText("Traced to a verified artisan and NGO.")).toBeInTheDocument();
    });
  });
});
