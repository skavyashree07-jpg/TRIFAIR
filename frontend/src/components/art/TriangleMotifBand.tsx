import { useId } from "react";

export interface TriangleMotifBandProps {
  className?: string;
  height?: number;
  variant?: "solid" | "alternating" | "serrated";
}

/**
 * Tribal Repeating Triangle Motif Band.
 * Renders an authentic geometric Warli / tribal border with alternating
 * upright and inverted triangles using SVG pattern fills.
 */
export function TriangleMotifBand({
  className = "",
  height = 16,
  variant = "alternating",
}: TriangleMotifBandProps) {
  const rawId = useId();
  const id = `triangle-motif-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div
      role="separator"
      aria-hidden="true"
      className={`w-full overflow-hidden select-none ${className}`}
      style={{ height: `${height}px` }}
    >
      <svg className="w-full h-full block" preserveAspectRatio="none">
        <defs>
          {variant === "alternating" && (
            <pattern id={id} width="24" height={height} patternUnits="userSpaceOnUse">
              {/* Upright triangle */}
              <polygon
                points={`0,${height} 12,0 24,${height}`}
                className="fill-accent"
                opacity="0.85"
              />
              {/* Inverted triangle interlocking */}
              <polygon
                points={`12,0 0,0 6,${height / 2}`}
                className="fill-primary"
                opacity="0.75"
              />
              <polygon
                points={`12,0 24,0 18,${height / 2}`}
                className="fill-primary"
                opacity="0.75"
              />
              {/* Divider lines */}
              <line
                x1="0"
                y1={height - 0.5}
                x2="24"
                y2={height - 0.5}
                stroke="var(--color-border)"
                strokeWidth="1"
              />
              <line x1="0" y1="0.5" x2="24" y2="0.5" stroke="var(--color-border)" strokeWidth="1" />
            </pattern>
          )}

          {variant === "serrated" && (
            <pattern id={id} width="16" height={height} patternUnits="userSpaceOnUse">
              <polygon points={`0,${height} 8,0 16,${height}`} className="fill-motif-1" />
            </pattern>
          )}

          {variant === "solid" && (
            <pattern id={id} width="20" height={height} patternUnits="userSpaceOnUse">
              <polygon points={`0,${height} 10,0 20,${height}`} className="fill-primary" />
            </pattern>
          )}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
