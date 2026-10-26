# TRIFAIR — integrated student prototype

TRIFAIR combines a TanStack Start marketplace and culture hub, a FastAPI + SQLite API, and an NGO operations / Design Vault demo.

> **Sample data and demo only. No real payments. Independent student project.** Records and cultural illustrations are synthetic unless explicitly reviewed and consented. Verification means traced to a verified artisan and NGO; it is not a guarantee of product quality or authorship.

## Local setup (Windows PowerShell)

### Backend

From the project root, open a terminal and run:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Generate three different secrets and put one in each corresponding variable in `backend/.env`:

```powershell
py -c "import secrets; print(secrets.token_urlsafe(48))"
```

The defaults use the existing `backend/trifair.db` file and `../data` seed directory. The app creates missing tables without deleting existing tables or records. **Do not use `--reset`** unless you intentionally want to destroy and recreate the local database. If the database has not been seeded yet, run `py seed.py` (without `--reset`).

Start the API on the configured port (default `8001`):

```powershell
python -m app
```

API docs: http://127.0.0.1:8001/docs · Health: http://127.0.0.1:8001/api/health

To use the standard Uvicorn command instead, from `backend/` run `python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload`. Change `TRIFAIR_PORT` in `.env` and use `python -m app` to select another port.

### Frontend

In a second terminal from the project root:

```powershell
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite (this project currently starts at http://127.0.0.1:8080). The Vite development proxy forwards `/api` to `http://127.0.0.1:8001`. To change that target, set `TRIFAIR_DEV_API_PROXY` before starting Vite. For a separately hosted API, set `VITE_API_BASE_URL` to its HTTPS origin; leave it unset when frontend and API share an origin. Do not set it to localhost in a production build.

## Features and demo limits

- Public craft, artisan, product, provenance, culture, story, help and fair-price pages; English and Hindi; responsive navigation and display preferences.
- Marketplace, detail pages and QR verification use the FastAPI service by default in local development. The frontend can use consent-filtered fixture data in tests or when `VITE_USE_REAL_API=false` is set.
- Backend endpoints include price calculation, QR verification, authentication, order status, NGO payout ledger, admin review/audit, and Design Vault/licence workflows. No payment provider is connected; payment callbacks are a signed sandbox demonstration.
- `/operations` is explicitly a localStorage demo and is not connected to authenticated NGO/admin API workflows. Use `/docs` for the backend's separate API workflows.
- The SQLite database is preserved. No automatic schema migrations are provided; the current app uses SQLAlchemy `create_all` for compatible creation of missing tables.
- Public API records are consent-filtered. Do not enter real personal, bank, payment-card, or precise-location data. Hashes do not establish authorship or legal ownership, and cultural illustrations need community review before public use.

## Testing and builds

```powershell
cd backend
pytest
cd ..\frontend
npm test
npm run lint
npm run build
```

Backend tests use the configured database, so use an isolated `TRIFAIR_DB_URL` when running the full suite if you need to preserve a populated database. Never run `py seed.py --reset` against the demo database you want to keep.

## Public deployment for teammates

The deployment files target Cloudflare Workers for the TanStack Start frontend and Render for the FastAPI API. Cloudflare documents support for TanStack Start on Workers ([guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)); Render provides free public Python web services ([free service guide](https://render.com/docs/free)).

Both services use their free plans. Cloudflare Workers Free currently allows up to 100,000 requests per day. Render Free allows 750 service hours per workspace each month and spins an API down after 15 minutes without traffic; the next request can take about a minute to wake it. Render's filesystem is temporary, so this deployment seeds only synthetic sample data when the service starts and any demo workflow changes (orders, payouts, etc.) can reset after a sleep, restart, or deploy. This is suitable for a no-cost class/team demo, not durable production use. ([Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/), [Render free limits](https://render.com/docs/free))

### Deployment sequence

1. Review and push the project changes to the GitHub repository. Do not commit `backend/.env`, database files, or secrets.
2. Connect the repository to Cloudflare Workers Builds with `frontend/` as the root. Use `npm ci && npm run build` as the build command and `npx nitro deploy --prebuilt` as the deploy command. The first deployment can be a temporary preview to obtain its `workers.dev` URL.
3. Create a Render Blueprint from the repository's `render.yaml`. Before its first deploy, enter the exact Cloudflare HTTPS origin in `TRIFAIR_CORS_ORIGINS` and copy the local `TRIFAIR_QR_SECRET` directly from `backend/.env` into Render's secret field. This preserves the supplied demo QR token. Render generates separate JWT, payment, and demo-password secrets; they stay in the Render dashboard. The API reseeds synthetic records when its temporary database starts empty.
4. After Render displays the API URL, set Cloudflare's **build-time** `VITE_API_BASE_URL` to that HTTPS API origin and redeploy the frontend. Then check `<API URL>/api/health`, `<API URL>/api/verify/Yl9nzfSzRnQI9WNPjuGgiQ.tKG9d1DVmMwjSuToLeKlMb`, and the deployed site's shop and verification pages from another device.

No hosting account has been connected and no deployment has been created yet. Keep both hosts on their free plans; Render may suspend the service if its free usage allowance is exceeded.

## Environment variables

Backend settings and safe example values are documented in `backend/.env.example`; hosted service configuration is in `render.yaml`. Frontend settings are `VITE_API_BASE_URL` (separate API origin), `VITE_USE_REAL_API` (set to `false` only for synthetic fixture mode), and `TRIFAIR_DEV_API_PROXY` (local Vite proxy target). Never commit `.env` files or production secrets.
