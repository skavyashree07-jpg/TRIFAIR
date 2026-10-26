# TRIFAIR backend (Person 2)

FastAPI + SQLAlchemy 2 + SQLite. Sample data and demo only. No real payments. Independent student project.

## Run locally (Windows PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
py -c "import secrets; print(secrets.token_urlsafe(48))"
```
Put three different generated values into the three secret variables in `.env`. Existing `trifair.db` is preserved; missing tables are created compatibly. To seed only an empty database, run `py seed.py` without `--reset`. Do not use `--reset` on data you need to keep.

Start the API at the default port 8001 with `python -m app`; set `TRIFAIR_PORT` in `.env` to change it. OpenAPI is at http://127.0.0.1:8001/docs. The equivalent fixed-port command is `python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload`. Run `pytest` for the backend suite. Demo users: `admin`, `ngo_one` (ngo_s1), and `ngo_two` (ngo_s2); the password is printed only when seeding an empty database.

## Layout
- `app/pricing.py` fair-price function (Decimal), `app/qr.py` HMAC tokens, `app/audit_chain.py` hash chain, `app/ratelimit.py`: pure, no framework.
- `app/consent.py` the one place that defines what is public. Every public query is built from it.
- `app/routers/` public, price, verify, auth, orders (+ sandbox payment callback), ngo, admin.
- `vault/router.py` Design Vault endpoints (Person 4 owns this folder; working version provided).

## Contract additions (tell Persons 1, 3, 4)
The shared contract is unchanged; these are additive. Please confirm.
- **New NGO shape:** `id, name, region, consent_status, status (PENDING|ACTIVE|SUSPENDED|REVOKED), verified_on`.
- **Artisan:** `+ status (ACTIVE|SUSPENDED)`.
- **Product:** `+ listed_price, price_review (NONE|PENDING|APPROVED), price_reason`; API also returns a `price` object (components, total, artisan_share, artisan_pct, charged_total). `platform_fee` is computed by the server (TRIFAIR_PLATFORM_FEE_PCT, default 5%) on product creation; the browser cannot set it.
- **Order:** `+ quantity, artisan_share, buyer_label, payment_status`. No buyer contact data is stored.
- **PayoutLedger:** `+ ngo_id, licence_id, kind (SALE|ROYALTY)`; `order_id` and `artisan_id` are nullable so licence royalties fit.
- **Licence:** `+ created_at, decided_by, decided_on`. **Design:** `+ ngo_id`; `visibility` values are `public|view_only|private`.
- **Extra endpoints:** `GET /api/ngo/{artisans,products,orders}`, `GET /api/vault/designs`, `GET /api/vault/licences`, `POST /api/payments/callback`, `GET /api/admin/audit/verify`, `GET /api/admin/scan-alerts`, `GET /api/health`.
- `POST /api/admin/approve/{id}` takes `{type: "ngo"|"product", checklist{craft_claim,evidence,price,consent}, reason}`; `POST /api/admin/revoke/{id}` takes `{type: "product"|"artisan"|"ngo", reason}`.
- Errors use FastAPI's standard `{"detail": ...}`.

## Rules implemented
- **Price:** server recomputes everything. A listing above the breakdown total or below the artisan share is rejected; between the two it needs admin approval with a reason of 10+ characters (audited).
- **Verify:** unsigned/unknown codes return NOT_FOUND; state is read live, so revoking a product, suspending its artisan, or revoking its NGO changes the result at once. Rate limited (default 30/min per client). Scans log time and a token hash only; `scan-alerts` flags busy tokens.
- **Payouts:** PENDING to READY (automatic on DELIVERED) to PAID (NGO enters a reference; letters/digits only, never account numbers). Repeats are idempotent. Royalties from approved licences with a fee above 0 are added as `ROYALTY` entries.
- **Audit:** append-only (SQLite triggers + ORM guard), each row hashes the previous one; verify with `GET /api/admin/audit/verify`.
- **Payment callback:** HMAC `X-Signature`, idempotent on `idempotency_key`.

## Known limits (prototype)
- Rate limiter is in memory (per process). Use a shared store if you run several workers.
- The audit chain assumes a single writer (fine for SQLite). Behind multiple workers, serialize appends.
- Tables are created at startup; there are no migrations.
- JWTs are stateless and last 8 hours; there is no logout or refresh.

## Environment

Copy `.env.example` to `.env`. Set unique random values for `TRIFAIR_QR_SECRET`, `TRIFAIR_JWT_SECRET`, and `TRIFAIR_PAYMENT_SECRET`. `TRIFAIR_PORT` defaults to 8001. `TRIFAIR_CORS_ORIGINS` includes the current Vite development origin (8080), the standard Vite port (5173), and preview (4173) on localhost and 127.0.0.1. Set exact HTTPS origins on deployment. Never commit `.env` or put secrets in frontend variables.
