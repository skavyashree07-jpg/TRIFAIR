import { useTranslation } from "react-i18next";

/**
 * Authentic Warli Folk Art Hero SVG.
 * Features:
 * - Simple figures made of a circle head and two triangles
 * - Dancers holding hands in a dance ring around the sacred sun
 * - Smooth, slow rotation of the dance ring that completely stops when prefers-reduced-motion is active
 */
export function WarliHero({ className = "" }: { className?: string }) {
  const { t } = useTranslation();

  // 14 dancing figures evenly distributed around a ring at radius 165px
  const dancerCount = 14;
  const radius = 165;
  const center = 250;

  const dancers = Array.from({ length: dancerCount }, (_, i) => {
    const angleDeg = (i * 360) / dancerCount;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = center + radius * Math.cos(angleRad);
    const y = center + radius * Math.sin(angleRad);
    // Tangent angle so dancers are oriented along the circular dance path
    const tangentDeg = angleDeg + 90;
    return { id: i, x, y, rotation: tangentDeg };
  });

  // Sun rays around the central solar disk (24 rays)
  const rayCount = 24;
  const sunRays = Array.from({ length: rayCount }, (_, i) => {
    const angleDeg = (i * 360) / rayCount;
    return angleDeg;
  });

  return (
    <div
      className={`relative overflow-hidden village-wall-card p-6 md:p-8 flex flex-col items-center justify-center ${className}`}
    >
      {/* Decorative corner tribal brackets */}
      <div
        className="absolute top-3 left-3 text-border pointer-events-none select-none"
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="0,0 24,0 0,24" opacity="0.35" />
        </svg>
      </div>
      <div
        className="absolute top-3 right-3 text-border pointer-events-none select-none"
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="24,0 24,24 0,0" opacity="0.35" />
        </svg>
      </div>

      <svg
        viewBox="0 0 500 500"
        className="w-full max-w-[440px] h-auto drop-shadow-sm select-none"
        role="img"
        aria-label={t("pages.home.warliHeroLabel")}
      >
        <defs>
          {/* Subtle clay / mud plaster texture glow */}
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
            <stop offset="70%" stopColor="var(--color-accent)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient solar warmth */}
        <circle cx="250" cy="250" r="140" fill="url(#sun-glow)" />

        {/* Outer decorative ring band with geometric dots */}
        <circle
          cx="250"
          cy="250"
          r="230"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <circle
          cx="250"
          cy="250"
          r="224"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
        />

        {/* Inner concentric boundary for dance floor */}
        <circle
          cx="250"
          cy="250"
          r="105"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />

        {/* ----------------- Central Warli Sun ----------------- */}
        <g id="warli-sun" className="text-foreground">
          {/* Sun center core */}
          <circle cx="250" cy="250" r="28" className="fill-accent" />
          <circle cx="250" cy="250" r="20" className="fill-background" />
          <circle cx="250" cy="250" r="12" className="fill-primary" />
          <circle cx="250" cy="250" r="4" className="fill-accent" />

          {/* Radiating triangular sun rays */}
          {sunRays.map((angle) => (
            <g key={angle} transform={`rotate(${angle} 250 250)`}>
              <polygon points="247,215 253,215 250,195" className="fill-foreground" />
              <circle cx="250" cy="190" r="2" className="fill-accent" />
            </g>
          ))}

          {/* Concentric sun ray ring */}
          <circle
            cx="250"
            cy="250"
            r="56"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />
        </g>

        {/* ----------------- Rotating Dance Ring ----------------- */}
        {/* Spins slowly in 60s; stops completely with prefers-reduced-motion */}
        <g
          id="warli-dancers-ring"
          className="warli-ring-spin"
          style={{ transformOrigin: "250px 250px" }}
        >
          {/* Continuous hand-holding connecting circle behind figures */}
          <circle
            cx="250"
            cy="250"
            r={radius}
            fill="none"
            stroke="var(--color-foreground)"
            strokeWidth="2"
            opacity="0.35"
          />

          {/* Warli figures: circle head + two triangles joined at tips */}
          {dancers.map(({ id, x, y, rotation }) => (
            <g
              key={id}
              transform={`translate(${x}, ${y}) rotate(${rotation})`}
              className="text-foreground"
            >
              {/* Circle Head */}
              <circle cx="0" cy="-26" r="6" className="fill-foreground" />

              {/* Upper Body: Triangle 1 (chest/shoulders tapering to waist at 0, -8) */}
              <polygon points="-11,-20 11,-20 0,-8" className="fill-foreground" />

              {/* Lower Body: Triangle 2 (tapering from waist at 0, -8 down to hips) */}
              <polygon points="0,-8 11,4 -11,4" className="fill-foreground" />

              {/* Raised arms joined in unity across the circle */}
              <path
                d="M -10,-17 Q -18,-14 -22,-6 M 10,-17 Q 18,-14 22,-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Dancing legs with rhythmic bent knees */}
              <path
                d="M -5,4 L -8,18 L -14,23 M 5,4 L 8,18 L 14,21"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>

        {/* Small tribal flora accents at the bottom edge */}
        <g className="text-muted-foreground opacity-60">
          <path d="M 40,460 L 60,430 L 80,460" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M 60,430 L 60,460" fill="none" stroke="currentColor" strokeWidth="2" />
          <path
            d="M 420,460 L 440,430 L 460,460"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M 440,430 L 440,460" fill="none" stroke="currentColor" strokeWidth="2" />
        </g>
      </svg>

      <p className="mt-3 text-xs text-muted-foreground text-center font-medium">
        {t("pages.home.warliHeroCaption")}
      </p>
    </div>
  );
}
