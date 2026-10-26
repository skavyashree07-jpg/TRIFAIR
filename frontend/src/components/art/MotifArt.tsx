import { useTranslation } from "react-i18next";

/** Abstract SVG motif. Illustrative only; to be replaced with community-approved imagery. */
export function MotifArt() {
  const { t } = useTranslation();
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-card">
      <svg
        viewBox="0 0 400 220"
        className="block h-auto w-full"
        role="img"
        aria-label={t("art.label")}
      >
        <rect width="400" height="220" className="fill-primary" />
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i} transform={`translate(${25 + i * 50} 110)`}>
            <path d="M0 -60 L18 -20 H-18 Z" className="fill-motif-1" />
            <circle r="10" className="fill-motif-2" />
            <path d="M-18 20 H18 L0 60 Z" className="fill-motif-3" />
          </g>
        ))}
      </svg>
      <figcaption className="px-4 py-2 text-sm text-muted-foreground">{t("art.label")}</figcaption>
    </figure>
  );
}
