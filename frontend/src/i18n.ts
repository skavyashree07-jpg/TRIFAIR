import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

export const LANGS = ["en", "hi"] as const;
export type Lang = (typeof LANGS)[number];
const KEY = "trifair.lang";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, hi: { translation: hi } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

/** Call from useEffect only: restores saved language and keeps <html lang> in sync. */
export function syncClientLanguage() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* storage unavailable */
  }
  if (saved && (LANGS as readonly string[]).includes(saved) && saved !== i18n.language) {
    void i18n.changeLanguage(saved);
  }
  document.documentElement.lang = i18n.language;
}

export function setLanguage(lang: Lang) {
  void i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
}

export default i18n;
