export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <circle cx="24" cy="24" r="22" className="fill-foreground" />
      <path d="M24 8 L38 34 H10 Z" className="fill-accent" />
      <path d="M24 18 L31 31 H17 Z" className="fill-foreground" />
      <circle cx="24" cy="38" r="3" className="fill-destructive" />
    </svg>
  );
}
