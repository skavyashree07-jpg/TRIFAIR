# TRIFAIR — integrated student prototype

This bundle combines Person 3's public React/TanStack frontend, Person 2's FastAPI + SQLite backend and Person 4's operations/Design Vault demo UI, plus shared JSON seed data.

> **Sample data and demo only. No real payments. Independent student project.**

## What is integrated
- Public culture/shop/artisan pages, fair-price guide, verification and English/Hindi UI from Person 3.
- FastAPI routes for public data, server-side pricing, QR verification, auth, orders, NGO operations, admin review/audit, and Design Vault/licences from Person 2.
- Person 4 NGO/admin/Vault screens at `/operations`.
- Shared seed data under `/data`; backend seed command imports it into SQLite.
- OpenAPI docs at `/docs`.

## Run locally (Windows PowerShell)

### 1. Backend
Open terminal A:
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```
Generate three different secrets:
```powershell
py -c "import secrets; print(secrets.token_urlsafe(48))"
```
Put a different generated value in each of `TRIFAIR_QR_SECRET`, `TRIFAIR_JWT_SECRET`, `TRIFAIR_PAYMENT_SECRET` in `.env`. For a local demo only, retain `TRIFAIR_DB_URL=sqlite:///./trifair.db`, and set `TRIFAIR_DATA_DIR=../data`. Then:
```powershell
py seed.py --reset
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000/docs. The seed command prints demo usernames/passwords and sample QR tokens; use only those invented demo accounts.

### 2. Frontend
Open terminal B from project root:
```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL="http://127.0.0.1:8000"
npm run dev
```
Open the Vite URL printed in terminal (usually http://localhost:5173).

## Important integration notes
- The public frontend currently uses its included sample/mock data adapter by default. In `frontend/src/api.ts`, `USE_REAL_API` is `false`; switching it to `true` is **not sufficient by itself** for every screen because response shapes and API base URL handling need a final contract pass. This is documented rather than silently claiming every public screen is API-backed.
- Person 4's `/operations` interface is retained as a functional localStorage demo from their supplied file. Its actions are not yet wired to authenticated Person 2 API endpoints. Do not use it to manage real people or live transactions. The backend Vault API is separate and documented in `/docs` (Swagger).
- The frontend/backend are suitable for local demonstration and further hardening, not immediate production deployment. Before public launch, connect all screens to the API, use managed HTTPS hosting, persistent managed database and backups, secure secret storage, migrations, production CORS, rate-limit shared storage, automated tests, security review, and reviewed/consented cultural content. Never store Aadhaar, bank account details, precise locations, card data, or real personal data in this student demo.
- All public records must have `consent_status = "consented"`. Cultural art is illustrative until replaced with community-approved material. SHA-256 records file identity, not authorship or legal ownership. The Vault is a dated record/licensing route, not legal protection.
