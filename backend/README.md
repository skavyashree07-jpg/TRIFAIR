# TRIFAIR backend (Person 2)

FastAPI + SQLAlchemy 2 + SQLite. Sample data and demo only. No real payments. Independent student project.

## Run
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # fill the three secrets (python -c "import secrets; print(secrets.token_urlsafe(48))")
set -a; source .env; set +a
python seed.py --reset       # loads ../data, prints demo logins and QR tokens
uvicorn app.main:app --reload   # OpenAPI at http://localhost:8000/docs
pytest                        # all tests
```
Demo users: `admin`, `ngo_one` (ngo_s1), `ngo_two` (ngo_s2). Password is printed by the seed script.

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
