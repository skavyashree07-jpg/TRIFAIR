import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "mahua" | "forest";
export type Mode = "light" | "dark";
export type TextSize = "normal" | "large" | "xl";
export interface DisplaySettings {
  theme: Theme;
  mode: Mode;
  text: TextSize;
  contrast: boolean;
}

const KEY = "trifair.display";
const DEFAULTS: DisplaySettings = {
  theme: "mahua",
  mode: "light",
  text: "normal",
  contrast: false,
};

const Ctx = createContext<{
  settings: DisplaySettings;
  update: (p: Partial<DisplaySettings>) => void;
} | null>(null);

function apply(s: DisplaySettings) {
  const el = document.documentElement;
  el.dataset["theme"] = s.theme;
  el.dataset["text"] = s.text;
  el.classList.toggle("dark", s.mode === "dark");
  el.classList.toggle("hc", s.contrast);
}

export function DisplaySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore corrupt or unavailable storage */
    }
  }, []);

  useEffect(() => {
    apply(settings);
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  return (
    <Ctx.Provider value={{ settings, update: (p) => setSettings((s) => ({ ...s, ...p })) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDisplaySettings() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDisplaySettings outside provider");
  return c;
}
