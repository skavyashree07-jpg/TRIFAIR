<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## TRIFAIR rules

- All data access goes through `src/api.ts` (mock JSON in `src/data`) — swapping to a real API must touch one file.
- Prices come only from `priceCalc()` in `src/api.ts`; never compute or hard-code prices in components.
- `src/api.ts` filters every record to `consent_status === "consented"`.
- All visible text lives in `src/locales/en.json` and `hi.json` with identical keys (tested in `src/test/api.test.ts`).
- Themes are CSS variables in `src/styles.css` switched via `html[data-theme]`, `.dark`, `.hc`, `data-text`; bright brand colours are fill-only tokens, text uses `*-text`/foreground tokens.
- Display settings and language persist in localStorage inside try/catch, read only in effects.
