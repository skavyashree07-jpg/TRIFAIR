import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Search, QrCode, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { verifyToken, getProducts, type VerifyResult, type Product } from "@/api";
import { VerificationStamp } from "@/components/verify/VerificationStamp";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

export interface VerificationViewProps {
  initialToken?: string;
}

export function VerificationView({ initialToken }: VerificationViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(initialToken ?? "");
  const [activeToken, setActiveToken] = useState<string | null>(initialToken ?? null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchingProduct, setMatchingProduct] = useState<Product | null>(null);

  // Sample tokens for user testing as requested:
  // "Test tokens: use the sample products' qr_token values plus any unknown code."
  const sampleTestTokens = [
    { code: "TF-SAMPLE-101", label: t("verify.samplePillVerified"), state: "VERIFIED" },
    { code: "TF-SAMPLE-104", label: t("verify.samplePillPending"), state: "PENDING" },
    { code: "TF-SAMPLE-111", label: t("verify.samplePillRevoked"), state: "REVOKED" },
    { code: "TF-SAMPLE-108", label: t("verify.samplePillPendingArtisan"), state: "NOT_FOUND" },
    { code: "TF-UNKNOWN-999", label: t("verify.samplePillUnknown"), state: "NOT_FOUND" },
  ];

  const performVerification = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setActiveToken(trimmed);

    verifyToken(trimmed)
      .then(async (res) => {
        setResult(res);
        setLoading(false);

        // Find associated product if consented
        try {
          const prods = await getProducts();
          const p = prods.find((x) => x.qr_token === trimmed);
          setMatchingProduct(p ?? null);
        } catch {
          setMatchingProduct(null);
        }
      })
      .catch((err) => {
        console.error("Verification failed:", err);
        setResult({
          state: "NOT_FOUND",
          artisan: null,
          village: null,
          ngo: null,
          verified_on: null,
          labels: [],
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialToken) {
      setInputCode(initialToken);
      performVerification(initialToken);
    }
  }, [initialToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    navigate({ to: "/verify/$token", params: { token: inputCode.trim() } });
  };

  const handleSelectSample = (code: string) => {
    setInputCode(code);
    navigate({ to: "/verify/$token", params: { token: code } });
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Header section */}
      <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-4 text-center">
        <div className="mx-auto size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center uneven-corners-sm">
          <QrCode className="size-6" aria-hidden="true" />
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl text-foreground">{t("verify.title")}</h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          {t("verify.subtitle")}
        </p>
      </section>

      {/* Verification Input Form */}
      <section
        aria-label={t("verify.formLabel")}
        className="village-wall-card uneven-corners p-6 sm:p-8 space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            htmlFor="token-input"
            className="block font-heading text-lg text-foreground font-semibold"
          >
            {t("verify.inputLabel")}
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="token-input"
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder={t("verify.placeholder")}
                className="tap w-full rounded-xl border-2 border-input bg-background px-4 py-3 font-mono text-base uppercase text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
                required
              />
            </div>

            <button
              type="submit"
              className="tap inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground uneven-corners-sm shadow transition-all hover:bg-primary/90"
            >
              <Search className="size-4" aria-hidden="true" />
              <span>{t("verify.submit")}</span>
            </button>
          </div>
        </form>

        {/* Test tokens section for evaluation and demo convenience */}
        <div className="border-t border-border/80 pt-4 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground block">
            {t("verify.trySamples")}
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleTestTokens.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelectSample(item.code)}
                className={`tap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all hover:border-primary ${
                  activeToken === item.code
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                <span>{item.code}</span>
                <span className="opacity-75 font-sans">({item.label})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Verification result area */}
      {loading && (
        <div
          className="village-wall-card uneven-corners p-8 text-center animate-pulse"
          aria-busy="true"
        >
          <p className="text-muted-foreground">{t("verify.resultHeading")}...</p>
        </div>
      )}

      {!loading && result && activeToken && (
        <div className="space-y-6">
          <VerificationStamp result={result} token={activeToken} />

          {/* Link to associated product in shop if found */}
          {matchingProduct && (
            <div className="village-wall-card uneven-corners p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 border border-primary/20">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("verify.viewProduct")}
                </span>
                <p className="font-heading text-lg text-foreground font-semibold">
                  {matchingProduct.title}
                </p>
              </div>

              <Link
                to="/shop/$id"
                params={{ id: matchingProduct.id }}
                className="tap inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground uneven-corners-sm hover:bg-primary/90"
              >
                <span>{t("verify.viewProduct")}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}

      <TriangleMotifBand height={14} variant="serrated" className="opacity-75" />
    </div>
  );
}
