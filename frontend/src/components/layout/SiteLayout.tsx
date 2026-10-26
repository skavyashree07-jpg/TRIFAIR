import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Menu, Settings2, X } from "lucide-react";
import { setLanguage, syncClientLanguage, type Lang } from "@/i18n";
import { useDisplaySettings, type DisplaySettings } from "@/lib/display-settings";
import { Logo } from "@/components/art/Logo";

const NAV = [
  { to: "/", key: "nav.home" },
  { to: "/shop", key: "nav.shop" },
  { to: "/verify", key: "nav.verify" },
  { to: "/about", key: "nav.about" },
  { to: "/operations", key: "Operations" },
  { to: "/help", key: "nav.help" },
] as const;

const btn = "tap inline-flex items-center justify-center gap-2 rounded-md px-3 text-sm font-medium";

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <div role="group" aria-label={t("lang.label")} className="flex rounded-md border border-input">
      {(["en", "hi"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={i18n.language === l}
          onClick={() => setLanguage(l)}
          className={`${btn} ${i18n.language === l ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}

function Choice<K extends keyof DisplaySettings>({
  label,
  field,
  options,
}: {
  label: string;
  field: K;
  options: { value: DisplaySettings[K]; label: string }[];
}) {
  const { settings, update } = useDisplaySettings();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={settings[field] === o.value}
            onClick={() => update({ [field]: o.value } as Partial<DisplaySettings>)}
            className={`${btn} border border-input ${settings[field] === o.value ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground hover:bg-muted"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function DisplayMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="display-menu"
        aria-label={t("settings.open")}
        onClick={() => setOpen((o) => !o)}
        className={`${btn} border border-input hover:bg-muted`}
      >
        <Settings2 aria-hidden className="size-5" />
      </button>
      {open && (
        <div
          id="display-menu"
          role="dialog"
          aria-label={t("settings.open")}
          className="absolute right-0 z-50 mt-2 w-72 space-y-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
        >
          <Choice
            label={t("settings.theme")}
            field="theme"
            options={[
              { value: "mahua", label: t("settings.mahua") },
              { value: "forest", label: t("settings.forest") },
            ]}
          />
          <Choice
            label={t("settings.mode")}
            field="mode"
            options={[
              { value: "light", label: t("settings.light") },
              { value: "dark", label: t("settings.dark") },
            ]}
          />
          <Choice
            label={t("settings.textSize")}
            field="text"
            options={[
              { value: "normal", label: t("settings.normal") },
              { value: "large", label: t("settings.large") },
              { value: "xl", label: t("settings.xl") },
            ]}
          />
          <Choice
            label={t("settings.contrast")}
            field="contrast"
            options={[
              { value: false, label: t("settings.normal") },
              { value: true, label: t("settings.contrast") },
            ]}
          />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              trigger.current?.focus();
            }}
            className={`${btn} w-full bg-secondary text-secondary-foreground`}
          >
            {t("settings.close")}
          </button>
        </div>
      )}
    </div>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    syncClientLanguage();
  }, []);

  const navLinks = (onClick?: () => void) =>
    NAV.map((n) => (
      <Link
        key={n.to}
        to={n.to}
        onClick={onClick}
        activeOptions={{ exact: n.to === "/" }}
        className="tap inline-flex items-center rounded-md px-3 font-medium text-foreground hover:bg-muted data-[status=active]:underline data-[status=active]:decoration-accent data-[status=active]:decoration-4 data-[status=active]:underline-offset-8"
      >
        {t(n.key)}
      </Link>
    ));

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        {t("skip")}
      </a>
      <div
        role="note"
        className="bg-banner px-4 py-2 text-center text-sm font-medium text-banner-foreground"
      >
        {t("banner")}
      </div>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <Link
            to="/"
            className="tap flex items-center gap-2 rounded-md"
            aria-label={t("brand.name")}
          >
            <Logo className="size-10" />
            <span className="font-heading text-2xl text-foreground">{t("brand.name")}</span>
          </Link>
          <nav aria-label={t("nav.label")} className="ml-4 hidden gap-1 md:flex">
            {navLinks()}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <DisplayMenu />
            <button
              type="button"
              className={`${btn} border border-input md:hidden`}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <X aria-hidden className="size-5" />
              ) : (
                <Menu aria-hidden className="size-5" />
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-nav"
            aria-label={t("nav.label")}
            className="flex flex-col border-t border-border px-4 py-2 md:hidden"
          >
            {navLinks(() => setMenuOpen(false))}
          </nav>
        )}
        <div className="motif-band" aria-hidden />
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 focus:outline-none"
      >
        {children}
      </main>
      <footer className="border-t border-border bg-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">{t("footer.note")}</p>
          <nav aria-label={t("footer.links")} className="flex flex-wrap gap-1">
            {(["culture", "artisans", "fair-price", "stories", "about", "methodology", "sources", "consent", "privacy", "help", "report"] as const).map((k) => (
              <Link
                key={k}
                to={`/${k}` as never}
                className="tap inline-flex items-center rounded-md px-3 text-sm text-foreground underline-offset-4 hover:underline"
              >
                {k === "culture" ? t("nav.culture") : k === "artisans" ? t("nav.artisans") : k === "fair-price" ? t("nav.fairPrice") : k === "stories" ? t("nav.stories") : t(`footer.${k}`)}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
