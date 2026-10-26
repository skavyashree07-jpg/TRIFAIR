# Heritage Roots

Build the foundation of a React + Vite + TypeScript + Tailwind web app called TRIFAIR (Hindi name: placeholder for now), a culture-first platform for tribal crafts. It combines heritage education, QR-based provenance, and a fair-price marketplace with a visible price breakdown. NGOs run it on behalf of artisans. It is a student prototype for a college project and uses SAMPLE DATA only.

RULES (non-negotiable)

- Show this banner at the top of EVERY page: "Sample data and demo only. No real payments. Independent student project."

- Do NOT use Supabase or any backend. All data comes from mock JSON in src/data, accessed ONLY through one module src/api.ts, so switching to a real API later changes one file.

- Never hard-code prices in components. Prices come from a priceCalc() function in api.ts.

- Only show records where consent_status = "consented".

- Verification wording must be "traced to a verified artisan and NGO", never "guaranteed handmade".

- Do not copy the look or wording of TRIFED's Tribes India or any other platform. No national emblem or flag.

- No stock photos. Use SVG and CSS art, labelled "illustrative, to be replaced with community-approved imagery".

LANGUAGES

English and Hindi on every screen using i18next (src/locales/en.json and hi.json with identical keys). No hard-coded visible text. Language switcher in the header. Persist choice. Set <html lang>. For Hindi: no letter-spacing, no uppercase, line-height 1.8.

DESIGN TOKENS (use CSS variables, mapped into Tailwind, so themes switch by changing variables)

Theme "Mahua dusk" (default): indigo #231A47, turmeric #F2B01E, vermilion #D8412F, leaf green #3E8E5A, chalk #FBF6EA, soot #14101F.

Alternate theme "Forest and ochre": forest #12342F, ochre #E3A82B, madder #B4332B, rice #F5EEDC.

Each theme has light and dark mode. Fonts: Yatra One (headings), Mukta (body); both support Devanagari.

IMPORTANT: turmeric, vermilion and leaf green on chalk FAIL WCAG AA as text. Use bright colours only for fills, borders and motifs. For text use darker variants (for example danger text #B8341F, success text #2E7D4B on chalk) or ink on a fill.

LAYOUT

Shared layout: banner, header (logo, nav, language switcher, display-settings menu), footer. Display-settings menu: theme, light/dark, text size (normal, large, extra large), high contrast. Persist in localStorage inside try/catch.

ACCESSIBILITY

WCAG AA contrast, keyboard navigation, visible focus, skip link, ARIA labels, buttons at least 44px high, prefers-reduced-motion support, mobile-first.

ROUTES (placeholders are fine for now)

/, /shop, /shop/:id, /verify, /verify/:token, /about, /sources, /consent, /privacy, /help, and a 404 page.

Build only the foundation now: layout, tokens, i18n, themes, router, api.ts with mock data. Do not build the full pages yet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cb6243a1-8c65-5931-bca1-ddd4792f8c1d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
